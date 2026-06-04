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
  registrationOpenAt?: string;
  registrationCloseAt?: string;
  paymentDeadline?: string;
  clubId: string;
  courseId: string;
  club?: { id: string; name: string } | null;
  course?: { id: string; name: string } | null;
  enableWaitlist?: boolean;
  _count?: { registrations: number };
  lockedGroupingsDays?: number[];
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
  enableCut?: boolean;
  cutAfterRound?: number | null;
  cutLine?: number | null;
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

function getStorageKey(tId: string, day: number = 1) {
  return `openclub_groupings_${tId}_day_${day}`;
}

async function getFallbackPlayers(tId: string): Promise<GroupingPlayer[]> {
  try {
    const res = await authedFetch(`/registrations?tournamentId=${tId}&paymentStatus=PAID&status=APPROVED&take=1000`, {
      method: 'GET',
    });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.items || [];
      return list.map((reg: any) => ({
        id: reg.id,
        paymentStatus: reg.paymentStatus,
        extraStrokes: reg.extraStrokes || 0,
        madeCut: reg.madeCut,
        user: reg.user ? {
          id: reg.user.id || reg.userId,
          email: reg.user.email || '',
          firstName: reg.user.firstName || null,
          lastName: reg.user.lastName || null,
          handicap: reg.user.handicap != null ? Number(reg.user.handicap) : null,
          profilePhoto: reg.user.profilePhoto || null,
          gender: reg.user.gender || null,
          dob: reg.user.dob || null,
        } : null,
      })).filter((p: any) => p.madeCut !== false);
    }
  } catch {
    // Ignore and fallback
  }
  return [];
}

export async function getGroupings(tournamentId: string, day: number = 1): Promise<GroupingData> {
  const res = await authedFetch(`/tournaments/${tournamentId}/groupings?day=${day}`, {
    method: 'GET',
  }).catch(() => null);

  if (res && res.ok) {
    return res.json();
  }

  // Local Mock fallback with non-destructive merge
  const allPaidPlayers = await getFallbackPlayers(tournamentId);
  
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(getStorageKey(tournamentId, day));
    if (cached) {
      const data: GroupingData = JSON.parse(cached);
      
      // Identify players who are PAID but not in any group or unassigned list
      const assignedIds = new Set<string>();
      data.groups.forEach(g => g.registrations.forEach(p => assignedIds.add(p.id)));
      data.unassigned.forEach(p => assignedIds.add(p.id));
      
      const missingPlayers = allPaidPlayers.filter(p => !assignedIds.has(p.id));
      
      if (missingPlayers.length > 0) {
        data.unassigned = [...data.unassigned, ...missingPlayers];
        localStorage.setItem(getStorageKey(tournamentId, day), JSON.stringify(data));
      }
      return data;
    }
  }

  return { groups: [], unassigned: allPaidPlayers };
}

