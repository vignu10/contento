import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

const MAX_RETRIES = 3;

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

    // Verify ownership
    const content = await prisma.content.findFirst({
      where: { id, userId },
      include: { outputs: true },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Check retry count (simulated via updatedAt or could add a retryCount field)
    // For now, we'll use updatedAt as a simple check - if updated recently, limit retries
    const hoursSinceLastUpdate = (Date.now() - content.updatedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastUpdate < 0.1) { // Less than 6 minutes since last attempt
      const retryCount = Math.floor(hoursSinceLastUpdate * 10); // Rough estimate
      if (retryCount >= MAX_RETRIES) {
        return NextResponse.json(
          { error: `Maximum retries (${MAX_RETRIES}) exceeded. Please delete and re-upload.` },
          { status: 429 }
        );
      }
    }

    // Reset status to pending and update timestamp
    await prisma.content.update({
      where: { id },
      data: {
        status: 'pending',
        updatedAt: new Date(),
      },
    });

    // Trigger background generation (same as initial content creation)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/content/${id}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    }).catch(err => console.error('Background retry failed:', err));

    return NextResponse.json({ 
      success: true, 
      message: 'Retry initiated. Your content is being processed.' 
    });
  } catch (error) {
    console.error('Error retrying content:', error);
    return NextResponse.json(
      { error: 'Failed to retry content' },
      { status: 500 }
    );
  }
}
