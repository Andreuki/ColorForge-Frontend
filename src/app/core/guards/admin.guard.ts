import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.currentUser()) {
    return router.createUrlTree(['/']);
  }

  return auth.refreshUser().pipe(
    map((user) => (user?.role === 'admin' ? true : router.createUrlTree(['/']))),
    catchError(() => of(router.createUrlTree(['/'])))
  );
};
