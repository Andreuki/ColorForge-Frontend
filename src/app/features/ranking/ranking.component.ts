import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ChallengeService } from '../../core/services/challenge.service';
import { ForgeBadgeComponent } from '../../shared/components/forge-badge/forge-badge.component';
import { PageWrapperComponent } from '../../shared/components/page-wrapper/page-wrapper.component';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { toAbsoluteUrl, onAvatarError } from '../../shared/utils/url.helper';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [DatePipe, ForgeBadgeComponent, RouterLink, PageWrapperComponent, SectionTitleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ranking.component.html',
})
export class RankingComponent {
  #http = inject(HttpClient);
  #challengeService = inject(ChallengeService);
  readonly toAbsoluteUrl = toAbsoluteUrl;
  readonly onAvatarError = onAvatarError;

  users = signal<any[]>([]);
  activeChallenge = signal<any>(null);
  challengePosts = signal<any[]>([]);

  ngOnInit(): void {
    this.#http
      .get<{ data: any[] }>(`${environment.apiUrl}/api/users/ranking`)
      .subscribe((res) => this.users.set(res.data));

    this.#challengeService.getActive().subscribe({
      next: (res) => {
        const challenge = res?.data ?? null;
        this.activeChallenge.set(challenge);

        if (!challenge?._id) {
          this.challengePosts.set([]);
          return;
        }

        this.#challengeService.getChallengePosts(challenge._id).subscribe({
          next: (postsRes) => {
            this.challengePosts.set(postsRes?.data ?? []);
          },
          error: () => {
            this.challengePosts.set([]);
          },
        });
      },
      error: () => {
        this.activeChallenge.set(null);
        this.challengePosts.set([]);
      },
    });
  }
}
