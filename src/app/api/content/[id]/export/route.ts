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

    // Verify ownership
    const content = await prisma.content.findFirst({
      where: { id, userId },
      include: { outputs: true },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    switch (format) {
      case 'json':
        // Export all data as JSON
        const jsonData = {
          content: {
            id: content.id,
            title: content.title,
            sourceType: content.sourceType,
            sourceUrl: content.sourceUrl,
            status: content.status,
            transcript: content.transcript,
            createdAt: content.createdAt,
            updatedAt: content.updatedAt,
          },
          outputs: content.outputs.map(output => ({
            id: output.id,
            format: output.format,
            data: JSON.parse(output.data),
            editedData: output.editedData ? JSON.parse(output.editedData) : null,
            isExported: output.isExported,
            exportedAt: output.exportedAt,
            createdAt: output.createdAt,
            updatedAt: output.updatedAt,
          })),
        };

        return new NextResponse(JSON.stringify(jsonData, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="contento-${content.title?.replace(/[^a-z0-9]/gi, '-') || id}-${new Date().toISOString().split('T')[0]}.json"`,
          },
        });

      case 'transcript':
        // Export transcript as plain text
        const transcriptText = content.transcript || 'No transcript available';
        return new NextResponse(transcriptText, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="transcript-${content.title?.replace(/[^a-z0-9]/gi, '-') || id}.txt"`,
          },
        });

      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error exporting content:', error);
    return NextResponse.json(
      { error: 'Failed to export content' },
      { status: 500 }
    );
  }
}
