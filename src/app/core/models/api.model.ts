/** Everything the backend returns is wrapped like this - never read a bare body. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

/** Wrapped list response: { success, data: T[], meta }. */
export interface ApiListEnvelope<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export type Role = 'admin' | 'operator' | 'viewer' | 'org' | string;

export interface ApiUser {
  id: string;
  email: string;
  role: Role;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** Payload inside `data` for POST /api/auth/login. */
export interface LoginData {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}

export interface ListQuery {
  search?: string;
  page?: number;
  limit?: number;
  [filterKey: string]: string | number | undefined;
}

/** Base shape shared by every node in the Sport -> ... -> Player tree. */
export interface OrgEntity {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string | null;
  crestUrl?: string | null;
  photoUrl?: string | null;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  age?: number | null;
  position?: string;
  role?: string;
  [key: string]: unknown;
}

export interface Sport extends OrgEntity {
  governingBodiesCount?: number;
  organisationsCount?: number;
  participantsCount?: number;
}

export interface GoverningBody extends OrgEntity {
  sportId: string;
  organisationsCount?: number;
  participantsCount?: number;
}

export interface Organisation extends OrgEntity {
  governingBodyId: string;
  teamsCount?: number;
  participantsCount?: number;
}

export interface Team extends OrgEntity {
  organizationId: string;
  participantsCount?: number;
}

export interface Player extends OrgEntity {
  teamId: string;
  userId?: string;
}

export interface SquadMember extends OrgEntity {
  userId?: string;
}

export interface StaffMember extends OrgEntity {
  userId?: string;
  group?: string;
}

/** Grouped staff response shape: { success, data: { [group]: StaffMember[] } }. */
export type StaffGrouped = Record<string, StaffMember[]>;

export interface ImportRowResult {
  row: number;
  status: 'added' | 'skipped' | 'error';
  reason?: string;
  payload: Record<string, unknown>;
}
