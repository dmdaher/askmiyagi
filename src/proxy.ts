import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/preview', '/legal'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Contractor editor: contractor password only
  if (pathname.startsWith('/editor')) {
    const expected = process.env.CONTRACTOR_PASSWORD;
    const cookie = request.cookies.get('contractor_access')?.value;
    if (!expected || cookie !== expected) {
      const url = new URL('/signin', request.url);
      url.searchParams.set('role', 'contractor');
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Admin pages: admin password only (review + pipeline dashboard)
  if (pathname.startsWith('/admin')) {
    const expected = process.env.ADMIN_PASSWORD;
    const cookie = request.cookies.get('admin_access')?.value;
    if (!expected || cookie !== expected) {
      const url = new URL('/signin', request.url);
      url.searchParams.set('role', 'admin');
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
