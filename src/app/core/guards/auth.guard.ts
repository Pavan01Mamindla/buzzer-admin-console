import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.getAccessToken()) {
    router.navigate(['/login']);
    return of(false);
  }

  // Always re-confirm identity + role from the server on entry - never trust a
  // client-decoded JWT for authorization decisions.
  return auth.fetchCurrentUser().pipe(
    map(() => true),
    catchError(() => {
      auth.logout();
      return of(false);
    })
  );
};
