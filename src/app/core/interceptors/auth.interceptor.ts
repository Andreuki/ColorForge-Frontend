import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Functional interceptor que añade el token JWT a todas las peticiones
 * hacia la API propia. No modifica peticiones a dominios externos.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  // Inyecta token tanto para URLs absolutas de backend como para /api relativas.
  const absoluteApiUrl = environment.apiUrl;
  const isRelativeApi = req.url.startsWith('/api/');
  const isAbsoluteApi = absoluteApiUrl !== '' && req.url.startsWith(`${absoluteApiUrl}/api/`);
  const isApiRequest = isRelativeApi || isAbsoluteApi;

  // Evita respuestas cacheadas en peticiones API para prevenir estado obsoleto.
  const noCacheReq = isApiRequest
    ? req.clone({
        setHeaders: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      })
    : req;

  if (token && isApiRequest) {
    const cloned = noCacheReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    return next(cloned).pipe(
      catchError((error) => {
        if (error?.status === 401) {
          localStorage.removeItem('token');
          router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }

  return next(noCacheReq).pipe(
    catchError((error) => {
      if (error?.status === 401 && isApiRequest) {
        localStorage.removeItem('token');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
