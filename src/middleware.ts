
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

const PROTECTED_PATHS = ['/admin'];
const LOGIN_PATH = '/login';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the requested path is one of the protected paths
  if (PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    const cookie = request.cookies.get('bookly_session')?.value;
    const session = await decrypt(cookie);

    // If no session or session is invalid, redirect to login page
    if (!session?.userId) {
      return NextResponse.redirect(new URL(LOGIN_PATH, request.nextUrl.origin));
    }
  }

  // If trying to access login page while already logged in, redirect to admin
  if (pathname === LOGIN_PATH) {
    const cookie = request.cookies.get('bookly_session')?.value;
    const session = await decrypt(cookie);
    if (session?.userId) {
      return NextResponse.redirect(new URL('/admin', request.nextUrl.origin));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
