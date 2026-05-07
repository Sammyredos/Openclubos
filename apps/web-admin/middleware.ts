import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route → allowed roles
const PROTECTED_ROUTES: { prefix: string; roles: string[] }[] = [
  { prefix: '/super-admin', roles: ['SUPER_ADMIN'] },
  { prefix: '/club-admin', roles: ['SUPER_ADMIN', 'CLUB_ADMIN'] },
  { prefix: '/staff', roles: ['SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF'] },
  { prefix: '/app', roles: ['PLAYER', 'MARKER'] },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('accessToken')?.value;

  // Handle /login access for authenticated users
  if (pathname === '/login' && token) {
    try {
      const payload = decodeJwtPayload(token);
      if (!payload) throw new Error('Invalid token');
      if (!payload.role) throw new Error('Missing role');
      const fallback = getFallback(payload.role);
      if (fallback === '/login') throw new Error('Unknown role');
      return NextResponse.redirect(new URL(fallback, request.url));
    } catch {
      // Malformed token — allow /login and clear cookie
      const response = NextResponse.next();
      response.cookies.delete('accessToken');
      return response;
    }
  }

  // Public routes — always allow
  if (
    pathname === '/login' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/reset-password') ||
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // Not authenticated — redirect to /login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode JWT payload (no verification — verification happens on the backend)
  try {
    const payload = decodeJwtPayload(token);
    if (!payload) throw new Error('Invalid token');
    const userRole: string | undefined = payload.role;
    if (!userRole) throw new Error('Missing role');

    const matched = PROTECTED_ROUTES.find((r) => pathname.startsWith(r.prefix));
    if (matched && !matched.roles.includes(userRole)) {
      // Redirect to their correct dashboard
      const fallback = getFallback(userRole);
      return NextResponse.redirect(new URL(fallback, request.url));
    }
  } catch {
    // Malformed token — force logout
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('accessToken');
    return response;
  }

  return NextResponse.next();
}

function getFallback(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: '/super-admin/dashboard',
    CLUB_ADMIN: '/club-admin/dashboard',
    STAFF: '/staff/dashboard',
    PLAYER: '/app/home',
    MARKER: '/app/scoring',
  };
  return map[role] ?? '/login';
}

function decodeJwtPayload(token: string): { role?: string } | null {
  try {
    const payloadBase64Url = token.split('.')[1];
    if (!payloadBase64Url) return null;

    const base64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
