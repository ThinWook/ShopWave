import { NextResponse, NextRequest } from 'next/server';

// Simple placeholder admin guard using a cookie `admin=1`.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    const isAdmin = req.cookies.get('admin')?.value === '1';
    if (!isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
