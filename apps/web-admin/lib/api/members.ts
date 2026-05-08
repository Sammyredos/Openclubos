import { getAuthToken, handleAuthFailure } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  handicap: number;
  clubId?: string;
  club?: { name: string };
  createdAt: string;
}

export interface MembersResponse {
  items: Member[];
  total: number;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone?: string | null;
  role: 'SUPER_ADMIN' | 'CLUB_ADMIN' | 'STAFF' | 'PLAYER' | 'MARKER';
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  clubId?: string | null;
  club?: { id: string; name: string } | null;
  createdAt: string;
}

export interface AdminUsersStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  newThisMonth: number;
  superAdmins: number;
  roles: Record<string, number>;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  total: number;
  stats: AdminUsersStats;
}

type JsonObject = Record<string, unknown>;

export async function getMembers(params: {
  skip?: number;
  take?: number;
  search?: string;
  status?: string;
  clubId?: string;
}): Promise<MembersResponse> {
  const token = getAuthToken();
  const searchParams = new URLSearchParams();
  if (params.skip) searchParams.append('skip', params.skip.toString());
  if (params.take) searchParams.append('take', params.take.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.status) searchParams.append('status', params.status);
  if (params.clubId) searchParams.append('clubId', params.clubId);

  const res = await fetch(`${API_BASE}/members?${searchParams.toString()}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    throw new Error('Failed to fetch members');
  }
  return res.json();
}

export async function getAdminUsers(params: {
  skip?: number;
  take?: number;
  search?: string;
  status?: string;
  clubId?: string;
  role?: string;
}): Promise<AdminUsersResponse> {
  const token = getAuthToken();
  const searchParams = new URLSearchParams();
  if (params.skip) searchParams.append('skip', params.skip.toString());
  if (params.take) searchParams.append('take', params.take.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.status) searchParams.append('status', params.status);
  if (params.clubId) searchParams.append('clubId', params.clubId);
  if (params.role) searchParams.append('role', params.role);

  const res = await fetch(`${API_BASE}/members/all?${searchParams.toString()}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch users');
  }
  return res.json();
}

export async function createMember(data: JsonObject) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json();
    throw new Error(error.message || 'Failed to create member');
  }
  return res.json();
}

export async function updateMember(id: string, data: JsonObject) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/members/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to update member');
  }
  return res.json();
}

export async function deleteMember(id: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/members/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to delete member');
  }
  return res.json();
}

export async function forceLogoutUser(id: string): Promise<{ success: boolean }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/members/${id}/force-logout`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to force logout user');
  }
  return res.json();
}
