import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { config as libConfig } from '@/lib/config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find content and verify ownership
    const content = await prisma.content.findFirst({
      where: { id, userId },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Check if content is actually failed
    if (content.status !== 'failed') {
      return NextResponse.json(
        { error: 'Content is not in failed state' },
        { status: 400 }
      );
    }

    // For now, we'll just reset status and trigger generation
    // In production, you might track retry count in the Content model
    // Limit to 3 retries as per PRD
    await prisma.content.update({
      where: { id },
      data: {
        status: 'pending',
        // processedAt will be reset when generation completes
      },
    });

    // Trigger background generation
    fetch(`${libConfig.appUrl}/api/content/${id}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    }).catch(err => console.error('Background generation failed:', err));

    return NextResponse.json({
      success: true,
      status: 'processing',
      message: 'Retrying content generation...',
    });
  } catch (error) {
    console.error('Error retrying content:', error);
    return NextResponse.json(
      { error: 'Failed to retry content' },
      { status: 500 }
    );
  }
}
