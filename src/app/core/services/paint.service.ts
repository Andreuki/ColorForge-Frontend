import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaintService {
  #http = inject(HttpClient);
  #base = `${environment.apiUrl}/api/paints`;

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
