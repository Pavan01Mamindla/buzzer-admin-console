import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, ApiListEnvelope, ListQuery, Sport } from '../models/api.model';
import { PagedResult, toHttpParams, unwrap, unwrapList } from '../http/api-envelope.util';

export interface SportPayload {
  name: string;
  description?: string;
  iconUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class SportsService {
  private readonly http = inject(HttpClient);
  /** Note the Z: `organizations`, not `organisations`/`orgs`. */
  private readonly base = `${environment.apiUrl}/organizations/sports`;

  list(query: ListQuery = {}): Observable<PagedResult<Sport>> {
    return unwrapList(
      this.http.get<ApiListEnvelope<Sport>>(this.base, { params: toHttpParams(query) })
    );
  }

  get(id: string): Observable<Sport> {
    return unwrap(this.http.get<ApiEnvelope<Sport>>(`${this.base}/${id}`));
  }

  create(payload: SportPayload): Observable<Sport> {
    return unwrap(this.http.post<ApiEnvelope<Sport>>(this.base, payload));
  }

  update(id: string, payload: Partial<SportPayload>): Observable<Sport> {
    return unwrap(this.http.patch<ApiEnvelope<Sport>>(`${this.base}/${id}`, payload));
  }

  remove(id: string): Observable<void> {
    return unwrap(this.http.delete<ApiEnvelope<void>>(`${this.base}/${id}`));
  }

  /** Cheap way to read `meta.total` without pulling the full collection. */
  total(query: ListQuery = {}): Observable<PagedResult<Sport>> {
    return this.list({ ...query, limit: 1 });
  }
}
