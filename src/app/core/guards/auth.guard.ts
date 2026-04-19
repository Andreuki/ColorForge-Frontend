import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Guard funcional que protege rutas privadas */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.currentUser() ? true : inject(Router).createUrlTree(['/login']);
};
