import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  #http = inject(HttpClient);

  getNotifications() {
    return this.#http.get<{ data: Notification[]; unreadCount: number }>(
      `${environment.apiUrl}/api/notifications`
    );
  }

  markAllRead() {
    return this.#http.patch(`${environment.apiUrl}/api/notifications/read-all`, {});
  }

  markRead(id: string) {
    return this.#http.patch(`${environment.apiUrl}/api/notifications/${id}/read`, {});
  }

  deleteNotification(id: string) {
    return this.#http.delete(`${environment.apiUrl}/api/notifications/${id}`);
  }

  clearAll() {
    return this.#http.delete(`${environment.apiUrl}/api/notifications`);
  }
}
