import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { config } from '@/lib/config';
import { getUserId } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';
import { authActionSchema } from '@/lib/validation';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validated = authActionSchema.parse(body);

    if (validated.action === 'signup') {
      const { email, password, name } = validated;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }

      // Hash password securely with bcrypt
      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
        },
      });

      const token = sign(
        { userId: user.id, email: user.email },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      const response = NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
      });
      
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    if (validated.action === 'login') {
      const { email, password } = validated;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Use constant-time comparison to prevent timing attacks
      if (!user || !user.passwordHash) {
        // Still hash something to maintain consistent timing
        await hashPassword('dummy-password-for-timing');
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const token = sign(
        { userId: user.id, email: user.email },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      const response = NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
      });
      
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    if (validated.action === 'logout') {
      const response = NextResponse.json({ success: true });
      response.cookies.delete('auth-token');
      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
