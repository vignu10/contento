import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { updateOutputSchema } from '@/lib/validation';
import { ZodError } from 'zod';

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

    // ✅ Verify ownership of the parent content first
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

    // Now safe to fetch outputs (they belong to verified content)
    const outputs = await prisma.output.findMany({
      where: { contentId: id },
    });

    return NextResponse.json({ outputs });
  } catch (error) {
    console.error('Error fetching outputs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outputs' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate input
    const body = await request.json();
    const { outputId, editedData } = updateOutputSchema.parse(body);

    // ✅ Verify ownership through content chain
    const output = await prisma.output.findUnique({
      where: { id: outputId },
      include: { content: { select: { userId: true } } },
    });

    if (!output || output.content.userId !== userId) {
      return NextResponse.json({ error: 'Output not found' }, { status: 404 });
    }

    // Also verify the contentId matches the URL param
    if (output.contentId !== id) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const updatedOutput = await prisma.output.update({
      where: { id: outputId },
      data: { editedData },
    });

    return NextResponse.json({ success: true, output: updatedOutput });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating output:', error);
    return NextResponse.json(
      { error: 'Failed to update output' },
      { status: 500 }
    );
  }
}
