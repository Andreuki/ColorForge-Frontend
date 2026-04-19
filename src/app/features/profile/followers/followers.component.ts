import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfileService } from '../../../users/services/profile.service';
import { User } from '../../../shared/models/user.model';
import { toAbsoluteUrl } from '../../../shared/utils/url.helper';

@Component({
  selector: 'app-followers',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './followers.component.html',
  styleUrl: './followers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowersComponent implements OnInit {
  #profileService = inject(ProfileService);

  id = input.required<string>();
  followers = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  readonly toAbsoluteUrl = toAbsoluteUrl;

  ngOnInit(): void {
    this.#profileService.getFollowers(this.id()).subscribe({
      next: (data) => {
        this.followers.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar seguidores.');
        this.loading.set(false);
      },
    });
  }
}
