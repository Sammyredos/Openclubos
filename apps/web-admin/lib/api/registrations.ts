import { getAuthToken, handleAuthFailure } from './auth';

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

export type RegistrationListItem = Registration & {
  paymentReference?: string | null;
  user?: { id: string; email: string; firstName: string | null; lastName: string | null };
  tournament?: { id: string; name: string; entryFee: number | null; startDate: string; club?: { id: string; name: string } };
};

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return null;
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
    await handleAuthFailure(res);
    const error: unknown = await res.json().catch(() => null);
    throw new Error(getErrorMessage(error) || 'Registration failed');
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

  if (!res.ok) {
    await handleAuthFailure(res);
    throw new Error('Failed to fetch registrations');
  }
  return res.json();
}

export async function getRegistrations(params?: {
  clubId?: string;
  paymentStatus?: string;
  skip?: number;
  take?: number;
}): Promise<{ items: RegistrationListItem[]; total: number }> {
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
    await handleAuthFailure(res);
    const error: unknown = await res.json().catch(() => null);
    throw new Error(getErrorMessage(error) || 'Failed to fetch registrations');
  }
  return res.json();
}
