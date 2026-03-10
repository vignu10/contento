import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    if (format !== 'csv') {
      return NextResponse.json({ error: 'Invalid format. Use csv' }, { status: 400 });
    }

    // Fetch all content for user
    const contents = await prisma.content.findMany({
      where: { userId },
      include: {
        outputs: {
          select: { format: true }
        },
        _count: { select: { outputs: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Generate CSV
    const headers = ['ID', 'Title', 'Source Type', 'Source URL', 'Status', 'Outputs Count', 'Created At', 'Updated At'];
    const rows = contents.map(c => [
      c.id,
      `"${(c.title || 'Untitled').replace(/"/g, '""')}"`,
      c.sourceType,
      `"${(c.sourceUrl || '').replace(/"/g, '""')}"`,
      c.status,
      c._count.outputs,
      c.createdAt.toISOString(),
      c.updatedAt.toISOString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="contento-history-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting content history:', error);
    return NextResponse.json(
      { error: 'Failed to export content history' },
      { status: 500 }
    );
  }
}
