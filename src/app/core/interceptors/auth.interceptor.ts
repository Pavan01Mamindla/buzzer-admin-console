import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout'];

function withAuthHeader(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => req.url.includes(path));

  const authReq = withAuthHeader(req, auth.getAccessToken());

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 403 is a permissions problem, not a session problem - surface it to the
      // calling component instead of logging the user out.
      if (error.status === 403) {
        return throwError(() => error);
      }

      // Only attempt a refresh for a genuine expired-session 401 on a non-auth
      // request. If refreshing itself 401s, there's no session left to save.
      if (error.status === 401 && !isAuthEndpoint && auth.getRefreshToken()) {
        return auth.refreshAccessToken().pipe(
          switchMap(() => next(withAuthHeader(req, auth.getAccessToken()))),
          catchError((refreshErr) => {
            auth.logout();
            return throwError(() => refreshErr);
          })
        );
      }

      if (error.status === 401) {
        auth.logout();
      }

      return throwError(() => error);
    })
  );
};
