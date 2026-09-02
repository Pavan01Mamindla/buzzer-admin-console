import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, SquadMember, StaffGrouped, StaffMember } from '../models/api.model';
import { unwrap } from '../http/api-envelope.util';

export interface AthleteProfile {
  userId: string;
  photoUrl: string | null;
  age: number | null;
  [key: string]: unknown;
}

/**
 * Squad & staff hang off the Organisation node (unchanged from week 1's brief).
 * Writes here require admin or org - never operator - see AuthService.canWriteRoster().
 */
@Injectable({ providedIn: 'root' })
export class SquadStaffService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getSquad(organisationId: string): Observable<SquadMember[]> {
    return unwrap(
      this.http.get<ApiEnvelope<SquadMember[]>>(`${this.base}/organizations/${organisationId}/squad`)
    );
  }

  addSquadMember(organisationId: string, payload: Partial<SquadMember>): Observable<SquadMember> {
    return unwrap(
      this.http.post<ApiEnvelope<SquadMember>>(`${this.base}/organizations/${organisationId}/squad`, payload)
    );
  }

  updateSquadMember(id: string, payload: Partial<SquadMember>): Observable<SquadMember> {
    return unwrap(this.http.patch<ApiEnvelope<SquadMember>>(`${this.base}/squad/${id}`, payload));
  }

  removeSquadMember(id: string): Observable<void> {
    return unwrap(this.http.delete<ApiEnvelope<void>>(`${this.base}/squad/${id}`));
  }

  /** Flat list - kept for completeness, prefer `getStaffGrouped` for rendering. */
  getStaffFlat(organisationId: string): Observable<StaffMember[]> {
    return unwrap(
      this.http.get<ApiEnvelope<StaffMember[]>>(`${this.base}/organizations/${organisationId}/staff`)
    );
  }

  /** `groups` preserves the intended display order - render from this, not the flat list. */
  getStaffGrouped(organisationId: string): Observable<StaffGrouped> {
    return this.http
      .get<{ success: boolean; data: StaffMember[]; groups?: StaffGrouped }>(
        `${this.base}/organizations/${organisationId}/staff`
      )
      .pipe(map((res) => res.groups ?? {}));
  }

  addStaffMember(organisationId: string, payload: Partial<StaffMember>): Observable<StaffMember> {
    return unwrap(
      this.http.post<ApiEnvelope<StaffMember>>(`${this.base}/organizations/${organisationId}/staff`, payload)
    );
  }

  updateStaffMember(id: string, payload: Partial<StaffMember>): Observable<StaffMember> {
    return unwrap(this.http.patch<ApiEnvelope<StaffMember>>(`${this.base}/staff/${id}`, payload));
  }

  removeStaffMember(id: string): Observable<void> {
    return unwrap(this.http.delete<ApiEnvelope<void>>(`${this.base}/staff/${id}`));
  }

  getAthleteProfile(userId: string): Observable<AthleteProfile | null> {
    return unwrap(this.http.get<ApiEnvelope<AthleteProfile | null>>(`${this.base}/athletes/${userId}`));
  }
}
