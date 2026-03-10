import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getVideoInfo, validateVideoId } from '@/services/youtube';
import { config } from '@/lib/config';
import { getUserId } from '@/lib/auth';
import { createContentJsonSchema } from '@/lib/validation';
import fileType from 'file-type';
import { uploadFile, generateFileKey } from '@/lib/storage';

// Maximum file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

interface FileUploadResult {
  sourceType: string;
  sourceFile: string;
  title: string;
}

interface YouTubeSubmissionResult {
  sourceType: string;
  sourceUrl: string;
  title: string;
}

/**
 * Validate file by reading magic bytes (not just extension)
 */
async function validateFileType(buffer: Buffer): Promise<{ valid: boolean; sourceType?: string; mime?: string }> {
  try {
    const detectedType = await fileType.fromBuffer(buffer);
    if (!detectedType) {
      return { valid: false };
    }

    const mimeToSourceType: Record<string, string> = {
      'audio/mpeg': 'audio',
      'audio/mp3': 'audio',
      'audio/wav': 'audio',
      'audio/x-wav': 'audio',
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

/**
 * Process file upload from multipart form data
 */
async function processFileUpload(
  formData: FormData,
  userId: string
): Promise<FileUploadResult | NextResponse> {
  const rawSourceType = formData.get('sourceType') as string;
  const file = formData.get('file');

  // Validate source type
  if (!rawSourceType || !['audio', 'video', 'pdf'].includes(rawSourceType)) {
    return NextResponse.json(
      { error: 'Valid source type required (audio, video, pdf)' },
      { status: 400 }
    );
  }

  if (!file) {
    return NextResponse.json(
      { error: 'File upload required' },
      { status: 400 }
    );
  }

  // Check file size (file must be a File object)
  if (typeof file !== 'object' || file === null || !('size' in file)) {
    return NextResponse.json(
      { error: 'Invalid file upload' },
      { status: 400 }
    );
  }

  const fileObj = file as { size: number; name: string; arrayBuffer: () => Promise<ArrayBuffer> };
  if (fileObj.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 100MB.' },
      { status: 400 }
    );
  }

  // Read file and validate type by magic bytes
  const bytes = await fileObj.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const typeValidation = await validateFileType(buffer);
  if (!typeValidation.valid || typeValidation.sourceType !== rawSourceType) {
    return NextResponse.json(
      { error: `Invalid file type. Expected ${rawSourceType}, but file content doesn't match.` },
      { status: 400 }
    );
  }

  // Upload to S3
  try {
    const s3Key = generateFileKey(userId, rawSourceType, fileObj.name);
    await uploadFile(s3Key, buffer, typeValidation.mime || 'application/octet-stream');

    return {
      sourceType: rawSourceType,
      sourceFile: s3Key,
      title: fileObj.name.replace(/\.[^/.]+$/, ''), // Remove extension
    };
  } catch (s3Error) {
    console.error('S3 upload failed:', s3Error);

    // Check if S3 is configured
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
      return NextResponse.json(
        { error: 'File storage not configured. Set AWS credentials or use YouTube URLs for now.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to upload file. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Process YouTube URL submission
 */
async function processYouTubeSubmission(
  body: unknown
): Promise<YouTubeSubmissionResult | NextResponse> {
  // Validate input
  const validated = createContentJsonSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validated.error.errors },
      { status: 400 }
    );
  }

  const { sourceType, sourceUrl } = validated.data;

  if (sourceType === 'youtube') {
    if (!sourceUrl) {
      return NextResponse.json(
        { error: 'YouTube URL required' },
        { status: 400 }
      );
    }

    // Validate YouTube URL and extract video ID
    const videoId = validateVideoId(sourceUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Get video title
    try {
      const videoInfo = await getVideoInfo(sourceUrl);
      return {
        sourceType,
        sourceUrl,
        title: videoInfo.title,
      };
    } catch (e) {
      console.error('Failed to fetch video info:', e);
      return NextResponse.json(
        { error: 'Failed to fetch video info. Please check URL.' },
        { status: 400 }
      );
    }
  } else if (!sourceUrl) {
    return NextResponse.json(
      { error: 'Source URL required' },
      { status: 400 }
    );
  }

  return {
    sourceType,
    sourceUrl,
    title: 'Untitled',
  };
}

/**
 * Trigger background content generation
 */
function triggerContentGeneration(contentId: string, request: NextRequest): void {
  fetch(`${config.appUrl}/api/content/${contentId}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || '',
    },
  }).catch(err => console.error('Background generation failed:', err));
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
      const fileResult = await processFileUpload(formData, userId);

      if (fileResult instanceof NextResponse) {
        return fileResult; // Return error response
      }

      sourceType = fileResult.sourceType;
      sourceFile = fileResult.sourceFile;
      title = fileResult.title;
    }
    // Handle JSON (YouTube URL)
    else {
      let body;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
      }

      const youtubeResult = await processYouTubeSubmission(body);

      if (youtubeResult instanceof NextResponse) {
        return youtubeResult; // Return error response
      }

      sourceType = youtubeResult.sourceType;
      sourceUrl = youtubeResult.sourceUrl;
      title = youtubeResult.title;
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

    // Trigger background generation
    triggerContentGeneration(content.id, request);

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
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const sourceType = searchParams.get('sourceType') || undefined;
    const sort = searchParams.get('sort') || 'newest';

    if (contentId) {
      // Get single content with outputs - MUST verify ownership
      const content = await prisma.content.findFirst({
        where: { id: contentId, userId }, // Enforce ownership
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

    // Build where clause for filters
    const where: Record<string, unknown> = { userId };

    if (status && ['pending', 'processing', 'completed', 'failed'].includes(status)) {
      (where as { status?: string }).status = status;
    }

    if (sourceType && ['youtube', 'audio', 'video', 'pdf'].includes(sourceType)) {
      (where as { sourceType?: string }).sourceType = sourceType;
    }

    if (search) {
      (where as { title?: { contains?: string; mode?: string } }).title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Build order clause
    const orderBy: Record<string, unknown> = {};
    if (sort === 'oldest') {
      (orderBy as { createdAt?: 'asc' | 'desc' }).createdAt = 'asc';
    } else {
      (orderBy as { createdAt?: 'asc' | 'desc' }).createdAt = 'desc'; // default: newest
    }

    // Get filtered content
    const contents = await prisma.content.findMany({
      where,
      orderBy,
      take: 50,
      include: { _count: { select: { outputs: true } } },
    });

    return NextResponse.json({ contents, filters: { search, status, sourceType, sort } });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
