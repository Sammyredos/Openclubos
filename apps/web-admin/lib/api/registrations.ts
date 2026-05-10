import { getAuthToken, handleAuthFailure } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface Registration {
  id: string;
  registeredAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITLISTED' | 'DISQUALIFIED';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  playerType: string;
  paymentReference?: string;
  tournamentId: string;
  userId: string;
  extraStrokes?: number;
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
  organizerId?: string;
  tournamentId?: string;
  q?: string;
  status?: string;
  disqualified?: boolean;
  paymentStatus?: string;
  skip?: number;
  take?: number;
}): Promise<{ items: RegistrationListItem[]; total: number }> {
  const token = getAuthToken();
  const searchParams = new URLSearchParams();
  if (params?.clubId) searchParams.append('clubId', params.clubId);
  if (params?.organizerId) searchParams.append('organizerId', params.organizerId);
  if (params?.tournamentId) searchParams.append('tournamentId', params.tournamentId);
  if (params?.q) searchParams.append('q', params.q);
  if (params?.status) searchParams.append('status', params.status);
  if (typeof params?.disqualified === 'boolean') searchParams.append('disqualified', String(params.disqualified));
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

export async function updateRegistrationStatus(
  registrationId: string,
  status: Registration['status'],
): Promise<Registration> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/registrations/${registrationId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    const error: unknown = await res.json().catch(() => null);
    throw new Error(getErrorMessage(error) || 'Failed to update registration');
  }
  return res.json();
}

export async function addRegistrationStrokes(registrationId: string, delta: number): Promise<Registration> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/registrations/${registrationId}/strokes`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    body: JSON.stringify({ delta }),
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    const error: unknown = await res.json().catch(() => null);
    throw new Error(getErrorMessage(error) || 'Failed to add strokes');
  }
  return res.json();
}

export async function clearRegistrationStrokes(registrationId: string): Promise<Registration> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/registrations/${registrationId}/strokes/clear`, {
    method: 'PATCH',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    const error: unknown = await res.json().catch(() => null);
    throw new Error(getErrorMessage(error) || 'Failed to clear strokes');
  }
  return res.json();
}
