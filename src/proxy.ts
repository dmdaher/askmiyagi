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
      return NextResponse.redirect(new URL('/signin?role=contractor', request.url));
    }
  }

  // Admin review: admin password only
  if (pathname.startsWith('/admin/review')) {
    const expected = process.env.ADMIN_PASSWORD;
    const cookie = request.cookies.get('admin_access')?.value;
    if (!expected || cookie !== expected) {
      return NextResponse.redirect(new URL('/signin?role=admin', request.url));
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
