import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {

  private readonly accessTokenKey = 'buzzer_access_token';
  private readonly refreshTokenKey = 'buzzer_refresh_token';

  setTokens(
    accessToken: string,
    refreshToken: string
  ): void {
    localStorage.setItem(
      this.accessTokenKey,
      accessToken
    );

    localStorage.setItem(
      this.refreshTokenKey,
      refreshToken
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(
      this.accessTokenKey
    );
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(
      this.refreshTokenKey
    );
  }

  clear(): void {
    localStorage.removeItem(
      this.accessTokenKey
    );

    localStorage.removeItem(
      this.refreshTokenKey
    );
  }

  hasToken(): boolean {
    return !!this.getAccessToken();
  }
}
