import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { getVideoInfo } from '@/services/youtube';
import { transcribeAudio } from '@/services/real-transcription';
import { generateRealOutputs } from '@/services/real-ai';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
const USE_REAL_AI = process.env.OPENAI_API_KEY && !process.env.USE_MOCK_AI;

function getUserId(request: NextRequest): string | null {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  try {
    const decoded = verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
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
      sourceType = formData.get('sourceType') as string;
      const file = formData.get('file') as File | null;

      if (!sourceType) {
        return NextResponse.json({ error: 'Source type required' }, { status: 400 });
      }

      if (['audio', 'video', 'pdf'].includes(sourceType) && !file) {
        return NextResponse.json({ error: 'File upload required' }, { status: 400 });
      }

      // Save uploaded file
      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'uploads', userId);
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const ext = file.name.split('.').pop();
        const filename = `${sourceType}-${timestamp}.${ext}`;
        const filepath = path.join(uploadDir, filename);

        await writeFile(filepath, buffer);
        sourceFile = filepath;
        title = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      }
    } 
    // Handle JSON (YouTube URL)
    else {
      const body = await request.json();
      sourceType = body.sourceType;
      sourceUrl = body.sourceUrl;

      if (!sourceType) {
        return NextResponse.json({ error: 'Source type required' }, { status: 400 });
      }

      if (sourceType === 'youtube' && !sourceUrl) {
        return NextResponse.json({ error: 'YouTube URL required' }, { status: 400 });
      }

      // Get video title for YouTube
      if (sourceType === 'youtube' && sourceUrl) {
        try {
          const videoInfo = await getVideoInfo(sourceUrl);
          title = videoInfo.title;
        } catch (e) {
          console.error('Failed to fetch video info:', e);
        }
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
        status: 'processing', // Start as processing immediately
      },
    });

    // Trigger AI processing
    const contentId = content.id;
    
    // Use real AI if API key is configured
    if (USE_REAL_AI) {
      // Async processing with real AI
      processWithRealAI(contentId, sourceType, sourceFile, title, request.headers.get('cookie') || '')
        .catch(err => console.error('Real AI processing failed:', err));
    } else {
      // Fallback to mock generation
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/content/${contentId}/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
      }).catch(err => console.error('Mock generation failed:', err));
    }

    return NextResponse.json({
      success: true,
      contentId: content.id,
      status: 'processing',
      aiMode: USE_REAL_AI ? 'real' : 'mock',
    });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { error: 'Failed to process content' },
      { status: 500 }
    );
  }
}

// Real AI processing function
async function processWithRealAI(
  contentId: string,
  sourceType: string,
  sourceFile: string | undefined,
  title: string,
  cookie: string
) {
  try {
    let transcript = '';
    
    // Transcribe if file exists
    if (sourceFile) {
      const { readFile } = await import('fs/promises');
      const audioBuffer = await readFile(sourceFile);
      const filename = sourceFile.split('/').pop() || 'audio.mp3';
      
      const result = await transcribeAudio(audioBuffer, filename);
      transcript = result.text;
    } else {
      // For YouTube URLs without download, use placeholder
      transcript = `[Transcript for: ${title}]\n\nTo use real transcription, please upload the audio file directly.`;
    }

    // Generate outputs with GPT-4
    const outputs = await generateRealOutputs(transcript, title);

    // Save outputs to database
    await prisma.output.createMany({
      data: [
        { contentId, format: 'twitter_thread', data: JSON.stringify(outputs.twitterThread) },
        { contentId, format: 'linkedin_post', data: JSON.stringify({ text: outputs.linkedinPost }) },
        { contentId, format: 'newsletter', data: JSON.stringify({ text: outputs.newsletter }) },
        { contentId, format: 'tiktok_clip', data: JSON.stringify(outputs.tiktokClips) },
        { contentId, format: 'quote_graphic', data: JSON.stringify(outputs.quoteGraphics) },
        { contentId, format: 'seo_summary', data: JSON.stringify({ text: outputs.seoSummary }) },
        { contentId, format: 'instagram_caption', data: JSON.stringify({ caption: outputs.instagramCaption, hashtags: outputs.hashtags }) },
      ],
    });

    // Update content status
    await prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'completed',
        processedAt: new Date(),
        transcript,
      },
    });

    console.log(`[AI] Successfully processed content: ${contentId}`);
  } catch (error) {
    console.error(`[AI] Processing failed for ${contentId}:`, error);
    
    await prisma.content.update({
      where: { id: contentId },
      data: { status: 'failed' },
    }).catch(e => console.error('Failed to update status:', e));
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
      const content = await prisma.content.findFirst({
        where: { id: contentId, userId },
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
