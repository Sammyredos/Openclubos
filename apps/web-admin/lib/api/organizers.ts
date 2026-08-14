import { getAuthToken, handleAuthFailure } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function fetchWithSuperAdminFallback(path: string, init: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (res.status !== 404) return res;
  if (!path.startsWith('/organizers')) return res;
  return fetch(`${API_BASE}/super-admin${path}`, init);
}

export async function getOrganizers(query?: { search?: string; skip?: number; take?: number }) {
  const token = getAuthToken();
  const searchParams = new URLSearchParams();
  if (query?.skip !== undefined) searchParams.append('skip', query.skip.toString());
  if (query?.take !== undefined) searchParams.append('take', query.take.toString());
  if (query?.search) searchParams.append('search', query.search);

  const qs = searchParams.toString();
  const res = await fetchWithSuperAdminFallback(`/organizers${qs ? `?${qs}` : ''}`, {
    
    cache: 'no-store',
  });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch organizers');
  }
  return res.json();
}

export async function getOrganizer(id: string) {
  const token = getAuthToken();
  const res = await fetchWithSuperAdminFallback(`/organizers/${id}`, {
    
    cache: 'no-store',
  });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch organizer');
  }
  return res.json();
}

export async function getOrganizerStats(id: string) {
  const token = getAuthToken();
  const res = await fetchWithSuperAdminFallback(`/organizers/${id}/stats`, {
    
    cache: 'no-store',
  });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch organizer stats');
  }
  return res.json();
}

export type UpdateOrganizerPayload = {
  name?: string;
  address?: string;
  plan?: 'PRO' | 'BASIC';
  status?: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  adminName?: string;
  adminEmail?: string;
};

async function authedFetch(path: string, init: RequestInit) {
  return fetchWithSuperAdminFallback(path, { ...init, credentials: 'include', cache: 'no-store' });
}

export async function updateOrganizer(id: string, payload: UpdateOrganizerPayload) {
  const res = await authedFetch(`/organizers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to update organizer');
  }
  return res.json();
}

export async function suspendOrganizer(id: string) {
  const res = await authedFetch(`/organizers/${id}/suspend`, { method: 'POST' });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to suspend organizer');
  }
  return res.json();
}

export async function activateOrganizer(id: string) {
  const res = await authedFetch(`/organizers/${id}/activate`, { method: 'POST' });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to activate organizer');
  }
  return res.json();
}

export async function forceLogoutOrganizer(id: string) {
  const res = await authedFetch(`/organizers/${id}/force-logout`, { method: 'POST' });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to force logout organizer');
  }
  return res.json();
}

export async function deleteOrganizer(id: string) {
  const res = await authedFetch(`/organizers/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to delete organizer');
  }
  return res.json();
}
