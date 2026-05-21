import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';

export const proxy = auth((req) => {
  const session = req.auth;
  const isLoggedIn = !!session;
  const { pathname } = req.nextUrl;

  const isPublicRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isAdminRoute = pathname.startsWith('/profile/admin');

  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (isAdminRoute && session?.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/profile', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|sw.js).*)'],
};
