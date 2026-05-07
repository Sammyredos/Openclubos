import { getAuthToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Registration {
  id: string;
  registeredAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITLISTED';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  playerType: string;
  paymentReference?: string;
  tournamentId: string;
  userId: string;
}

export async function registerForTournament(data: {
  tournamentId: string;
  playerType?: string;
  paymentReference?: string;
}) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/registrations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Registration failed');
  }
  return res.json();
}

export async function getMyRegistrations(): Promise<Registration[]> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/registrations/my`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
  });

  if (!res.ok) throw new Error('Failed to fetch registrations');
  return res.json();
}

export async function getRegistrations(params?: {
  clubId?: string;
  paymentStatus?: string;
  skip?: number;
  take?: number;
}) {
  const token = getAuthToken();
  const searchParams = new URLSearchParams();
  if (params?.clubId) searchParams.append('clubId', params.clubId);
  if (params?.paymentStatus) searchParams.append('paymentStatus', params.paymentStatus);
  if (params?.skip != null) searchParams.append('skip', String(params.skip));
  if (params?.take != null) searchParams.append('take', String(params.take));

  const qs = searchParams.toString();
  const res = await fetch(`${API_BASE}/registrations${qs ? `?${qs}` : ''}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch registrations');
  }
  return res.json() as Promise<{ items: any[]; total: number }>;
}
