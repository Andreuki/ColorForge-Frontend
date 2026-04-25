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

/**
 * Handler para el evento (error) de <img> de avatar.
 * Si la imagen no carga, sustituye src por un SVG generado inline.
 */
export function onAvatarError(event: Event): void {
  const img = event.target as HTMLImageElement;
  img.onerror = null;
  img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%231a1a1a'/%3E%3Ccircle cx='20' cy='16' r='7' fill='%23c8922a' opacity='0.7'/%3E%3Cellipse cx='20' cy='34' rx='12' ry='8' fill='%23c8922a' opacity='0.7'/%3E%3C/svg%3E";
}
