import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ForgeBadgeComponent } from '../../shared/components/forge-badge/forge-badge.component';
import { PageWrapperComponent } from '../../shared/components/page-wrapper/page-wrapper.component';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { toAbsoluteUrl } from '../../shared/utils/url.helper';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [ForgeBadgeComponent, RouterLink, PageWrapperComponent, SectionTitleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ranking.component.html',
})
export class RankingComponent {
  #http = inject(HttpClient);
  readonly toAbsoluteUrl = toAbsoluteUrl;

  users = signal<any[]>([]);

  constructor() {
    this.#http
      .get<{ data: any[] }>(`${environment.apiUrl}/api/users/ranking`)
      .subscribe((res) => this.users.set(res.data));
  }
}
