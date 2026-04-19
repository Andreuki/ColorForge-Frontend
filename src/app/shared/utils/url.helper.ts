import { environment } from '../../../environments/environment';

/**
 * Convierte una ruta relativa del backend en URL absoluta.
 * Si ya es absoluta (http/https) la devuelve tal cual.
 */
export function toAbsoluteUrl(path: string | null | undefined): string {
  if (!path) return 'assets/placeholders/placeholder-1.svg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${environment.uploadsUrl}${path}`;
}
