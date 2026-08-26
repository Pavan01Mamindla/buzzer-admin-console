import {
  inject
} from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
  catchError,
  map,
  of
} from 'rxjs';

import {
  AuthService
} from '../auth/auth.service';


export const authGuard: CanActivateFn = () => {

  const authService =
    inject(AuthService);

  const router =
    inject(Router);


  /*
   * No JWT means there is no point
   * calling /auth/me.
   */

  if (!authService.isAuthenticated()) {

    return router.createUrlTree([
      '/login'
    ]);
  }


  /*
   * JWT exists.
   *
   * Ask backend to validate it.
   */

  return authService.me().pipe(

    map(() => true),

    catchError(() => {

      authService.logout();

      return of(
        router.createUrlTree([
          '/login'
        ])
      );

    })

  );
};
