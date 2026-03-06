import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const outputs = await prisma.output.findMany({
      where: { contentId: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { outputId, editedData } = body;

    const output = await prisma.output.update({
      where: { id: outputId },
      data: { editedData },
    });

    return NextResponse.json({ success: true, output });
  } catch (error) {
    console.error('Error updating output:', error);
    return NextResponse.json(
      { error: 'Failed to update output' },
      { status: 500 }
    );
  }
}
