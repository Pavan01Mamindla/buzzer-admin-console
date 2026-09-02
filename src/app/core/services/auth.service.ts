import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, shareReplay, finalize, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, ApiUser, LoginData, LoginRequest, Role } from '../models/api.model';
import { unwrap } from '../http/api-envelope.util';

const ACCESS_TOKEN_KEY = 'buzzer_access_token';
const REFRESH_TOKEN_KEY = 'buzzer_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /**
   * Tokens are kept purely so a page refresh doesn't log the user out - this is
   * session persistence, not app data seeding (see gotcha #3).
   */
  private readonly accessToken = signal<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY));
  private readonly refreshTokenValue = signal<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY));

  /** Populated only from GET /api/auth/me - never decoded from the JWT client-side. */
  readonly currentUser = signal<ApiUser | null>(null);
  readonly isAuthenticated = computed(() => !!this.accessToken());
  readonly role = computed<Role | null>(() => this.currentUser()?.role ?? null);

  /** Keeps concurrent 401s from firing multiple parallel refreshes (gotcha #5). */
  private refreshInFlight$: Observable<LoginData> | null = null;

  getAccessToken(): string | null {
    return this.accessToken();
  }

  getRefreshToken(): string | null {
    return this.refreshTokenValue();
  }

  login(payload: LoginRequest): Observable<LoginData> {
    return unwrap(
      this.http.post<ApiEnvelope<LoginData>>(`${environment.apiUrl}/auth/login`, payload)
    ).pipe(
      tap((data) => {
        this.setTokens(data.accessToken, data.refreshToken);
        this.currentUser.set(data.user);
      })
    );
  }

  fetchCurrentUser(): Observable<ApiUser> {
    return unwrap(this.http.get<ApiEnvelope<ApiUser>>(`${environment.apiUrl}/auth/me`)).pipe(
      tap((user) => this.currentUser.set(user))
    );
  }

  /**
   * Refreshes the access token exactly once even if several requests 401 at the
   * same moment - they all subscribe to the same in-flight observable instead of
   * each triggering their own POST /auth/refresh (refresh rotates the token, so a
   * second parallel refresh would revoke the first one and kill the session).
   */
  refreshAccessToken(): Observable<LoginData> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const refreshToken = this.refreshTokenValue();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshInFlight$ = unwrap(
      this.http.post<ApiEnvelope<LoginData>>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
    ).pipe(
      tap((data) => this.setTokens(data.accessToken, data.refreshToken)),
      finalize(() => (this.refreshInFlight$ = null)),
      shareReplay(1)
    );

    return this.refreshInFlight$;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken.set(accessToken);
    this.refreshTokenValue.set(refreshToken);
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  /** Best-effort call to invalidate the refresh token server-side, then clears locally either way. */
  logout(): void {
    const refreshToken = this.refreshTokenValue();
    this.clearSession();
    this.router.navigate(['/login']);
    if (refreshToken) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken }).subscribe({
        error: () => {} // already logged out locally regardless of server response
      });
    }
  }

  private clearSession(): void {
    this.accessToken.set(null);
    this.refreshTokenValue.set(null);
    this.currentUser.set(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  /** Sports / Governing Bodies / Organisations / Teams / Players. */
  canWriteCatalogue(): boolean {
    const r = this.role();
    return r === 'admin' || r === 'operator';
  }

  /** Squad & Staff, including bulk import of either. */
  canWriteRoster(): boolean {
    const r = this.role();
    return r === 'admin' || r === 'org';
  }
}
