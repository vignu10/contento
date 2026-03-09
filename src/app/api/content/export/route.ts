import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

/**
 * Export all content for a user as CSV
 * Useful for analytics, record-keeping, and data export
 */

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all content for the user
    const contents = await prisma.content.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { outputs: true } },
      },
    });

    // Generate CSV header
    const header = 'ID,Title,Source Type,Status,Created At,Processed At,Outputs Count\n';

    // Generate CSV rows
    const rows = contents.map((content) => {
      const safeTitle = (content.title || 'Untitled').replace(/"/g, '""');
      return `${content.id},"${safeTitle}",${content.sourceType},${content.status},${content.createdAt},${content.processedAt || ''},${content._count.outputs}`;
    });

    // Combine header and rows
    const csvContent = header + rows.join('\n');

    // Generate filename with timestamp
    const filename = `contento-export-history-${new Date().toISOString().split('T')[0]}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
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
