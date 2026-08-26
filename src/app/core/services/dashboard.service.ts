import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardResult {
  revenue: unknown;
  matches: unknown;
  users: unknown;
  engagement: unknown;
  paymentSummary: unknown;
  recentMatches: unknown;
  recentTransactions: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private readonly http = inject(HttpClient);

  private readonly api =
    `${environment.apiUrl}/api`;

  getDashboard(): Observable<DashboardResult> {

    const params = new HttpParams()
      .set('page', 1)
      .set('limit', 5);

    return forkJoin({
      revenue: this.http.get(`${this.api}/analytics/revenue`),
      matches: this.http.get(`${this.api}/analytics/matches`),
      users: this.http.get(`${this.api}/analytics/users`),
      engagement: this.http.get(`${this.api}/analytics/engagement`),
      paymentSummary: this.http.get(`${this.api}/payments/summary`),
      recentMatches: this.http.get(`${this.api}/matches`, { params }),
      recentTransactions: this.http.get(
        `${this.api}/payments/transactions`,
        { params }
      )
    });
  }
}
