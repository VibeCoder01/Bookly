
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const AUTH_COOKIE_NAME = 'bookly-admin-auth';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow requests to the login page to pass through without checks
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  // For any other page under /admin, we must check for our auth cookie
  if (pathname.startsWith('/admin')) {
    const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

    // If the cookie doesn't exist or its value is not 'true', redirect to login
    if (!authCookie || authCookie.value !== 'true') {
      const loginUrl = new URL('/admin/login', request.url);
      // We can add a `from` query param to redirect back after login, if desired
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If all checks pass, allow the request to continue
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  // Match all paths under /admin, except for Next.js specific folders and static assets
  matcher: '/admin/:path*',
}
