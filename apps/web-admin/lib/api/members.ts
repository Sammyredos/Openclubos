import { getAuthToken, handleAuthFailure } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface Member {
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
  profilePhoto?: string | null;
  dob?: string | null;
  gender?: string | null;
  state?: string | null;
  city?: string | null;
  address?: string | null;
  role: 'SUPER_ADMIN' | 'CLUB_ADMIN' | 'PLAYER' | 'MARKER' | 'MANAGER';
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'PENDING';
  handicap?: number | null;
  clubId?: string | null;
  managerScope?: string | null;
  club?: { id: string; name: string; logo?: string | null; address?: string | null; state?: string | null; city?: string | null } | null;
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
  role?: string;
}): Promise<MembersResponse & { stats?: AdminUsersStats }> {
  const token = getAuthToken();
  const searchParams = new URLSearchParams();
  if (params.skip) searchParams.append('skip', params.skip.toString());
  if (params.take) searchParams.append('take', params.take.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.status) searchParams.append('status', params.status);
  if (params.clubId) searchParams.append('clubId', params.clubId);
  if (params.role) searchParams.append('role', params.role);

  const res = await fetch(`${API_BASE}/members?${searchParams.toString()}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    throw new Error('Failed to fetch users');
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
  handicap?: string;
}): Promise<AdminUsersResponse> {
  const token = getAuthToken();
  const searchParams = new URLSearchParams();
  if (params.skip) searchParams.append('skip', params.skip.toString());
  if (params.take) searchParams.append('take', params.take.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.status) searchParams.append('status', params.status);
  if (params.clubId) searchParams.append('clubId', params.clubId);
  if (params.role) searchParams.append('role', params.role);
  if (params.handicap) searchParams.append('handicap', params.handicap);

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

export async function getMember(id: string): Promise<AdminUser> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/members/${id}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch user');
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
    throw new Error(error.message || 'Failed to create user');
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
    throw new Error(error?.message || 'Failed to update user');
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
    throw new Error(error?.message || 'Failed to delete user');
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

export async function inviteManager(data: {
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  scope: string;
}) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/members/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to send invitation');
  }
  return res.json();
}
