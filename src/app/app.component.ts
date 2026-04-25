import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { Notification } from './shared/models/notification.model';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { NotificationService } from './shared/services/notification.service';
import { toAbsoluteUrl, onAvatarError } from './shared/utils/url.helper';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly authService = inject(AuthService);
  readonly #notificationService = inject(NotificationService);
  readonly #router = inject(Router);

  currentUser = this.authService.currentUser;
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  showNotifications = signal(false);
  readonly toAbsoluteUrl = toAbsoluteUrl;
  readonly onAvatarError = onAvatarError;

  // Estado del menú hamburguesa en móvil
  menuOpen = signal(false);

  constructor() {
    effect(() => {
      if (this.authService.currentUser()) {
        this.loadNotifications();
      } else {
        this.notifications.set([]);
        this.unreadCount.set(0);
        this.showNotifications.set(false);
      }
    });
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleNotifications(): void {
    this.showNotifications.update((v) => !v);
  }

  loadNotifications(): void {
    this.#notificationService.getNotifications().subscribe((res) => {
      this.notifications.set(res.data);
      this.unreadCount.set(res.unreadCount);
    });
  }

  markAllRead(): void {
    this.#notificationService.markAllRead().subscribe(() => {
      this.unreadCount.set(0);
      this.notifications.update((prev) => prev.map((n) => ({ ...n, read: true })));
    });
  }

  deleteNotification(id: string, event: Event): void {
    event.stopPropagation();
    this.#notificationService.deleteNotification(id).subscribe(() => {
      this.notifications.update((prev) => prev.filter((item) => item._id !== id));
      this.unreadCount.set(this.notifications().filter((n) => !n.read).length);
    });
  }

  clearAllNotifications(): void {
    this.#notificationService.clearAll().subscribe(() => {
      this.notifications.set([]);
      this.unreadCount.set(0);
    });
  }

  onNotificationClick(notif: Notification): void {
    if (!notif.read) {
      this.#notificationService.markRead(notif._id).subscribe(() => {
        this.notifications.update((prev) =>
          prev.map((item) => (item._id === notif._id ? { ...item, read: true } : item))
        );
        this.unreadCount.update((v) => Math.max(0, v - 1));
      });
    }

    this.showNotifications.set(false);
    if (notif.postId) {
      this.#router.navigate(['/posts', notif.postId]);
    }
  }

  logout(): void {
    this.authService.logout();
    this.closeMenu();
  }
}
