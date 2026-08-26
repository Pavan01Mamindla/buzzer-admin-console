import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

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
export class OrganizationsService {

  private readonly http = inject(HttpClient);

  private readonly baseUrl =
    `${environment.apiUrl}/api/organizations`;

  getGoverningBodies(): Observable<OrganizationListResponse> {

    const params = new HttpParams()
      .set('page', 1)
      .set('limit', 1);

    return this.http.get<OrganizationListResponse>(
      `${this.baseUrl}/governing-bodies`,
      { params }
    );
  }

  getOrganizations(): Observable<OrganizationListResponse> {

    const params = new HttpParams()
      .set('page', 1)
      .set('limit', 1);

    return this.http.get<OrganizationListResponse>(
      `${this.baseUrl}/organizations`,
      { params }
    );
  }

  getPlayers(): Observable<OrganizationListResponse> {

    const params = new HttpParams()
      .set('page', 1)
      .set('limit', 1);

    return this.http.get<OrganizationListResponse>(
      `${this.baseUrl}/players`,
      { params }
    );
  }
}
