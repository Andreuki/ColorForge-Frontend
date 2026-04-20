import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  #http = inject(HttpClient);
  #base = `${environment.apiUrl}/api/admin`;

  #cleanParams(params: Record<string, unknown>): Record<string, string | number | boolean> {
    const cleaned: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== '' && value !== null && value !== undefined) {
        cleaned[key] = value as string | number | boolean;
      }
    }
    return cleaned;
  }

  // Usuarios
  getUsers(
    page = 1,
    limit = 20,
    filters: { search?: string; role?: string; isBlocked?: string } = {}
  ): Observable<{ users: any[]; total: number }> {
    const params = this.#cleanParams({ page, limit, ...filters });
    return this.#http.get<any>(`${this.#base}/users`, { params });
  }

  updateUser(id: string, data: { role?: string; active?: boolean }): Observable<any> {
    return this.#http.patch(`${this.#base}/users/${id}`, data);
  }

  blockUser(id: string, isBlocked: boolean): Observable<any> {
    return this.#http.patch(`${this.#base}/users/${id}/block`, { isBlocked });
  }

  // Estadisticas
  getStats(): Observable<{
    totalUsers: number;
    totalAnalyses: number;
    totalPosts: number;
    totalComments: number;
  }> {
    return this.#http.get<any>(`${this.#base}/stats`);
  }

  // Posts
  getAllPosts(
    page = 1,
    limit = 20,
    filters: { search?: string; privacy?: string; faction?: string } = {}
  ): Observable<{ data: any[]; total: number }> {
    const params = this.#cleanParams({ page, limit, ...filters });
    return this.#http.get<any>(`${this.#base}/posts`, { params });
  }

  deletePost(id: string): Observable<void> {
    return this.#http.delete<void>(`${this.#base}/posts/${id}`);
  }

  // Analisis
  getAllAnalyses(
    page = 1,
    limit = 20,
    filters: { search?: string; faction?: string } = {}
  ): Observable<{ data: any[]; total: number }> {
    const params = this.#cleanParams({ page, limit, ...filters });
    return this.#http.get<any>(`${this.#base}/analyses`, { params });
  }

  deleteAnalysis(id: string): Observable<void> {
    return this.#http.delete<void>(`${this.#base}/analyses/${id}`);
  }

  // Challenges
  getChallenges(): Observable<any> {
    return this.#http.get<any>(`${this.#base}/challenges`);
  }

  // Comentarios
  deleteComment(postId: string, commentId: string): Observable<void> {
    return this.#http.delete<void>(`${this.#base}/posts/${postId}/comments/${commentId}`);
  }
}