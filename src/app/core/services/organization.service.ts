import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiEnvelope,
  ApiListEnvelope,
  GoverningBody,
  ListQuery,
  Organisation,
  Player,
  Team
} from '../models/api.model';
import { PagedResult, toHttpParams, unwrap, unwrapList } from '../http/api-envelope.util';

export interface NodePayload {
  name: string;
  description?: string;
  iconUrl?: string;
  crestUrl?: string;
  [parentIdKey: string]: unknown;
}

/**
 * Sport -> Governing Body -> Organisation -> Team -> Player tree.
 * All four child collections live under `/api/organizations/` and are filtered
 * server-side by the parent id query param (never fetch-all-then-filter client-side):
 *   governing-bodies?sportId=
 *   organizations?governingBodyId=
 *   teams?organizationId=
 *   players?teamId=
 */
@Injectable({ providedIn: 'root' })
export class OrganizationTreeService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/organizations`;

  // ---- Governing Bodies (parent: Sport) ----------------------------------
  listGoverningBodies(sportId: string, query: ListQuery = {}): Observable<PagedResult<GoverningBody>> {
    return unwrapList(
      this.http.get<ApiListEnvelope<GoverningBody>>(`${this.base}/governing-bodies`, {
        params: toHttpParams({ ...query, sportId })
      })
    );
  }

  getGoverningBody(id: string): Observable<GoverningBody> {
    return unwrap(this.http.get<ApiEnvelope<GoverningBody>>(`${this.base}/governing-bodies/${id}`));
  }

  createGoverningBody(sportId: string, payload: NodePayload): Observable<GoverningBody> {
    return unwrap(
      this.http.post<ApiEnvelope<GoverningBody>>(`${this.base}/governing-bodies`, { ...payload, sportId })
    );
  }

  updateGoverningBody(id: string, payload: Partial<NodePayload>): Observable<GoverningBody> {
    return unwrap(this.http.patch<ApiEnvelope<GoverningBody>>(`${this.base}/governing-bodies/${id}`, payload));
  }

  deleteGoverningBody(id: string): Observable<void> {
    return unwrap(this.http.delete<ApiEnvelope<void>>(`${this.base}/governing-bodies/${id}`));
  }

  // ---- Organisations (parent: Governing Body) ----------------------------
  listOrganisations(governingBodyId: string, query: ListQuery = {}): Observable<PagedResult<Organisation>> {
    return unwrapList(
      this.http.get<ApiListEnvelope<Organisation>>(`${this.base}/organizations`, {
        params: toHttpParams({ ...query, governingBodyId })
      })
    );
  }

  getOrganisation(id: string): Observable<Organisation> {
    return unwrap(this.http.get<ApiEnvelope<Organisation>>(`${this.base}/organizations/${id}`));
  }

  createOrganisation(governingBodyId: string, payload: NodePayload): Observable<Organisation> {
    return unwrap(
      this.http.post<ApiEnvelope<Organisation>>(`${this.base}/organizations`, { ...payload, governingBodyId })
    );
  }

  updateOrganisation(id: string, payload: Partial<NodePayload>): Observable<Organisation> {
    return unwrap(this.http.patch<ApiEnvelope<Organisation>>(`${this.base}/organizations/${id}`, payload));
  }

  deleteOrganisation(id: string): Observable<void> {
    return unwrap(this.http.delete<ApiEnvelope<void>>(`${this.base}/organizations/${id}`));
  }

  // ---- Teams (parent: Organisation) --------------------------------------
  listTeams(organizationId: string, query: ListQuery = {}): Observable<PagedResult<Team>> {
    return unwrapList(
      this.http.get<ApiListEnvelope<Team>>(`${this.base}/teams`, {
        params: toHttpParams({ ...query, organizationId })
      })
    );
  }

  getTeam(id: string): Observable<Team> {
    return unwrap(this.http.get<ApiEnvelope<Team>>(`${this.base}/teams/${id}`));
  }

  createTeam(organizationId: string, payload: NodePayload): Observable<Team> {
    return unwrap(this.http.post<ApiEnvelope<Team>>(`${this.base}/teams`, { ...payload, organizationId }));
  }

  updateTeam(id: string, payload: Partial<NodePayload>): Observable<Team> {
    return unwrap(this.http.patch<ApiEnvelope<Team>>(`${this.base}/teams/${id}`, payload));
  }

  deleteTeam(id: string): Observable<void> {
    return unwrap(this.http.delete<ApiEnvelope<void>>(`${this.base}/teams/${id}`));
  }

  // ---- Players / Participants (parent: Team) -----------------------------
  listPlayers(teamId: string, query: ListQuery = {}): Observable<PagedResult<Player>> {
    return unwrapList(
      this.http.get<ApiListEnvelope<Player>>(`${this.base}/players`, {
        params: toHttpParams({ ...query, teamId })
      })
    );
  }

  createPlayer(teamId: string, payload: NodePayload): Observable<Player> {
    return unwrap(this.http.post<ApiEnvelope<Player>>(`${this.base}/players`, { ...payload, teamId }));
  }

  updatePlayer(id: string, payload: Partial<NodePayload>): Observable<Player> {
    return unwrap(this.http.patch<ApiEnvelope<Player>>(`${this.base}/players/${id}`, payload));
  }

  deletePlayer(id: string): Observable<void> {
    return unwrap(this.http.delete<ApiEnvelope<void>>(`${this.base}/players/${id}`));
  }
}
