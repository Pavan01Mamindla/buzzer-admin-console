import {
  Injectable,
  inject,
  signal
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  tap
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';

import {
  TokenStorageService
} from './token-storage.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginUser {
  id: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;

  data: {
    accessToken: string;
    refreshToken: string;
    user: LoginUser;
  };
}

export interface MeResponse {
  success: boolean;

  data: LoginUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);

  private readonly tokenStorage =
    inject(TokenStorageService);

  private readonly endpoint =
    `${environment.apiUrl}/api/auth`;

  readonly user = signal<LoginUser | null>(null);


  login(
    credentials: LoginRequest
  ): Observable<LoginResponse> {

    return this.http
      .post<LoginResponse>(
        `${this.endpoint}/login`,
        credentials
      )
      .pipe(

        tap((response) => {

          this.tokenStorage.setTokens(
            response.data.accessToken,
            response.data.refreshToken
          );

          this.user.set(
            response.data.user
          );

        })

      );
  }


  me(): Observable<MeResponse> {

    return this.http
      .get<MeResponse>(
        `${this.endpoint}/me`
      )
      .pipe(

        tap((response) => {

          this.user.set(
            response.data
          );

        })

      );
  }


  isAuthenticated(): boolean {

    return this.tokenStorage.hasToken();
  }


  logout(): void {

    this.tokenStorage.clear();

    this.user.set(null);
  }


  getAccessToken(): string | null {

    return this.tokenStorage.getAccessToken();
  }
}
