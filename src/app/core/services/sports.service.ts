import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  Sport,
  SportPayload,
  SportsResponse
} from '../../shared/models/sport.model';

export interface OrganizationListResponse {
  success: boolean;
  data: unknown[];
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
export class SportsService {

  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${environment.apiUrl}/api/organizations/sports`;

  private readonly organizationsEndpoint =
    `${environment.apiUrl}/api/organizations`;


  // =========================================================
  // SPORTS
  // =========================================================

  getSports(
    search = '',
    page = 1,
    limit = 10
  ): Observable<SportsResponse> {

    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    if (search.trim()) {
      params = params.set(
        'search',
        search.trim()
      );
    }

    return this.http.get<SportsResponse>(
      this.endpoint,
      { params }
    );
  }


  createSport(
    payload: SportPayload
  ): Observable<unknown> {

    return this.http.post(
      this.endpoint,
      payload
    );
  }


  updateSport(
    id: string,
    payload: Partial<SportPayload>
  ): Observable<unknown> {

    return this.http.patch(
      `${this.endpoint}/${id}`,
      payload
    );
  }


  deleteSport(
    id: string
  ): Observable<unknown> {

    return this.http.delete(
      `${this.endpoint}/${id}`
    );
  }


  // =========================================================
  // STATISTICS
  // =========================================================

  getGoverningBodiesTotal(): Observable<OrganizationListResponse> {

    const params = new HttpParams()
      .set('page', 1)
      .set('limit', 1);

    return this.http.get<OrganizationListResponse>(
      `${this.organizationsEndpoint}/governing-bodies`,
      { params }
    );
  }


  getOrganizationsTotal(): Observable<OrganizationListResponse> {

    const params = new HttpParams()
      .set('page', 1)
      .set('limit', 1);

    return this.http.get<OrganizationListResponse>(
      `${this.organizationsEndpoint}/organizations`,
      { params }
    );
  }


  getPlayersTotal(): Observable<OrganizationListResponse> {

    const params = new HttpParams()
      .set('page', 1)
      .set('limit', 1);

    return this.http.get<OrganizationListResponse>(
      `${this.organizationsEndpoint}/players`,
      { params }
    );
  }
}
