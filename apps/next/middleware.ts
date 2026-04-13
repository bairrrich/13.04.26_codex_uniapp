import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// TODO: Enable auth guard once Supabase cookies are properly configured
// Routes that require authentication
// const protectedRoutes = ['/diary', '/finance', '/nutrition', '/fitness', '/collections', '/feed'];

export function middleware(request: NextRequest) {
  // For now, let all requests pass through
  // Auth checks will be done client-side
  return NextResponse.next();

  // Uncomment when Supabase auth cookies are properly set:
  //
  // const { pathname } = request.nextUrl;
  // const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  // if (!isProtectedRoute) return NextResponse.next();
  //
  // const hasSession = request.cookies.has('sb-access-token');
  // if (!hasSession) {
  //   const loginUrl = new URL('/', request.url);
  //   loginUrl.searchParams.set('redirect', pathname);
  //   return NextResponse.redirect(loginUrl);
  // }
  // return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
