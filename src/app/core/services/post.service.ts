import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Post } from '../../shared/models/post.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/posts`;
  private readonly noCacheHeaders = new HttpHeaders({
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  });

  private resolveId(id: string | number): string {
    return String(id);
  }

  /** Publica una nueva miniatura en la galería */
  createPost(payload: FormData | { imageUrl: string; description: string }): Observable<Post> {
    return this.http
      .post<{ success?: boolean; data?: Post; post?: Post }>(this.baseUrl, payload)
      .pipe(map((res) => (res.data ?? res.post) as Post));
  }

  /** Obtiene todos los posts de la galería pública */
  getAllPosts(): Observable<Post[]> {
    return this.http
      .get<{ success: boolean; data: Post[] }>(this.baseUrl)
      .pipe(map((res) => res.data));
  }

  /** Obtiene el detalle de un post por ID */
  getPostById(id: string): Observable<Post> {
    const params = new HttpParams().set('_t', Date.now().toString());
    return this.http
      .get<{ success: boolean; data: Post }>(`${this.baseUrl}/${id}`, {
        params,
        headers: this.noCacheHeaders,
      })
      .pipe(map((res) => res.data));
  }

  /** Valora un post (1-5 estrellas) */
  ratePost(postId: string, value: number): Observable<Post> {
    return this.http
      .post<{ success?: boolean; data?: Post; post?: Post }>(`${this.baseUrl}/${postId}/rate`, { value })
      .pipe(map((res) => (res.data ?? res.post) as Post));
  }

  /** Añade un comentario a un post */
  commentPost(postId: string, text: string): Observable<Post> {
    return this.http
      .post<{ success: boolean; data: Post }>(`${this.baseUrl}/${postId}/comment`, { text })
      .pipe(map((res) => res.data));
  }

  deletePost(id: string | number): Observable<void> {
    const postId = this.resolveId(id);
    return this.http.delete<void>(`${this.baseUrl}/${postId}`);
  }

  addComment(
    postId: string | number,
    text: string,
    link?: string,
    imageFile?: File | null
  ): Observable<{ data: Post['comments'][number] }> {
    const id = this.resolveId(postId);
    const formData = new FormData();
    formData.append('text', text);
    if (link) {
      formData.append('link', link);
    }
    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.http
      .post<{
        success?: boolean;
        data?: Post['comments'][number];
        comment?: Post['comments'][number];
      }>(`${this.baseUrl}/${id}/comment`, formData)
      .pipe(
        map((res) => {
          const created = res.data ?? res.comment;
          return { data: created as Post['comments'][number] };
        })
      );
  }

  deleteComment(postId: string | number, commentId: string | number): Observable<void> {
    const id = this.resolveId(postId);
    const cId = this.resolveId(commentId);
    return this.http.delete<void>(`${this.baseUrl}/${id}/comments/${cId}`);
  }

  savePost(id: string) {
    return this.http.post<{ saved: boolean }>(`${this.baseUrl}/${id}/save`, {});
  }

  updatePost(id: string, data: FormData) {
    return this.http.patch<{ success?: boolean; data?: Post; post?: Post }>(`${this.baseUrl}/${id}`, data, {
      headers: this.noCacheHeaders,
    });
  }

  updateComment(postId: string, commentId: string, payload: FormData) {
    return this.http.patch<{ data: { text: string; editedAt: string | null; imageUrl?: string | null; link?: string | null } }>(
      `${this.baseUrl}/${postId}/comments/${commentId}`,
      payload
    );
  }

  editComment(postId: string, commentId: string, data: FormData) {
    return this.http.patch<{ data: { text: string; editedAt: string | null; imageUrl?: string | null; link?: string | null } }>(
      `${this.baseUrl}/${postId}/comments/${commentId}`,
      data
    );
  }

  getUserPosts(userId: string) {
    return this.http.get<{ data: Post[] }>(`${environment.apiUrl}/api/users/${userId}/posts`, {
      headers: this.noCacheHeaders,
    });
  }

  followUser(userId: string) {
    return this.http.post<{ following: boolean }>(
      `${environment.apiUrl}/api/users/${userId}/follow`,
      {}
    );
  }
}
