import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Guard funcional que protege rutas privadas */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.initialized$.pipe(
    filter((done) => done),
    take(1),
    map(() => (authService.currentUser() ? true : router.createUrlTree(['/login'])))
  );
};
