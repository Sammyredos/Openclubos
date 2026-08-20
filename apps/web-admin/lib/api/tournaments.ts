import { getAuthToken, handleAuthFailure } from './auth';
import { getTournamentScores } from './scores';

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
  maxPlayersPerGroup?: number;
  registrationOpenAt?: string;
  registrationCloseAt?: string;
  paymentDeadline?: string;
  clubId: string;
  courseId: string;
  club?: { id: string; name: string; logo?: string | null; email?: string | null } | null;
  course?: { id: string; name: string; coverImage?: string | null } | null;
  enableWaitlist?: boolean;
  enableCut?: boolean;
  cutAfterRound?: number;
  scoringType?: string;
  visibility?: string;
  createdAt?: string;
  _count?: { registrations: number };
  lockedGroupingsDays?: number[];
  bannerUrl?: string | null;
  description?: string | null;
  autoGrouping?: boolean;
  startType?: 'TEE_TIMES' | 'SHOTGUN';
  teeStartTime?: string | null;
  teeIntervalMinutes?: number;
}

export type UpdateTournamentPayload = {
  name?: string;
  startDate?: string;
  endDate?: string | null;
  status?: Tournament['status'];
  description?: string | null;
  bannerUrl?: string | null;
  venue?: string | null;
  location?: string | null;
  registrationOpenAt?: string | null;
  registrationCloseAt?: string | null;
  format?: 'STROKE_PLAY' | 'MATCH_PLAY' | 'STABLEFORD' | 'SCRAMBLE' | 'BEST_BALL';
  scoringType?: 'GROSS' | 'NET' | 'BOTH';
  holes?: number;
  divisions?: string[];
  allowRegisteredPlayers?: boolean;
  allowGuests?: boolean;
  allowExternalPlayers?: boolean;
  genderRestriction?: 'MALE_ONLY' | 'FEMALE_ONLY' | 'MIXED';
  hasHandicapRestriction?: boolean;
  minHandicap?: number | null;
  maxHandicap?: number | null;
  maxPlayers?: number | null;
  maxPlayersPerGroup?: number;
  enableWaitlist?: boolean | null;
  enableCut?: boolean;
  cutAfterRound?: number | null;
  cutLine?: number | null;
  requiresPayment?: boolean;
  entryFee?: number | null;
  currency?: string | null;
  paymentDeadline?: string | null;
  isRefundable?: boolean | null;
  autoGrouping?: boolean;
  startType?: 'TEE_TIMES' | 'SHOTGUN';
  teeStartTime?: string | null;
  teeIntervalMinutes?: number;
  enableLiveScoring?: boolean;
  requireMarkerVerification?: boolean;
  enableHoleScoring?: boolean;
  publishImmediately?: boolean;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
  clubId?: string;
  courseId?: string;
  lockedGroupingsDays?: number[];
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
  return fetch(`${API_BASE}${path}`, { ...init, credentials: 'include', cache: 'no-store' });
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
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch tournaments');
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

export async function checkTournamentName(name: string, clubId?: string, excludeId?: string): Promise<{ isUnique: boolean }> {
  if (!name || !name.trim()) return { isUnique: false };
  const params = new URLSearchParams();
  params.append('name', name.trim());
  if (excludeId) params.append('excludeId', excludeId);
  
  const res = await authedFetch(`/tournaments/check-name?${params.toString()}`, { method: 'GET' });
  if (!res.ok) {
    await handleAuthFailure(res);
    return { isUnique: true }; // Assume unique if check fails to prevent blocking
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
  // DELETE may return 204 No Content — safely parse JSON only if body is present
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function applyCut(id: string) {
  const res = await authedFetch(`/tournaments/${id}/apply-cut`, {
    method: 'POST',
  });
  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to apply cut');
  }
  return res.json();
}

// ==========================================
// TOURNEY GROUPINGS (TEE TIMES) LOGIC
// ==========================================

export interface GroupingPlayer {
  id: string;
  paymentStatus?: 'UNPAID' | 'PAID' | 'REFUNDED';
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    handicap: number | null;
    profilePhoto?: string | null;
    division?: string | null;
    gender?: string | null;
    dob?: string | null;
  } | null;
}

export interface GroupingItem {
  id: string;
  name: string;
  startTime: string | null;
  registrations: GroupingPlayer[];
}

export interface GroupingData {
  groups: GroupingItem[];
  unassigned: GroupingPlayer[];
  rule?: string;
}

export async function getGroupings(tournamentId: string, day: number = 1): Promise<GroupingData> {
  const res = await authedFetch(`/tournaments/${tournamentId}/groupings?day=${day}`, {
    method: 'GET',
  }).catch(() => null);

  if (res && res.ok) {
    return res.json();
  }

  return { groups: [], unassigned: [] };
}

export async function generateGroupings(
  tournamentId: string,
  day: number = 1,
  rule: 'RANDOM' | 'LEADERBOARD_REVERSE_GROSS' | 'LEADERBOARD_REVERSE_NET' | 'LEADERBOARD_DIRECT_GROSS' | 'LEADERBOARD_DIRECT_NET' | 'CATEGORY_RANDOM' | 'MANUAL_EMPTY' = 'RANDOM'
): Promise<GroupingData> {
  const res = await authedFetch(`/tournaments/${tournamentId}/groupings/generate?day=${day}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rule }),
  }).catch(() => null);

  if (res && res.ok) {
    return res.json();
  }

  return { groups: [], unassigned: [] };
}

export async function movePlayerInGroupings(
  tournamentId: string,
  registrationId: string,
  targetGroupId: string | null,
  day: number = 1
): Promise<GroupingData> {
  const res = await authedFetch(`/tournaments/${tournamentId}/groupings/move`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ registrationId, targetGroupId, day }),
  }).catch(() => null);

  if (res && res.ok) {
    return res.json();
  }

  throw new Error("Failed to move player in groupings.");
}

export async function updateGroupingTime(
  tournamentId: string,
  groupId: string,
  payload: { name?: string; startTime?: string },
  day: number = 1
): Promise<GroupingData> {
  const res = await authedFetch(`/tournaments/${tournamentId}/groupings/${groupId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...payload, day }),
  }).catch(() => null);

  if (res && res.ok) {
    return res.json();
  }

  throw new Error("Failed to update grouping time.");
}

export async function clearGroupings(tournamentId: string, day: number = 1): Promise<GroupingData> {
  const res = await authedFetch(`/tournaments/${tournamentId}/groupings?day=${day}`, {
    method: 'DELETE',
  }).catch(() => null);

  if (res && res.ok) {
    return res.json();
  }

  throw new Error("Failed to clear groupings.");
}

export async function publishGroupingsEmail(tournamentId: string, day: number, data: GroupingData): Promise<{ success: boolean; message: string }> {
  const res = await authedFetch(`/tournaments/${tournamentId}/groupings/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ day, groups: data.groups }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to publish groupings via email');
  }
  
  return res.json();
}

export async function publishGroupingsWhatsApp(tournamentId: string, day: number, data: GroupingData): Promise<{ success: boolean; sentCount?: number; message: string }> {
  const res = await authedFetch(`/tournaments/${tournamentId}/groupings/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ day, groups: data.groups }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to publish groupings via WhatsApp');
  }
  
  return res.json();
}

