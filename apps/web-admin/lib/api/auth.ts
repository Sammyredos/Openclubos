const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  profilePhoto?: string;
  gender?: string;
  handicap?: number;
  role: 'SUPER_ADMIN' | 'CLUB_ADMIN' | 'PLAYER' | 'MARKER' | 'MANAGER';
  clubId?: string;
  managerScope?: string;
  aiTournamentDescCount?: number;
  aiTournamentDescResetAt?: string;
  club?: {
    name: string;
    logo?: string;
    [key: string]: any;
  };
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

function clearAuthSession() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.removeItem('oc_user');
    window.localStorage?.removeItem('oc_token'); // Clean up old tokens if they exist
    window.localStorage?.removeItem('accessToken'); 
    window.localStorage?.removeItem('refreshToken');
  } catch {
    // ignore
  }
}


export async function handleAuthFailure(res: Response) {
  if (typeof window === 'undefined') return;
  if (res.status !== 401) return;
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
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const msg = error.message || 'The email or password you entered is incorrect.';
    if (msg === 'ACCOUNT_SUSPENDED') {
      throw new Error('Your account has been suspended. Please contact support.');
    }
    if (msg === 'ACCOUNT_EXPIRED') {
      throw new Error('Your account has expired. Please contact support.');
    }
    if (msg === 'DATABASE_UNAVAILABLE') {
      throw new Error('Backend database is not running. Start Postgres (docker compose) and try again.');
    }
    if (msg === 'INVALID_CREDENTIALS') {
      throw new Error('The email or password you entered is incorrect. Please try again.');
    }
    if (msg === 'ACCOUNT_LOCKED_15_MIN') {
      throw new Error('Your account is temporarily locked for 15 minutes due to too many failed login attempts.');
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

export async function resendVerificationRequest(email: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to resend verification email.');
  }

  return res.json();
}

export async function registerOrganizationRequest(payload: {
  organizationName: string;
  organizationType: string;
  customOrganizationType?: string;
  organizationLogo: string;
  adminFirstName: string;
  adminMiddleName: string;
  adminLastName: string;
  adminPhone: string;
  adminGender?: string;
  adminEmail: string;
  adminPassword: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
}): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/register-organization`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    let msg = error.message;
    if (Array.isArray(msg)) msg = msg.join(' ');
    throw new Error(msg || 'Failed to register organization. Please check your details and try again.');
  }

  return res.json();
}

export function getAuthToken(): string | null {
  // getAuthToken is deprecated with httpOnly cookies.
  // We keep the signature to avoid breaking any stray imports, but it always returns null.
  // Fetch calls should use credentials: 'include' instead of Authorization headers.
  return null;
}

export async function validateOrganizationRequest(organizationName: string): Promise<{ available: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/auth/validate-organization`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationName }),
  });
  if (!res.ok) {
    throw new Error('Failed to validate organization name');
  }
  return res.json();
}

export async function validateAdminRequest(adminEmail?: string, adminPhone?: string, adminFirstName?: string, adminMiddleName?: string, adminLastName?: string): Promise<{ available: boolean; message?: string; field?: string }> {
  const res = await fetch(`${API_BASE}/auth/validate-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminEmail, adminPhone, adminFirstName, adminMiddleName, adminLastName }),
  });
  if (!res.ok) {
    throw new Error('Failed to validate admin details');
  }
  return res.json();
}

export async function incrementAIUsage(): Promise<{ aiTournamentDescCount: number; aiTournamentDescResetAt: string | null }> {
  const res = await fetch(`${API_BASE}/auth/me/ai-usage/tournament-desc/increment`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error('Failed to increment AI usage');
  }
  return res.json();
}
