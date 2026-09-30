import { getAuthToken, handleAuthFailure } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function fetchWithSuperAdminFallback(path: string, init: RequestInit) {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const mergedInit = { ...init, headers };
  const res = await fetch(`${API_BASE}${path}`, mergedInit);
  if (res.status !== 404) return res;
  if (!path.startsWith('/clubs')) return res;
  return fetch(`${API_BASE}/super-admin${path}`, mergedInit);
}

export async function getClubs() {
  const token = getAuthToken();
  const res = await fetchWithSuperAdminFallback(`/clubs`, {
    
    credentials: 'include', cache: 'no-store',
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
    
    credentials: 'include', cache: 'no-store',
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
    
    credentials: 'include', cache: 'no-store',
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
    
    credentials: 'include', cache: 'no-store',
  });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch club chart data');
  }
  return res.json();
}

export async function getClubAgeDemographics(id: string) {
  const token = getAuthToken();
  const res = await fetchWithSuperAdminFallback(`/clubs/${id}/age-demographics`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch club age demographics');
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


