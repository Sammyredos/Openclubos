import { getAuthToken } from './auth';

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

  if (!res.ok) throw new Error('Failed to fetch members');
  return res.json();
}

export async function createMember(data: any) {
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
    const error = await res.json();
    throw new Error(error.message || 'Failed to create member');
  }
  return res.json();
}

export async function updateMember(id: string, data: any) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/members/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to update member');
  return res.json();
}

export async function deleteMember(id: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/members/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
  });

  if (!res.ok) throw new Error('Failed to delete member');
  return res.json();
}
