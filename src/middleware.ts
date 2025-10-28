import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  AUTH_COOKIE_NAME,
  ADMIN_USER_COOKIE,
  ADMIN_PRIMARY_COOKIE,
  USER_AUTH_COOKIE,
  USER_NAME_COOKIE,
} from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminAuthCookie = request.cookies.get(AUTH_COOKIE_NAME);
  const userAuthCookie = request.cookies.get(USER_AUTH_COOKIE);

  const isAdminAuthenticated = adminAuthCookie?.value === 'true';
  const isUserAuthenticated = userAuthCookie?.value === 'true';

  const isAdminPage = pathname.startsWith('/admin');
  const isAdminServerAction = pathname === '/_next/server-actions';
  const isAdminRelatedRequest = isAdminPage || isAdminServerAction;
  const isAdminLoginPage = pathname.startsWith('/admin/login');
  const isUserLoginPage = pathname.startsWith('/user/login');

  if (isAdminAuthenticated && isAdminLoginPage) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (isUserAuthenticated && isUserLoginPage) {
    return NextResponse.redirect(new URL('/book', request.url));
  }

  if (!isAdminAuthenticated && !isUserAuthenticated && isAdminPage && !isAdminLoginPage) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  const secure = process.env.NODE_ENV === 'production';

  if (isAdminAuthenticated && isAdminRelatedRequest) {
    response.cookies.set(AUTH_COOKIE_NAME, 'true', {
      httpOnly: true,
      secure,
      path: '/',
      sameSite: 'strict',
      maxAge: 1800,
    });
    const adminUsername = request.cookies.get(ADMIN_USER_COOKIE)?.value;
    if (adminUsername) {
      response.cookies.set(ADMIN_USER_COOKIE, adminUsername, {
        httpOnly: true,
        secure,
        path: '/',
        sameSite: 'strict',
        maxAge: 1800,
      });
    }
    const isPrimary = request.cookies.get(ADMIN_PRIMARY_COOKIE)?.value;
    if (isPrimary) {
      response.cookies.set(ADMIN_PRIMARY_COOKIE, isPrimary, {
        httpOnly: true,
        secure,
        path: '/',
        sameSite: 'strict',
        maxAge: 1800,
      });
    }
  }

  if (isUserAuthenticated) {
    response.cookies.set(USER_AUTH_COOKIE, 'true', {
      httpOnly: true,
      secure,
      path: '/',
      sameSite: 'strict',
      maxAge: 1800,
    });
    const username = request.cookies.get(USER_NAME_COOKIE)?.value;
    if (username) {
      response.cookies.set(USER_NAME_COOKIE, username, {
        httpOnly: true,
        secure,
        path: '/',
        sameSite: 'strict',
        maxAge: 1800,
      });
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
