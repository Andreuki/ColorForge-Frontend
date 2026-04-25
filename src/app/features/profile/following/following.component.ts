import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../users/services/profile.service';
import { User, getUserId } from '../../../shared/models/user.model';
import { ToastService } from '../../../shared/services/toast.service';
import { toAbsoluteUrl } from '../../../shared/utils/url.helper';

@Component({
  selector: 'app-following',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './following.component.html',
  styleUrl: './following.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowingComponent implements OnInit {
  #auth = inject(AuthService);
  #profileService = inject(ProfileService);
  #toast = inject(ToastService);

  id = input.required<string>();
  following = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  unfollowingIds = new Set<string>();
  readonly toAbsoluteUrl = toAbsoluteUrl;

  readonly isOwnProfile = computed(() => {
    const routeId = this.id();
    if (routeId === undefined) return true;
    const me = getUserId(this.#auth.currentUser());
    return me !== '' && String(routeId) === me;
  });

  ngOnInit(): void {
    this.#profileService.getFollowing(this.id()).subscribe({
      next: (data) => {
        this.following.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de seguidos.');
        this.loading.set(false);
      },
    });
  }

  unfollowUser(userId: string): void {
    if (this.unfollowingIds.has(userId)) return;

    this.unfollowingIds.add(userId);
    this.#profileService.unfollowUser(userId).subscribe({
      next: () => {
        this.following.update((list) => list.filter((user) => user._id !== userId));
        this.unfollowingIds.delete(userId);
      },
      error: (err) => {
        console.error('Error al dejar de seguir:', err);
        this.unfollowingIds.delete(userId);
        this.#toast.error('No se pudo dejar de seguir al usuario.');
      },
    });
  }
}
