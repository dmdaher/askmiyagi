import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/preview', '/legal'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through without auth
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for preview access cookie
  const previewAccess = request.cookies.get('preview_access');
  if (previewAccess?.value) {
    return NextResponse.next();
  }

  // Redirect to preview entry page
  const previewUrl = new URL('/preview', request.url);
  return NextResponse.redirect(previewUrl);
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
