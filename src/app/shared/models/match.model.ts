export type MatchStatus =
  | 'SCHEDULED'
  | 'LIVE'
  | 'FINISHED'
  | 'CANCELLED';

export interface MatchTeam {
  id: string;
  name: string;
  shortName?: string | null;
  logoUrl?: string | null;
}

export interface Match {
  id: string;

  sportId?: string | null;
  sport?: {
    id?: string;
    name?: string;
  } | null;

  homeTeam?: MatchTeam | null;
  awayTeam?: MatchTeam | null;

  venue?: string | null;

  scheduledAt?: string | null;

  status: MatchStatus;

  homeScore?: number;
  awayScore?: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface MatchesMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MatchesResponse {
  success: boolean;
  data: Match[];
  meta: MatchesMeta;
}

export interface CreateMatchPayload {
  sportId: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledAt: string;
  venue: string;
}

export interface UpdateMatchPayload {
  sportId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  scheduledAt?: string | null;
  venue?: string;
}

export interface MatchEventPayload {
  type: string;
  teamId?: string;
  playerId?: string;
  minute?: number;
  note?: string;
}
