import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Analysis } from '../../shared/models/analysis.model';

@Injectable({ providedIn: 'root' })
export class AnalysisService {
  private readonly http = inject(HttpClient);

  private resolveId(id: string | number): string {
    return String(id);
  }

  /** Sube una imagen y genera el análisis por IA */
  uploadAnalysis(file: File): Observable<Analysis> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http
      .post<{ success: boolean; data: Analysis }>(`${environment.apiUrl}/api/analysis`, formData)
      .pipe(map((res) => res.data));
  }

  /** Obtiene todos los análisis del usuario autenticado */
  getMyAnalyses(): Observable<Analysis[]> {
    return this.http
      .get<{ success: boolean; data: Analysis[] }>(`${environment.apiUrl}/api/analysis`)
      .pipe(map((res) => res.data));
  }

  /** Obtiene un análisis concreto por su ID */
  getAnalysisById(id: string): Observable<Analysis> {
    return this.http
      .get<{ success: boolean; data: Analysis }>(`${environment.apiUrl}/api/analysis/${id}`)
      .pipe(map((res) => res.data));
  }

  /** Endpoint específico para recuperar análisis persistido por ID */
  getSavedAnalysisById(id: string): Observable<Analysis> {
    return this.http
      .get<{ success: boolean; data: Analysis }>(`${environment.apiUrl}/api/save-analysis/${id}`)
      .pipe(map((res) => res.data));
  }

  deleteAnalysis(id: string | number): Observable<void> {
    const normalizedId = this.resolveId(id);
    return this.http.delete<void>(`${environment.apiUrl}/api/analyses/${normalizedId}`);
  }

  updateAnalysisTitle(id: string | number, title: string): Observable<Analysis> {
    const normalizedId = this.resolveId(id);
    return this.http
      .patch<{ success: boolean; data: Analysis }>(`${environment.apiUrl}/api/analyses/${normalizedId}`, {
        title,
      })
      .pipe(map((res) => res.data));
  }

  requestCoachFeedback(payload: {
    postId?: string;
    image?: File;
  }): Observable<{ feedback: string }> {
    const formData = new FormData();
    if (payload.image) formData.append('image', payload.image);

    if (payload.postId) {
      return this.http.post<{ feedback: string }>(
        `${environment.apiUrl}/api/posts/${payload.postId}/coach`,
        formData
      );
    }

    return this.http.post<{ feedback: string }>(`${environment.apiUrl}/api/analysis/coach`, formData);
  }
}
