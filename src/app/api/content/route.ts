import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getVideoInfo, validateVideoId } from '@/services/youtube';
import { config } from '@/lib/config';
import { getUserId } from '@/lib/auth';
import { createContentJsonSchema, sourceTypeEnum } from '@/lib/validation';
import { ZodError } from 'zod';
import fileType from 'file-type';
import { uploadFile, generateFileKey } from '@/lib/storage';

// Allowed MIME types with their corresponding source types
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  'audio/x-m4a': 'audio',
  'audio/m4a': 'audio',
  'audio/mp4': 'audio',
  'video/mp4': 'video',
  'video/quicktime': 'video',
  'video/x-msvideo': 'video',
  'application/pdf': 'pdf',
};

// Maximum file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Validate file by reading magic bytes (not just extension)
 */
async function validateFileType(buffer: Buffer): Promise<{ valid: boolean; sourceType?: string; mime?: string }> {
  try {
    const detectedType = await fileType.fromBuffer(buffer);
    if (!detectedType) {
      return { valid: false };
    }
    
    // Map file-type MIME to our source types
    const mimeToSourceType: Record<string, string> = {
      'audio/mpeg': 'audio',
      'audio/mp3': 'audio',
      'audio/wav': 'audio',
      'audio/x-m4a': 'audio',
      'audio/m4a': 'audio',
      'audio/mp4': 'audio',
      'video/mp4': 'video',
      'application/pdf': 'pdf',
    };

    const sourceType = mimeToSourceType[detectedType.mime];
    if (!sourceType) {
      return { valid: false };
    }
    
    return { valid: true, sourceType, mime: detectedType.mime };
  } catch {
    return { valid: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    
    let sourceType: string;
    let sourceUrl: string | undefined;
    let sourceFile: string | undefined;
    let title = 'Untitled';

    // Handle FormData (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const rawSourceType = formData.get('sourceType') as string;
      const fileEntry = formData.get('file');
      
      // Validate source type
      if (!rawSourceType || !['audio', 'video', 'pdf'].includes(rawSourceType)) {
        return NextResponse.json({ error: 'Valid source type required (audio, video, pdf)' }, { status: 400 });
      }

      if (!fileEntry) {
        return NextResponse.json({ error: 'File upload required' }, { status: 400 });
      }

      // Check file size
      const file = fileEntry as File;
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File too large. Maximum size is 100MB.' }, { status: 400 });
      }

      // Read file and validate type by magic bytes
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const typeValidation = await validateFileType(buffer);
      if (!typeValidation.valid || typeValidation.sourceType !== rawSourceType) {
        return NextResponse.json({ 
          error: `Invalid file type. Expected ${rawSourceType}, but file content doesn't match.` 
        }, { status: 400 });
      }

      // ✅ Upload to S3 instead of local filesystem (required for Railway)
      try {
        const s3Key = generateFileKey(userId, rawSourceType, file.name);
        await uploadFile(s3Key, buffer, typeValidation.mime || 'application/octet-stream');
        sourceFile = s3Key;
        sourceType = rawSourceType;
        title = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      } catch (s3Error) {
        console.error('S3 upload failed:', s3Error);
        
        // Check if S3 is configured
        if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
          return NextResponse.json({ 
            error: 'File storage not configured. Set AWS credentials or use YouTube URLs for now.' 
          }, { status: 500 });
        }
        
        return NextResponse.json({ 
          error: 'Failed to upload file. Please try again.' 
        }, { status: 500 });
      }
    } 
    // Handle JSON (YouTube URL)
    else {
      let body;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
      }

      // Validate input
      const validated = createContentJsonSchema.safeParse(body);
      if (!validated.success) {
        return NextResponse.json({ error: 'Invalid input', details: validated.error.errors }, { status: 400 });
      }

      sourceType = validated.data.sourceType;
      sourceUrl = validated.data.sourceUrl;

      if (sourceType === 'youtube') {
        if (!sourceUrl) {
          return NextResponse.json({ error: 'YouTube URL required' }, { status: 400 });
        }

        // Validate YouTube URL and extract video ID
        const videoId = validateVideoId(sourceUrl);
        if (!videoId) {
          return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }

        // Get video title for YouTube
        try {
          const videoInfo = await getVideoInfo(sourceUrl);
          title = videoInfo.title;
        } catch (e) {
          console.error('Failed to fetch video info:', e);
          return NextResponse.json({ error: 'Failed to fetch video info. Please check the URL.' }, { status: 400 });
        }
      } else if (!sourceUrl) {
        return NextResponse.json({ error: 'Source URL required' }, { status: 400 });
      }
    }

    // Create content record
    const content = await prisma.content.create({
      data: {
        userId,
        sourceType,
        sourceUrl,
        sourceFile,
        title,
        status: 'pending',
      },
    });

    // For demo: Auto-generate mock outputs asynchronously
    const contentId = content.id;
    
    fetch(`${config.appUrl}/api/content/${contentId}/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    }).catch(err => console.error('Background generation failed:', err));

    return NextResponse.json({
      success: true,
      contentId: content.id,
      status: 'processing',
    });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { error: 'Failed to process content' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (contentId) {
      // Get single content with outputs - MUST verify ownership
      const content = await prisma.content.findFirst({
        where: { id: contentId, userId }, // ✅ Enforce ownership
        include: { 
          outputs: true,
          _count: { select: { outputs: true } }
        },
      });

      if (!content) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 });
      }

      return NextResponse.json({ content });
    }

    // Get all content for user
    const contents = await prisma.content.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { _count: { select: { outputs: true } } },
    });

    return NextResponse.json({ contents });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
