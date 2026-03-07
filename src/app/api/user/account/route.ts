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

// DELETE - Delete user account and all data
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all outputs first (cascade doesn't work with SQLite in some cases)
    const contents = await prisma.content.findMany({
      where: { userId },
      select: { id: true }
    });

    for (const content of contents) {
      await prisma.output.deleteMany({
        where: { contentId: content.id }
      });
    }

    // Delete all content
    await prisma.content.deleteMany({
      where: { userId }
    });

    // Delete usage records
    await prisma.usage.deleteMany({
      where: { userId }
    });

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    });

    // Create response with cookie clear
    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth-token');

    return response;
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
