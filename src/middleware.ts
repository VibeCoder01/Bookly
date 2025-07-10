import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/auth'

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

  // Otherwise, allow the request to proceed.
  const response = NextResponse.next()


  // Prior logic removed the authentication cookie after every admin request
  // to force re-authentication on each page load. This caused issues when the
  // admin dashboard performed additional background requests as those requests
  // no longer carried the cookie and triggered a redirect loop back to the
  // login page. By leaving the short‑lived cookie intact we avoid the loop
  // while still limiting the session duration via the cookie's maxAge.

  return response
}

// Match all paths under /admin to ensure this logic runs for both the
// login page and the protected admin area.
export const config = {
  matcher: '/admin/:path*',
}
