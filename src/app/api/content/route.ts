import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { contentQueue, JOB_TYPES } from '@/lib/queue';
import { uploadFile, generateFileKey } from '@/lib/storage';
import { getVideoInfo, extractVideoId } from '@/services/youtube';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';

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

    const body = await request.json();
    const { sourceType, sourceUrl } = body;

    // Validate input
    if (!sourceType) {
      return NextResponse.json({ error: 'Source type required' }, { status: 400 });
    }

    if (sourceType === 'youtube' && !sourceUrl) {
      return NextResponse.json({ error: 'YouTube URL required' }, { status: 400 });
    }

    // File upload support (for future)
    // const file = formData.get('file') as File | null;
    // if (['audio', 'video', 'pdf'].includes(sourceType) && !file) {
    //   return NextResponse.json({ error: 'File upload required' }, { status: 400 });
    // }

    // Create content record
    let title = 'Untitled';
    let sourceFileKey: string | undefined;

    if (sourceType === 'youtube' && sourceUrl) {
      const videoInfo = await getVideoInfo(sourceUrl);
      title = videoInfo.title;
    }

    // File upload (for future implementation)
    // if (file) {
    //   const buffer = Buffer.from(await file.arrayBuffer());
    //   sourceFileKey = generateFileKey(userId, sourceType, file.name);
    //   await uploadFile(sourceFileKey, buffer, file.type);
    // }

    const content = await prisma.content.create({
      data: {
        userId,
        sourceType,
        sourceUrl,
        sourceFile: sourceFileKey,
        title,
        status: 'pending',
      },
    });

    // Queue processing job (for now, we'll use mock generation)
    // In production: await contentQueue.add(JOB_TYPES.TRANSCRIBE, {...})
    
    // For demo: Auto-generate mock outputs
    const contentId = content.id;
    
    // Async generation (don't wait)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/content/${contentId}/generate`, {
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
      // Get single content with outputs
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
