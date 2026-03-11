import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Enforce ownership - only allow access to own content
    const content = await prisma.content.findFirst({
      where: {
        id,
        userId,  // Critical: verify content belongs to this user
      },
      include: { outputs: true },
    });

    if (!content) {
      // Return 404 instead of 403 to avoid information disclosure
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, sourceUrl, notes } = body;

    // Validate at least one field is provided
    if (title === undefined && sourceUrl === undefined && notes === undefined) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Verify ownership and update
    const existingContent = await prisma.content.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (sourceUrl !== undefined) updateData.sourceUrl = sourceUrl;
    if (notes !== undefined) updateData.notes = notes;

    const updatedContent = await prisma.content.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ content: updatedContent });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Enforce ownership - verify before delete
    const content = await prisma.content.findFirst({
      where: {
        id,
        userId,
      },
      select: { id: true },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    await prisma.content.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}
