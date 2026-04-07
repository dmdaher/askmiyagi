import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/preview', '/legal'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Editor pages: accessible by contractor OR admin
  if (pathname.startsWith('/editor')) {
    const contractorOk = process.env.CONTRACTOR_PASSWORD && request.cookies.get('contractor_access')?.value === process.env.CONTRACTOR_PASSWORD;
    const adminOk = process.env.ADMIN_PASSWORD && request.cookies.get('admin_access')?.value === process.env.ADMIN_PASSWORD;
    if (!contractorOk && !adminOk) {
      return NextResponse.redirect(new URL('/signin?role=contractor', request.url));
    }
  }

  // Admin review detail: admin only
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
