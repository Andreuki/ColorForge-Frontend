import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChallengeService } from '../../core/services/challenge.service';
import { PageWrapperComponent } from '../../shared/components/page-wrapper/page-wrapper.component';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { toAbsoluteUrl } from '../../shared/utils/url.helper';

@Component({
  selector: 'app-challenge-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, PageWrapperComponent, SectionTitleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './challenge-detail.component.html',
})
export class ChallengeDetailComponent {
  #challengeService = inject(ChallengeService);

  id = input.required<string>();
  readonly toAbsoluteUrl = toAbsoluteUrl;

  challenge = signal<any>(null);
  posts = signal<any[]>([]);

  constructor() {
    queueMicrotask(() => {
      const challengeId = this.id();
      this.#challengeService.getById(challengeId).subscribe((res) => this.challenge.set(res.data));
      this.#challengeService
        .getChallengePosts(challengeId)
        .subscribe((res) => this.posts.set(res.data ?? []));
    });
  }
}
