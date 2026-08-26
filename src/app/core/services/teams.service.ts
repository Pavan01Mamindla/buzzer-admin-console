import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Team {
  id: string;
  name: string;
  shortName?: string | null;
  logoUrl?: string | null;
  organizationId?: string | null;
  sportId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamPayload {
  name: string;
  shortName?: string;
  logoUrl?: string;
  organizationId?: string;
  sportId?: string;
}

export interface TeamsResponse {
  success: boolean;
  data: Team[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TeamsService {

  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${environment.apiUrl}/api/organizations/teams`;


  // =========================================================
  // LIST TEAMS
  // =========================================================

  getTeams(
    search = '',
    page = 1,
    limit = 10
  ): Observable<TeamsResponse> {

    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    if (search.trim()) {
      params = params.set(
        'search',
        search.trim()
      );
    }

    return this.http.get<TeamsResponse>(
      this.endpoint,
      { params }
    );
  }


  // =========================================================
  // GET TEAM
  // =========================================================

  getTeam(
    id: string
  ): Observable<Team> {

    return this.http.get<Team>(
      `${this.endpoint}/${id}`
    );
  }


  // =========================================================
  // CREATE TEAM
  // =========================================================

  createTeam(
    payload: TeamPayload
  ): Observable<unknown> {

    return this.http.post(
      this.endpoint,
      payload
    );
  }


  // =========================================================
  // UPDATE TEAM
  // =========================================================

  updateTeam(
    id: string,
    payload: Partial<TeamPayload>
  ): Observable<unknown> {

    return this.http.patch(
      `${this.endpoint}/${id}`,
      payload
    );
  }


  // =========================================================
  // DELETE TEAM
  // =========================================================

  deleteTeam(
    id: string
  ): Observable<unknown> {

    return this.http.delete(
      `${this.endpoint}/${id}`
    );
  }

}
