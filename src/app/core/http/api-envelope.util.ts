import { HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiEnvelope, ApiListEnvelope, ListQuery, PaginationMeta } from '../models/api.model';

/** Unwraps `{ success, data }` -> `data`. */
export function unwrap<T>(source: Observable<ApiEnvelope<T>>): Observable<T> {
  return source.pipe(map((res) => res.data));
}

export interface PagedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Unwraps `{ success, data, meta }` -> `{ data, meta }`, keeping meta.total for stat cards. */
export function unwrapList<T>(source: Observable<ApiListEnvelope<T>>): Observable<PagedResult<T>> {
  return source.pipe(map((res) => ({ data: res.data, meta: res.meta })));
}

export function toHttpParams(query: ListQuery = {}): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, value as string | number);
    }
  }
  return params;
}
