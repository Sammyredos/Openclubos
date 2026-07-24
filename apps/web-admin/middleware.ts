import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route → allowed roles
const PROTECTED_ROUTES: { prefix: string; roles: string[] }[] = [
  { prefix: '/super-admin', roles: ['SUPER_ADMIN'] },
  { prefix: '/organizer-admin', roles: ['CLUB_ADMIN'] },
  { prefix: '/app', roles: ['PLAYER', 'MARKER'] },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('accessToken')?.value;

  const clearToken = () => {
    const res = NextResponse.next();
    res.cookies.delete('accessToken');
    return res;
  };

  // Public routes — always allow
  if (
    pathname === '/login' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/accept-invite') ||
    (pathname.startsWith('/tournaments/') && !pathname.includes('/register')) ||
    pathname === '/signup-organisation' ||
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static')
  ) {
    // If a token exists on /login, validate it against the backend.
    // This prevents "deleted users can still login" behavior caused by stale cookies.
    if (pathname === '/login' && token) {
      return verifyAccessToken(request, token)
        .then((payload) => {
          if (!payload?.role) return clearToken();
          const fallback = getFallback(payload.role);
          if (fallback === '/login') return clearToken();
          return NextResponse.redirect(new URL(fallback, request.url));
        })
        .catch(() => clearToken());
    }
    return NextResponse.next();
  }

  // Not authenticated — redirect to /login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validate token against backend (signature + user still exists).
  // If invalid, clear cookie and redirect to /login.
  return verifyAccessToken(request, token)
    .then((payload) => {
      const userRole: string | undefined = payload?.role;
      const managerScope: string | undefined = payload?.managerScope;
      if (!userRole) throw new Error('Missing role');

      const matched = PROTECTED_ROUTES.find((r) => pathname.startsWith(r.prefix));
      if (matched && !matched.roles.includes(userRole)) {
        const fallback = getFallback(userRole);
        const res = NextResponse.redirect(new URL(fallback, request.url));
        if (fallback === '/login') {
          res.cookies.delete('accessToken');
        }
        return res;
      }

      // Enforce specific route restrictions for scoped CLUB_ADMIN managers
      if (userRole === 'CLUB_ADMIN' && managerScope && pathname.startsWith('/organizer-admin')) {
        let allowed = false;

        if (managerScope === 'TOURNAMENTS') {
          const allowedRoutes = [
            '/organizer-admin/dashboard',
            '/organizer-admin/tournaments',
            '/organizer-admin/registrations',
            '/organizer-admin/scoring',
            '/organizer-admin/leaderboard',
            '/organizer-admin/reports',
            '/organizer-admin/handicaps',
            '/organizer-admin/notifications',
            '/organizer-admin/settings'
          ];
          allowed = allowedRoutes.some(r => pathname === r || pathname.startsWith(`${r}/`));
        } else if (managerScope === 'FINANCE') {
          const allowedRoutes = [
            '/organizer-admin/dashboard',
            '/organizer-admin/registrations',
            '/organizer-admin/payments',
            '/organizer-admin/reports',
            '/organizer-admin/notifications'
          ];
          allowed = allowedRoutes.some(r => pathname === r || pathname.startsWith(`${r}/`));
        } else {
          // Fallback for ANY scope that isn't empty: deny access to /users
          if (pathname.startsWith('/organizer-admin/users')) {
            allowed = false;
          } else {
            allowed = true;
          }
        }

        if (!allowed) {
          return NextResponse.redirect(new URL('/organizer-admin/dashboard', request.url));
        }
      }

      return NextResponse.next();
    })
    .catch(() => {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('accessToken');
      return response;
    });
}

function getFallback(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: '/super-admin/dashboard',
    CLUB_ADMIN: '/organizer-admin/dashboard',
    PLAYER: '/app/home',
    MARKER: '/app/scoring',
  };
  return map[role] ?? '/login';
}

async function verifyAccessToken(
  request: NextRequest,
  token: string,
): Promise<{ role?: string; managerScope?: string } | null> {
  const backendBase =
    process.env.API_PROXY_TARGET?.replace(/\/+$/, '') ||
    (typeof process.env.NEXT_PUBLIC_API_URL === 'string' &&
    process.env.NEXT_PUBLIC_API_URL.startsWith('http')
      ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
      : 'http://localhost:3001');

  const url = `${backendBase}/api/auth/me`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json: unknown = await res.json().catch(() => null);
  if (json && typeof json === 'object' && 'role' in json) {
    const role = (json as { role?: unknown }).role;
    const managerScope = (json as { managerScope?: unknown }).managerScope;
    if (typeof role === 'string') {
      return { 
        role, 
        managerScope: typeof managerScope === 'string' ? managerScope : undefined 
      };
    }
  }
  return null;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
