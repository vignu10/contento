import { NextRequest, NextResponse } from 'next/server';
import { sign, verify } from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { createHash } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';

// Simple hash function for passwords (use bcrypt in production)
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, name } = body;

    if (action === 'signup') {
      // Create new user
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }

      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: hashPassword(password),
        },
      });

      const token = sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '7d',
      });

      const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    if (action === 'login') {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || user.passwordHash !== hashPassword(password)) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const token = sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '7d',
      });

      const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    if (action === 'logout') {
      const response = NextResponse.json({ success: true });
      response.cookies.delete('auth-token');
      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}


