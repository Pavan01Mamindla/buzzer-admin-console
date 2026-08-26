import {
  HttpInterceptorFn
} from '@angular/common/http';

import {
  inject
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  catchError,
  throwError
} from 'rxjs';

import {
  TokenStorageService
} from '../auth/token-storage.service';


export const authInterceptor: HttpInterceptorFn = (
  req,
  next
) => {

  const tokenStorage =
    inject(TokenStorageService);

  const router =
    inject(Router);


  const token =
    tokenStorage.getAccessToken();


  /*
   * Don't attach a token to login.
   */

  const isLoginRequest =
    req.url.includes('/api/auth/login');


  let request = req;


  if (
    token &&
    !isLoginRequest
  ) {

    request = req.clone({

      setHeaders: {
        Authorization: `Bearer ${token}`
      }

    });

  }


  return next(request).pipe(

    catchError((error) => {

      if (
        error.status === 401 &&
        !isLoginRequest
      ) {

        tokenStorage.clear();

        router.navigate([
          '/login'
        ]);

      }


      return throwError(
        () => error
      );

    })

  );
};
