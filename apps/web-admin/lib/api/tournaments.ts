import { getAuthToken, handleAuthFailure } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  status: 'DRAFT' | 'REGISTRATION_OPEN' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  entryFee?: number;
  minHandicap?: number;
  maxHandicap?: number;
  playerTypes: string[];
  maxPlayers?: number;
  registrationDeadline?: string;
  clubId: string;
  courseId: string;
  club?: { id: string; name: string } | null;
  course?: { id: string; name: string } | null;
  _count?: { registrations: number };
}

export type UpdateTournamentPayload = {
  name?: string;
  startDate?: string;
  endDate?: string | null;
  status?: Tournament['status'];
  entryFee?: number;
  minHandicap?: number;
  maxHandicap?: number;
  playerTypes?: string[];
  maxPlayers?: number;
  registrationDeadline?: string | null;
  clubId?: string;
  courseId?: string;
};

type QueryValue = string | number | boolean | null | undefined;
type QueryRecord = Record<string, QueryValue>;

function toSearchParams(query?: QueryRecord) {
  const sp = new URLSearchParams();
  if (!query) return sp;
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    sp.set(k, String(v));
  }
  return sp;
}

async function authedFetch(path: string, init: RequestInit) {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_BASE}${path}`, { ...init, headers, cache: 'no-store' });
}

export async function createTournament(data: Record<string, unknown>) {
  const res = await authedFetch(`/tournaments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json();
    throw new Error(error.message || 'Failed to create tournament');
  }
  return res.json();
}

export async function getTournaments(query?: QueryRecord) {
  const searchParams = toSearchParams(query);
  // Add cache buster
  searchParams.set('_t', Date.now().toString());
  const qs = searchParams.toString();
  const res = await authedFetch(`/tournaments${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    throw new Error('Failed to fetch tournaments');
  }
  return res.json();
}

export async function getTournamentsPaged(query?: QueryRecord): Promise<{ items: Tournament[]; total: number }> {
  const searchParams = toSearchParams(query);
  const qs = searchParams.toString();
  const res = await authedFetch(`/tournaments/paged${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch tournaments');
  }
  return res.json();
}

export async function getTournament(id: string) {
  const res = await authedFetch(`/tournaments/${id}`, { method: 'GET' });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch tournament');
  }
  return res.json();
}

export async function updateTournament(id: string, payload: UpdateTournamentPayload) {
  const res = await authedFetch(`/tournaments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to update tournament');
  }
  return res.json();
}

export async function cancelTournament(id: string) {
  return updateTournament(id, { status: 'CANCELLED' });
}

export async function deleteTournament(id: string) {
  const res = await authedFetch(`/tournaments/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to delete tournament');
  }
  return res.json();
}
