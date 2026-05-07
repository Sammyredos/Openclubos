const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'SUPER_ADMIN' | 'CLUB_ADMIN' | 'STAFF' | 'PLAYER' | 'MARKER';
  clubId?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Invalid email or password');
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
