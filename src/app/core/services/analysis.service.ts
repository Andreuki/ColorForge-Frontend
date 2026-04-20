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

  /**
   * Solicita feedback de IA para un análisis concreto.
   * Llama a POST /api/analysis/:analysisId/coach
   * @param analysisId  ID del análisis cuya imagen se usará
   * @param image       Imagen opcional para sobrescribir la del análisis
   */
  requestCoachFeedback(analysisId: string, image?: File): Observable<{ feedback: string }> {
    const formData = new FormData();
    if (image) {
      formData.append('image', image);
    }
    return this.http.post<{ feedback: string }>(
      `${environment.apiUrl}/api/analysis/${analysisId}/coach`,
      formData
    );
  }
}
