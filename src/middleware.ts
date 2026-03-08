import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { config as appConfig } from './lib/config';

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/', '/api/auth', '/api/health'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path is public
  const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  if (isPublic) {
    return NextResponse.next();
  }

  // Get auth token
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    // Redirect to home for pages, return 401 for API
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ✅ Actually verify the JWT signature (not just check existence)
  try {
    verify(token, appConfig.jwtSecret);
    return NextResponse.next();
  } catch {
    // Token is invalid or expired
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    // Clear invalid cookie and redirect
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/content/:path*',
    '/api/outputs/:path*',
  ],
};
