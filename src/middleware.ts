
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const AUTH_COOKIE_NAME = 'bookly-admin-auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
  const isAuthenticated = authCookie?.value === 'true';

  const isLoginPage = pathname.startsWith('/admin/login');
  const isAdminPage = pathname.startsWith('/admin');

  // If authenticated and on the login page, redirect to the admin dashboard.
  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // If not authenticated and on a protected admin page, redirect to the login page.
  if (!isAuthenticated && isAdminPage && !isLoginPage) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Otherwise, allow the request to proceed.
  return NextResponse.next();
}

// Match all paths under /admin to ensure this logic runs for both the
// login page and the protected admin area.
export const config = {
  matcher: '/admin/:path*',
}
