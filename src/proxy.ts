import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';
  const role = request.cookies.get('role')?.value; // 'user' | 'admin'

  // Define route rules - Include /about, /contact, /privacy, /terms, and /offline as public
  const publicRoutes = ['/', '/login', '/register', '/about', '/contact', '/privacy', '/terms', '/offline'];
  
  // Static files or public assets should not trigger auth checks
  const isStaticAsset = 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/icons') || 
    pathname.startsWith('/screenshots') || 
    pathname.includes('.') || // matches favicon.ico, logo.png, manifest.json, sw.js, etc.
    pathname.startsWith('/api/');

  const isPublicRoute = isStaticAsset || publicRoutes.includes(pathname) || pathname.startsWith('/books');
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isAdminRoute = pathname.startsWith('/admin');

  // If trying to access login/register while authenticated -> redirect to their dashboard/profile
  if (isAuthRoute && isAuthenticated) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  // If trying to access protected route while NOT authenticated -> redirect to login with original pathname preserved
  if (!isAuthenticated && !isPublicRoute && !isAuthRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access admin route without admin privileges
  if (isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply proxy to all routes except API, static assets, and dev files
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
