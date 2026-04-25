import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaintService {
  #http = inject(HttpClient);
  #base = `${environment.apiUrl}/api/paints`;

  getUserPaints(): Observable<any> {
    return this.#http.get<any>(`${this.#base}`);
  }

  addPaint(paint: {
    name: string;
    brand: string;
    hexColor: string;
    line?: string;
    isCustom?: boolean;
    notes?: string;
  }): Observable<any> {
    return this.#http.post<any>(`${this.#base}`, paint);
  }

  deletePaint(paintId: string): Observable<any> {
    return this.#http.delete(`${this.#base}/${paintId}`);
  }

  getCatalog(filters: { search?: string; brand?: string; type?: string; colorFamily?: string } = {}) {
    const params: any = { ...filters };
    Object.keys(params).forEach((k) => !params[k] && delete params[k]);
    return this.#http.get<{ data: any[] }>(`${this.#base}`, { params });
  }

  getMyInventory() {
    return this.#http.get<{ data: any[] }>(`${this.#base}/my-inventory`);
  }

  addToInventory(paintId: string, status = 'Full') {
    return this.#http.put(`${this.#base}/my-inventory`, { paintId, action: 'add', status });
  }

  removeFromInventory(paintId: string) {
    return this.#http.put(`${this.#base}/my-inventory`, { paintId, action: 'remove' });
  }

  updateStatus(paintId: string, status: 'Full' | 'Low' | 'Empty') {
    return this.#http.put(`${this.#base}/my-inventory`, {
      paintId,
      action: 'updateStatus',
      status,
    });
  }
}
