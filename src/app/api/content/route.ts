import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { contentQueue, JOB_TYPES } from '@/lib/queue';
import { uploadFile, generateFileKey } from '@/lib/storage';
import { getVideoInfo, extractVideoId } from '@/services/youtube';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const sourceType = formData.get('sourceType') as string;
    const sourceUrl = formData.get('sourceUrl') as string;
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string || 'demo-user'; // TODO: Get from auth

    // Validate input
    if (!sourceType) {
      return NextResponse.json({ error: 'Source type required' }, { status: 400 });
    }

    if (sourceType === 'youtube' && !sourceUrl) {
      return NextResponse.json({ error: 'YouTube URL required' }, { status: 400 });
    }

    if (['audio', 'video', 'pdf'].includes(sourceType) && !file) {
      return NextResponse.json({ error: 'File upload required' }, { status: 400 });
    }

    // Create content record
    let title = 'Untitled';
    let sourceFileKey: string | undefined;

    if (sourceType === 'youtube' && sourceUrl) {
      const videoInfo = await getVideoInfo(sourceUrl);
      title = videoInfo.title;
    }

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      sourceFileKey = generateFileKey(userId, sourceType, file.name);
      await uploadFile(sourceFileKey, buffer, file.type);
    }

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

    // Queue processing job
    await contentQueue.add(JOB_TYPES.TRANSCRIBE, {
      contentId: content.id,
      userId,
      sourceType,
      sourceUrl,
      sourceFile: sourceFileKey,
    });

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
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const userId = searchParams.get('userId') || 'demo-user';

    if (contentId) {
      // Get single content with outputs
      const content = await prisma.content.findUnique({
        where: { id: contentId },
        include: { outputs: true },
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
