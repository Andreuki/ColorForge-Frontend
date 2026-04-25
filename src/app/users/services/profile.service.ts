import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, inject, resource, ResourceRef } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/models/user.model';

interface ProfileResponse {
  user: User;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  #http = inject(HttpClient);
  #noCacheHeaders = new HttpHeaders({
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  });

  getProfileResource(id: Signal<number | string | undefined>): ResourceRef<ProfileResponse | undefined> {
    return resource({
      request: () => id(),
      loader: async ({ request }) => {
        const endpoint = request !== undefined ? `/api/users/profile/${request}` : '/api/users/me';
        const rawResponse = await firstValueFrom(
          this.#http.get<any>(
            `${environment.apiUrl}${endpoint}`,
            { headers: this.#noCacheHeaders }
          )
        );

        const user = rawResponse?.data ?? rawResponse?.user ?? rawResponse;
        if (!user?._id) return undefined;

        return { user } as ProfileResponse;
      },
    });
  }

  saveProfile(name: string, email: string): Observable<User> {
    return this.#http
      .patch<{ success?: boolean; data?: User; user?: User }>(
        `${environment.apiUrl}/api/users/me`,
        { name, email },
        { headers: this.#noCacheHeaders }
      )
      .pipe(
        map((res) => {
          const user = res.user ?? res.data;
          return user as User;
        })
      );
  }

  savePassword(password: string): Observable<void> {
    return this.#http.patch<void>(
      `${environment.apiUrl}/api/users/me/password`,
      { password },
      { headers: this.#noCacheHeaders }
    );
  }

  deleteMyAccount(): Observable<void> {
    return this.#http.delete<void>(`${environment.apiUrl}/api/users/me`, {
      headers: this.#noCacheHeaders,
    });
  }

  uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.#http
      .post<{ success?: boolean; data?: { avatarUrl: string; user?: User }; avatarUrl?: string }>(
        `${environment.apiUrl}/api/users/me/avatar`,
        formData,
        { headers: this.#noCacheHeaders }
      )
      .pipe(
        map((res) => {
          const avatarUrl = res.avatarUrl ?? res.data?.avatarUrl ?? '';
          return { avatarUrl };
        })
      );
  }

  getFollowers(userId: string): Observable<User[]> {
    return this.#http
      .get<{ success?: boolean; data?: User[] }>(
        `${environment.apiUrl}/api/users/${userId}/followers`,
        { headers: this.#noCacheHeaders }
      )
      .pipe(map((res) => res.data ?? []));
  }

  getFollowing(userId: string): Observable<User[]> {
    return this.#http
      .get<{ success?: boolean; data?: User[] }>(
        `${environment.apiUrl}/api/users/${userId}/following`,
        { headers: this.#noCacheHeaders }
      )
      .pipe(map((res) => res.data ?? []));
  }

  unfollowUser(userId: string): Observable<void> {
    return this.#http.delete<void>(`${environment.apiUrl}/api/users/${userId}/follow`, {
      headers: this.#noCacheHeaders,
    });
  }
}
