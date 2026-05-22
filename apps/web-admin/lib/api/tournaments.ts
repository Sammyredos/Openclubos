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
  registrationOpenAt?: string;
  registrationCloseAt?: string;
  paymentDeadline?: string;
  clubId: string;
  courseId: string;
  club?: { id: string; name: string } | null;
  course?: { id: string; name: string } | null;
  enableWaitlist?: boolean;
  _count?: { registrations: number };
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
  scoringType?: 'GROSS' | 'NET';
  holes?: number;
  divisions?: string[];
  allowRegisteredPlayers?: boolean;
  allowGuests?: boolean;
  allowExternalPlayers?: boolean;
  hasHandicapRestriction?: boolean;
  minHandicap?: number | null;
  maxHandicap?: number | null;
  maxPlayers?: number | null;
  maxPlayersPerGroup?: number;
  enableWaitlist?: boolean | null;
  requiresPayment?: boolean;
  entryFee?: number | null;
  currency?: string | null;
  paymentDeadline?: string | null;
  isRefundable?: boolean | null;
  autoGrouping?: boolean;
  teeStartTime?: string | null;
  teeIntervalMinutes?: number;
  enableLiveScoring?: boolean;
  requireMarkerVerification?: boolean;
  enableHoleScoring?: boolean;
  publishImmediately?: boolean;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
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
  // DELETE may return 204 No Content — safely parse JSON only if body is present
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ==========================================
// TOURNEY GROUPINGS (TEE TIMES) LOGIC
// ==========================================

export interface GroupingPlayer {
  id: string;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    handicap: number | null;
    profilePhoto?: string | null;
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
}

function getStorageKey(tId: string) {
  return `openclub_groupings_${tId}`;
}

async function getFallbackPlayers(tId: string): Promise<GroupingPlayer[]> {
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/registrations?tournamentId=${tId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : undefined),
      },
    });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.items || [];
      return list.map((reg: any) => ({
        id: reg.id,
        user: reg.user ? {
          id: reg.user.id || reg.userId,
          email: reg.user.email || '',
          firstName: reg.user.firstName || null,
          lastName: reg.user.lastName || null,
          handicap: reg.user.handicap != null ? Number(reg.user.handicap) : null,
          profilePhoto: reg.user.profilePhoto || null,
        } : null,
      }));
    }
  } catch {
    // Ignore and fallback
  }
  return [];
}

export async function getGroupings(tournamentId: string): Promise<GroupingData> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/groupings`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
  }).catch(() => null);

  if (res && res.ok) {
    return res.json();
  }

  // Local Mock fallback
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(getStorageKey(tournamentId));
    if (cached) {
      return JSON.parse(cached);
    }
  }

  const players = await getFallbackPlayers(tournamentId);
  return { groups: [], unassigned: players };
}

export async function generateGroupings(tournamentId: string): Promise<GroupingData> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/groupings/generate`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
  }).catch(() => null);

  if (res && res.ok) {
    return res.json();
  }

  // Local Mock fallback
  const players = await getFallbackPlayers(tournamentId);
  if (players.length === 0) {
    throw new Error("No registered players found to generate groupings.");
  }

  let maxPerGroup = 4;
  let interval = 10;
  let startTimeStr = "08:00";
  try {
    const tRes = await fetch(`${API_BASE}/tournaments/${tournamentId}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : undefined) }
    });
    if (tRes.ok) {
      const t = await tRes.json();
      maxPerGroup = t.maxPlayersPerGroup || 4;
      interval = t.teeIntervalMinutes || 10;
      startTimeStr = t.teeStartTime || "08:00";
    }
  } catch {
    // fallback to defaults
  }

  const groups: GroupingItem[] = [];
  const unassigned: GroupingPlayer[] = [];

  const [startHour, startMin] = startTimeStr.split(':').map(Number);
  let currentHour = isNaN(startHour) ? 8 : startHour;
  let currentMin = isNaN(startMin) ? 0 : startMin;

  const totalGroups = Math.ceil(players.length / maxPerGroup);
  for (let i = 0; i < totalGroups; i++) {
    const groupPlayers = players.slice(i * maxPerGroup, (i + 1) * maxPerGroup);
    
    const pad = (n: number) => n < 10 ? `0${n}` : String(n);
    const timeStr = `${pad(currentHour)}:${pad(currentMin)}`;

    groups.push({
      id: `group-${i + 1}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Group ${i + 1}`,
      startTime: timeStr,
      registrations: groupPlayers,
    });

    currentMin += interval;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }

  const result = { groups, unassigned };
  if (typeof window !== 'undefined') {
    localStorage.setItem(getStorageKey(tournamentId), JSON.stringify(result));
  }
  return result;
}

export async function movePlayerInGroupings(
  tournamentId: string,
  registrationId: string,
  targetGroupId: string | null
): Promise<GroupingData> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/groupings/move`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    body: JSON.stringify({ registrationId, targetGroupId }),
  }).catch(() => null);

  if (res && res.ok) {
    return res.json();
  }

  // Local Mock fallback
  const current = await getGroupings(tournamentId);
  let playerToMove: GroupingPlayer | null = null;

  current.groups = current.groups.map(g => {
    const found = g.registrations.find(p => p.id === registrationId);
    if (found) {
      playerToMove = found;
      return { ...g, registrations: g.registrations.filter(p => p.id !== registrationId) };
    }
    return g;
  });

  const unassignedFound = current.unassigned.find(p => p.id === registrationId);
  if (unassignedFound) {
    playerToMove = unassignedFound;
    current.unassigned = current.unassigned.filter(p => p.id !== registrationId);
  }

  if (!playerToMove) {
    throw new Error("Player registration not found in current tournament pairings.");
  }

  if (targetGroupId === null) {
    current.unassigned.push(playerToMove);
  } else {
    const targetGroup = current.groups.find(g => g.id === targetGroupId);
    if (!targetGroup) {
      throw new Error("Target group not found.");
    }
    targetGroup.registrations.push(playerToMove);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(getStorageKey(tournamentId), JSON.stringify(current));
  }
  return current;
}

export async function updateGroupingTime(
  tournamentId: string,
  groupId: string,
  payload: { name?: string; startTime?: string }
): Promise<GroupingData> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/groupings/${groupId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    body: JSON.stringify(payload),
  }).catch(() => null);

  if (res && res.ok) {
    return res.json();
  }

  // Local Mock fallback
  const current = await getGroupings(tournamentId);
  const targetGroup = current.groups.find(g => g.id === groupId);
  if (!targetGroup) {
    throw new Error("Group not found.");
  }

  if (payload.name !== undefined) targetGroup.name = payload.name;
  if (payload.startTime !== undefined) targetGroup.startTime = payload.startTime;

  if (typeof window !== 'undefined') {
    localStorage.setItem(getStorageKey(tournamentId), JSON.stringify(current));
  }
  return current;
}

export async function clearGroupings(tournamentId: string): Promise<GroupingData> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/groupings`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
  }).catch(() => null);

  if (res && res.ok) {
    return res.json();
  }

  // Local Mock fallback
  if (typeof window !== 'undefined') {
    localStorage.removeItem(getStorageKey(tournamentId));
  }
  const players = await getFallbackPlayers(tournamentId);
  return { groups: [], unassigned: players };
}