export async function generateGroupings(
  tournamentId: string,
  day: number = 1,
  rule: 'RANDOM' | 'LEADERBOARD_REVERSE_GROSS' | 'LEADERBOARD_REVERSE_NET' | 'LEADERBOARD_DIRECT_GROSS' | 'LEADERBOARD_DIRECT_NET' | 'CATEGORY_RANDOM' = 'RANDOM'
): Promise<GroupingData> {
  const res = await authedFetch(`/tournaments/${tournamentId}/groupings/generate?day=${day}`, {
    method: 'POST',
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
    const tRes = await authedFetch(`/tournaments/${tournamentId}`, {
      method: 'GET',
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

  // Apply grouping rules
  let sortedPlayers = [...players];
  if (rule === 'RANDOM') {
    // Shuffle players
    sortedPlayers.sort(() => Math.random() - 0.5);
  } else if (rule === 'CATEGORY_RANDOM') {
    // Balanced groups: Pick one from each category sequentially
    const getCategory = (hcap: number | null | undefined) => {
      if (hcap === null || hcap === undefined) return 99;
      if (hcap >= 0 && hcap <= 5) return 1;
      if (hcap >= 6 && hcap <= 12) return 2;
      if (hcap >= 13 && hcap <= 20) return 3;
      if (hcap >= 21 && hcap <= 28) return 4;
      return 5;
    };
    
    const buckets: Record<number, any[]> = {};
    players.forEach(p => {
      const cat = getCategory(p.user?.handicap);
      if (!buckets[cat]) buckets[cat] = [];
      buckets[cat].push(p);
    });

    // Shuffle each bucket internally
    Object.values(buckets).forEach(b => b.sort(() => Math.random() - 0.5));

    const catKeys = Object.keys(buckets).map(Number).sort((a, b) => a - b);
    const balancedPlayers: any[] = [];
    
    let playersRemaining = true;
    while (playersRemaining) {
      playersRemaining = false;
      for (const cat of catKeys) {
        if (buckets[cat] && buckets[cat].length > 0) {
          balancedPlayers.push(buckets[cat].shift());
          playersRemaining = true;
        }
      }
    }
    sortedPlayers = balancedPlayers;
  } else if (rule.startsWith('LEADERBOARD_')) {
    try {
      // Fetch scores to sort by leaderboard
      const scores = await getTournamentScores(tournamentId);
      const playerScores: Record<string, number> = {};
      const playerLastRecorded: Record<string, number> = {};
      const playerHolesCompleted: Record<string, Set<string>> = {};
      
      scores.forEach((score: any) => {
        const uid = score.userId;
        if (!playerScores[uid]) {
          playerScores[uid] = 0;
          playerLastRecorded[uid] = 0;
          playerHolesCompleted[uid] = new Set();
        }
        playerScores[uid] += score.strokes || 0;
        
        // Track unique holes played
        playerHolesCompleted[uid].add(`${score.holeId}-${score.groupId || 'nogroup'}`);
        
        const recordedTime = new Date(score.recordedAt).getTime();
        if (recordedTime > playerLastRecorded[uid]) {
          playerLastRecorded[uid] = recordedTime;
        }
      });

      sortedPlayers.sort((a, b) => {
        const getNetScore = (p: GroupingPlayer) => {
            const uid = p.user?.id || '';
            const gross = playerScores[uid] ?? 9999;
            if (gross === 9999) return 9999;
            
            const holesPlayed = playerHolesCompleted[uid]?.size || 0;
            const hcap = p.user?.handicap || 0;
            const extra = (p as any).extraStrokes || 0;
            const playingHcap = Math.round(hcap);
            const totalHcap = Math.round(playingHcap * (holesPlayed / 18));
            return gross - totalHcap + extra;
        };

        const scoreA = rule.includes('_NET') ? getNetScore(a) : (playerScores[a.user?.id || ''] ?? 9999);
        const scoreB = rule.includes('_NET') ? getNetScore(b) : (playerScores[b.user?.id || ''] ?? 9999);
        
        if (scoreA !== scoreB) {
          if (rule.includes('_REVERSE')) {
            // Worst scores (highest) go first, leaders go last
            return scoreB - scoreA;
          } else {
            // Leaders (lowest) go first
            return scoreA - scoreB;
          }
        }

        // TIE-BREAKER: First In, Last Out (FILO)
        // The player who finished earliest (smaller recorded time) tees off later.
        const timeA = playerLastRecorded[a.user?.id || ''] ?? 0;
        const timeB = playerLastRecorded[b.user?.id || ''] ?? 0;

        if (rule.includes('_REVERSE')) {
          // In reverse leaderboard, later tee time means LARGER index.
          // So if timeA < timeB (A finished earlier), A should have a LARGER index, so return positive.
          return timeB - timeA;
        } else {
          // In direct leaderboard, later tee time means LARGER index.
          // So if timeA < timeB, A should have a LARGER index, so return positive.
          return timeB - timeA;
        }
      });
    } catch (err) {
      console.error('Failed to apply leaderboard grouping rules:', err);
    }
  }

  const totalGroups = Math.ceil(sortedPlayers.length / maxPerGroup);
  for (let i = 0; i < totalGroups; i++) {
    const groupPlayers = sortedPlayers.slice(i * maxPerGroup, (i + 1) * maxPerGroup);
    
    const pad = (n: number) => n < 10 ? `0${n}` : String(n);
    const timeStr = `${pad(currentHour)}:${pad(currentMin)}`;

    groups.push({
      id: `group-${day}-${i + 1}-${Math.random().toString(36).substr(2, 9)}`,
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

  const result = { groups, unassigned, rule };
  if (typeof window !== 'undefined') {
    localStorage.setItem(getStorageKey(tournamentId, day), JSON.stringify(result));
  }
  return result;
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

  // Local Mock fallback
  const current = await getGroupings(tournamentId, day);
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
    localStorage.setItem(getStorageKey(tournamentId, day), JSON.stringify(current));
  }
  return current;
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

  // Local Mock fallback
  const current = await getGroupings(tournamentId, day);
  const targetGroup = current.groups.find(g => g.id === groupId);
  if (!targetGroup) {
    throw new Error("Group not found.");
  }

  if (payload.name !== undefined) targetGroup.name = payload.name;
  if (payload.startTime !== undefined) targetGroup.startTime = payload.startTime;

  if (typeof window !== 'undefined') {
    localStorage.setItem(getStorageKey(tournamentId, day), JSON.stringify(current));
  }
  return current;
}

export async function clearGroupings(tournamentId: string, day: number = 1): Promise<GroupingData> {
  const res = await authedFetch(`/tournaments/${tournamentId}/groupings?day=${day}`, {
    method: 'DELETE',
  }).catch(() => null);

  if (res && res.ok) {
    return res.json();
  }

  // Local Mock fallback
  if (typeof window !== 'undefined') {
    localStorage.removeItem(getStorageKey(tournamentId, day));
  }
  const players = await getFallbackPlayers(tournamentId);
  return { groups: [], unassigned: players };
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
