import { NextRequest, NextResponse } from 'next/server';

// Simple middleware without JWT (using cookies directly for demo)
// In production, use a proper auth solution like NextAuth.js

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths
  const publicPaths = ['/', '/api/auth', '/api/health'];
  const isPublic = publicPaths.some(path => pathname.startsWith(path));

  if (isPublic) {
    return NextResponse.next();
  }

  // Check for auth token (simple cookie check)
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    // Redirect to home for pages, return 401 for API
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Token exists - let the request through
  // Actual validation happens in API routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/content/:path*',
    '/api/outputs/:path*',
  ],
};
