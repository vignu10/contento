import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total content count
    const totalContent = await prisma.content.count({
      where: { userId },
    });

    // Get total outputs count
    const totalOutputs = await prisma.output.count({
      where: {
        content: { userId },
      },
    });

    // Get content by status
    const contentByStatus = await prisma.content.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true },
    });

    // Get outputs by format
    const outputsByFormat = await prisma.output.groupBy({
      by: ['format'],
      where: {
        content: { userId },
      },
      _count: { id: true },
    });

    // Get content creation trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const contentByDate = await prisma.content.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date for heatmap
    const contentByDay: Record<string, number> = {};
    contentByDate.forEach((c) => {
      const dateKey = c.createdAt.toISOString().split('T')[0];
      contentByDay[dateKey] = (contentByDay[dateKey] || 0) + 1;
    });

    // Calculate active streak (consecutive days with content)
    const dates = Object.keys(contentByDay).sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - 0);
        const expectedKey = expectedDate.toISOString().split('T')[0];
        if (dates[i] === expectedKey || dates[i] === today) {
          streak++;
        } else {
          break;
        }
      } else {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        const diffDays = Math.abs((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    return NextResponse.json({
      totalContent,
      totalOutputs,
      contentByStatus: contentByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      outputsByFormat: outputsByFormat.map((item) => ({
        format: item.format,
        count: item._count.id,
      })),
      contentByDay,
      streak,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
