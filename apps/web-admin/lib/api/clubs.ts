import { getAuthToken, handleAuthFailure } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function fetchWithSuperAdminFallback(path: string, init: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (res.status !== 404) return res;
  if (!path.startsWith('/clubs')) return res;
  return fetch(`${API_BASE}/super-admin${path}`, init);
}

export async function getClubs() {
  const token = getAuthToken();
  const res = await fetchWithSuperAdminFallback(`/clubs`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch clubs');
  }
  return res.json();
}

export async function getClub(id: string) {
  const token = getAuthToken();
  const res = await fetchWithSuperAdminFallback(`/clubs/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch club');
  }
  return res.json();
}

export async function getClubStats(id: string) {
  const token = getAuthToken();
  const res = await fetchWithSuperAdminFallback(`/clubs/${id}/stats`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch club stats');
  }
  return res.json();
}

export async function getClubChartData(id: string, range: string) {
  const token = getAuthToken();
  const res = await fetchWithSuperAdminFallback(`/clubs/${id}/chart-data?range=${encodeURIComponent(range)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch club chart data');
  }
  return res.json();
}

export type Club = {
  id: string;
  name: string;
  address?: string;
  logo?: string;
  plan: 'PRO' | 'BASIC';
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  adminName?: string;
  adminEmail?: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateClubPayload = {
  name?: string;
  address?: string;
  plan?: 'PRO' | 'BASIC';
  status?: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  adminName?: string;
  adminEmail?: string;
};

async function authedFetch(path: string, init: RequestInit) {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetchWithSuperAdminFallback(path, { ...init, headers, cache: 'no-store' });
}

export async function updateClub(id: string, payload: UpdateClubPayload) {
  const res = await authedFetch(`/clubs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to update club');
  }
  return res.json();
}

export async function suspendClub(id: string) {
  const res = await authedFetch(`/clubs/${id}/suspend`, { method: 'POST' });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to suspend club');
  }
  return res.json();
}

export async function activateClub(id: string) {
  const res = await authedFetch(`/clubs/${id}/activate`, { method: 'POST' });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to activate club');
  }
  return res.json();
}

export async function forceLogoutClub(id: string) {
  const res = await authedFetch(`/clubs/${id}/force-logout`, { method: 'POST' });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to force logout club');
  }
  return res.json();
}

export async function deleteClub(id: string) {
  const res = await authedFetch(`/clubs/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to delete club');
  }
  return res.json();
}
