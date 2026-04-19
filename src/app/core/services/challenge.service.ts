import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChallengeService {
  #http = inject(HttpClient);
  #base = `${environment.apiUrl}/api/challenges`;

  getAll(status?: 'active' | 'past') {
    const options = status ? { params: { status } } : undefined;
    return this.#http.get<{ data: any[] }>(`${this.#base}`, options);
  }

  getPublic() {
    return this.#http.get<{ data: any[] }>(`${this.#base}/public`);
  }

  getActive() {
    return this.#http.get<{ data: any }>(`${this.#base}/active`);
  }

  getById(id: string) {
    return this.#http.get<{ data: any }>(`${this.#base}/${id}`);
  }

  getChallengePosts(id: string) {
    return this.#http.get<{ data: any[] }>(`${this.#base}/${id}/posts`);
  }

  create(formData: FormData) {
    return this.#http.post<{ data: any }>(`${this.#base}`, formData);
  }

  update(id: string, data: any) {
    return this.#http.patch<{ data: any }>(`${this.#base}/${id}`, data);
  }

  delete(id: string) {
    return this.#http.delete<void>(`${this.#base}/${id}`);
  }
}
