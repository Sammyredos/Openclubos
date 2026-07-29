export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status: MemberStatus;
  handicap?: number;
}

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CLUB_ADMIN: 'CLUB_ADMIN',
  PLAYER: 'PLAYER',
  MARKER: 'MARKER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const MemberStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  SUSPENDED: 'SUSPENDED',
} as const;
export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];

export interface Club {
  id: string;
  name: string;
  address?: string;
}

export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  status: TournamentStatus;
}

export const TournamentStatus = {
  DRAFT: 'DRAFT',
  REGISTRATION_OPEN: 'REGISTRATION_OPEN',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type TournamentStatus = (typeof TournamentStatus)[keyof typeof TournamentStatus];

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface SystemStatus {
  status: 'ok' | 'error';
  version: string;
  timestamp: string;
}

export const TournamentFormat = {
  STROKE_PLAY: 'STROKE_PLAY',
  MATCH_PLAY: 'MATCH_PLAY',
  STABLEFORD: 'STABLEFORD',
  SCRAMBLE: 'SCRAMBLE',
  BEST_BALL: 'BEST_BALL',
} as const;
export type TournamentFormat = (typeof TournamentFormat)[keyof typeof TournamentFormat];

export const ScoringType = {
  GROSS: 'GROSS',
  NET: 'NET',
  BOTH: 'BOTH',
} as const;
export type ScoringType = (typeof ScoringType)[keyof typeof ScoringType];

export const TournamentVisibility = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
  INVITE_ONLY: 'INVITE_ONLY',
} as const;
export type TournamentVisibility = (typeof TournamentVisibility)[keyof typeof TournamentVisibility];

export const GenderRestriction = {
  MALE_ONLY: 'MALE_ONLY',
  FEMALE_ONLY: 'FEMALE_ONLY',
  MIXED: 'MIXED',
} as const;
export type GenderRestriction = (typeof GenderRestriction)[keyof typeof GenderRestriction];

export const TournamentStartType = {
  TEE_TIMES: 'TEE_TIMES',
  SHOTGUN: 'SHOTGUN',
} as const;
export type TournamentStartType = (typeof TournamentStartType)[keyof typeof TournamentStartType];
