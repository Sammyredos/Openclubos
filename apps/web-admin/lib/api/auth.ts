const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'SUPER_ADMIN' | 'CLUB_ADMIN' | 'PLAYER' | 'MARKER';
  clubId?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.removeItem('oc_token');
    window.localStorage?.removeItem('oc_user');
  } catch {
    // ignore
  }
  try {
    document.cookie = 'accessToken=; path=/; max-age=0';
  } catch {
    // ignore
  }
}

export async function handleAuthFailure(res: Response) {
  if (typeof window === 'undefined') return;
  if (res.status !== 401 && res.status !== 403) return;
  let message = '';
  try {
    const data: unknown = await res.clone().json();
    if (data && typeof data === 'object' && 'message' in data) {
      const m = (data as { message?: unknown }).message;
      if (typeof m === 'string') message = m;
      if (Array.isArray(m) && m.every((x) => typeof x === 'string')) message = m.join(' ');
    }
  } catch {
    message = '';
  }

  const url = new URL('/login', window.location.origin);
  if (message === 'ACCOUNT_SUSPENDED') url.searchParams.set('reason', 'suspended');
  if (message === 'ACCOUNT_EXPIRED') url.searchParams.set('reason', 'expired');
  if (message === 'TOKEN_REVOKED') url.searchParams.set('reason', 'revoked');

  clearAuthSession();
  window.location.href = url.toString();
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const msg = error.message || 'Invalid email or password';
    if (msg === 'ACCOUNT_SUSPENDED') {
      throw new Error('Your account has been suspended. Please contact support.');
    }
    if (msg === 'ACCOUNT_EXPIRED') {
      throw new Error('Your account has expired. Please contact support.');
    }
    if (msg === 'DATABASE_UNAVAILABLE') {
      throw new Error('Backend database is not running. Start Postgres (docker compose) and try again.');
    }
    throw new Error(msg);
  }

  return res.json();
}

export async function forgotPasswordRequest(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to send reset email. Please try again.');
  }

  return res.json();
}

export async function resetPasswordRequest(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to reset password. The link might be invalid or expired.');
  }

  return res.json();
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const local = window.localStorage?.getItem('oc_token');
    if (local) return local;
  } catch {
    // ignore
  }
  try {
    const session = window.sessionStorage?.getItem('oc_token');
    if (session) return session;
  } catch {
    // ignore
  }
  try {
    const cookie = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('accessToken='));
    if (!cookie) return null;
    const token = cookie.split('=')[1];
    return token || null;
  } catch {
    return null;
  }
}
