import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfileService } from '../../../users/services/profile.service';
import { User } from '../../../shared/models/user.model';
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
  #profileService = inject(ProfileService);

  id = input.required<string>();
  following = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  readonly toAbsoluteUrl = toAbsoluteUrl;

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
}
