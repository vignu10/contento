import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';

function getUserId(request: NextRequest): string | null {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  try {
    const decoded = verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// GET - Export all user data
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all content with outputs
    const contents = await prisma.content.findMany({
      where: { userId },
      include: {
        outputs: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        email: user.email,
        name: user.name,
        memberSince: user.createdAt,
      },
      statistics: {
        totalContent: contents.length,
        totalOutputs: contents.reduce((sum, c) => sum + c.outputs.length, 0),
      },
      content: contents.map(content => ({
        id: content.id,
        title: content.title,
        sourceType: content.sourceType,
        sourceUrl: content.sourceUrl,
        status: content.status,
        createdAt: content.createdAt,
        processedAt: content.processedAt,
        outputs: content.outputs.map(output => ({
          format: output.format,
          data: JSON.parse(output.data),
          createdAt: output.createdAt,
        }))
      }))
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
