import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from './lib/auth';

// Define protected ERP routes
const ERP_ROUTES = ['/erp'];
const PUBLIC_ERP_ROUTES = ['/erp/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is an ERP route
  const isErpRoute = ERP_ROUTES.some((route) => pathname.startsWith(route));
  const isPublicErpRoute = PUBLIC_ERP_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (isErpRoute && !isPublicErpRoute) {
    const token = request.cookies.get('erp-session');

    // Redirect to login if no token
    if (!token) {
      return NextResponse.redirect(new URL('/erp/login', request.url));
    }

    // Verify token
    const session = await verifySession(token.value);
    if (!session) {
      // Invalid token - clear cookie and redirect to login
      const response = NextResponse.redirect(
        new URL('/erp/login', request.url),
      );
      response.cookies.delete('erp-session');
      return response;
    }
  }

  // If trying to access login page while authenticated, redirect to dashboard
  if (pathname === '/erp/login') {
    const token = request.cookies.get('erp-session');
    if (token) {
      const session = await verifySession(token.value);
      if (session) {
        return NextResponse.redirect(new URL('/erp/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/erp/:path*'],
};
