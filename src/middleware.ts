import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME, ADMIN_USER_COOKIE, ADMIN_PRIMARY_COOKIE } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)
  const isAuthenticated = authCookie?.value === 'true'

  const isLoginPage = pathname.startsWith('/admin/login')
  const isAdminPage = pathname.startsWith('/admin')

  // If authenticated and on the login page, redirect to the admin dashboard.
  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // If not authenticated and on a protected admin page, redirect to the login page.
  if (!isAuthenticated && isAdminPage && !isLoginPage) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.next()

  if (isAuthenticated && !isAdminPage) {
    // Leaving admin area - clear auth cookies
    response.cookies.delete(AUTH_COOKIE_NAME)
    response.cookies.delete(ADMIN_USER_COOKIE)
    response.cookies.delete(ADMIN_PRIMARY_COOKIE)
    return response
  }

  if (isAuthenticated && isAdminPage) {
    // Refresh cookies to keep session alive while navigating within admin
    const secure = process.env.NODE_ENV === 'production'
    response.cookies.set(AUTH_COOKIE_NAME, 'true', {
      httpOnly: true,
      secure,
      path: '/',
      sameSite: 'strict',
      maxAge: 1800,
    })
    const user = request.cookies.get(ADMIN_USER_COOKIE)?.value
    if (user) {
      response.cookies.set(ADMIN_USER_COOKIE, user, {
        httpOnly: true,
        secure,
        path: '/',
        sameSite: 'strict',
        maxAge: 1800,
      })
    }
    const primary = request.cookies.get(ADMIN_PRIMARY_COOKIE)?.value
    if (primary) {
      response.cookies.set(ADMIN_PRIMARY_COOKIE, primary, {
        httpOnly: true,
        secure,
        path: '/',
        sameSite: 'strict',
        maxAge: 1800,
      })
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
