import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  const session = await auth();
  const isLoggedIn = !!session;
  const { pathname } = req.nextUrl;

  const isPublicRoute = ['/login', '/register'].some(p => pathname.startsWith(p));
  const isAdminRoute = pathname.startsWith('/profile/admin');

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  if (isAdminRoute && session?.user.role !== 'admin') {
    return NextResponse.redirect(new URL('/profile', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)'],
};
