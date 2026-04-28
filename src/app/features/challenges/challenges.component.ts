import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChallengeService } from '../../core/services/challenge.service';
import { ForgeLoaderComponent } from '../../shared/components/forge-loader/forge-loader.component';
import { PageWrapperComponent } from '../../shared/components/page-wrapper/page-wrapper.component';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { toAbsoluteUrl } from '../../shared/utils/url.helper';

type ChallengeTab = 'active' | 'past';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [DatePipe, ForgeLoaderComponent, RouterLink, PageWrapperComponent, SectionTitleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './challenges.component.html',
})
export class ChallengesComponent {
  #challengeService = inject(ChallengeService);

  readonly toAbsoluteUrl = toAbsoluteUrl;

  activeTab = signal<ChallengeTab>('active');
  challenges = signal<any[]>([]);
  private readonly loadingState = signal(true);
  readonly loading = computed(() => this.loadingState());

  constructor() {
    this.loadChallenges('active');
  }

  setTab(tab: ChallengeTab): void {
    this.activeTab.set(tab);
    this.loadChallenges(tab);
  }

  private loadChallenges(status: ChallengeTab): void {
    this.loadingState.set(true);
    this.#challengeService.getAll(status).subscribe({
      next: (res) => {
        this.challenges.set(res.data ?? []);
        this.loadingState.set(false);
      },
      error: () => {
        this.challenges.set([]);
        this.loadingState.set(false);
      },
    });
  }
}
