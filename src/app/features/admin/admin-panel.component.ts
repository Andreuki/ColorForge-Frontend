import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from '../../core/services/admin.service';
import { ChallengeService } from '../../core/services/challenge.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageWrapperComponent } from '../../shared/components/page-wrapper/page-wrapper.component';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { toAbsoluteUrl, onAvatarError } from '../../shared/utils/url.helper';

type AdminTab = 'stats' | 'users' | 'posts' | 'analyses' | 'challenges';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, ConfirmDialogComponent, PageWrapperComponent, SectionTitleComponent],
  templateUrl: './admin-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPanelComponent {
  #adminService = inject(AdminService);
  #challengeService = inject(ChallengeService);
  #destroyRef = inject(DestroyRef);

  readonly toAbsoluteUrl = toAbsoluteUrl;
  readonly onAvatarError = onAvatarError;

  activeTab = signal<AdminTab>('stats');
  readonly tabs: ReadonlyArray<{ id: AdminTab; label: string }> = [
    { id: 'stats', label: 'Estadísticas' },
    { id: 'users', label: 'Usuarios' },
    { id: 'posts', label: 'Publicaciones' },
    { id: 'analyses', label: 'Análisis' },
    { id: 'challenges', label: 'Retos' },
  ];

  // Stats
  stats = signal<any | null>(null);
  statsLoading = signal(false);
  statsError = signal(false);

  // Users
  users = signal<any[]>([]);
  usersTotal = signal(0);
  usersPage = signal(1);
  userSearch = signal('');
  userRoleFilter = signal('');
  userBlockedFilter = signal('');

  // Posts
  posts = signal<any[]>([]);
  postsTotal = signal(0);
  postsPage = signal(1);
  postSearch = signal('');
  postPrivacyFilter = signal('');
  postFactionFilter = signal('');

  // Analyses
  analyses = signal<any[]>([]);
  analysesTotal = signal(0);
  analysesPage = signal(1);
  analysisSearch = signal('');
  analysisFactionFilter = signal('');

  // Challenges
  challenges = signal<any[]>([]);

  // UI
  loading = signal(false);
  confirmDeleteId = signal<string | null>(null);
  confirmDeleteType = signal<'post' | 'analysis' | 'challenge' | null>(null);
  confirmDeleteExtra = signal<string | null>(null); // para commentId
  private searchTimer: any;

  constructor() {
    this.loadUsers();
    this.loadPosts();
    this.loadAnalyses();
    this.loadChallenges();

    effect(() => {
      if (this.activeTab() === 'stats' && !this.stats() && !this.statsLoading()) {
        this.loadStats();
      }
    });
  }

  setActiveTab(tab: AdminTab): void {
    this.activeTab.set(tab);
    if (tab === 'stats' && !this.stats() && !this.statsLoading()) {
      this.loadStats();
    }
  }

  loadStats(): void {
    this.statsLoading.set(true);
    this.statsError.set(false);
    this.#adminService
      .getStats()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (data) => {
          this.stats.set(data);
          this.statsLoading.set(false);
        },
        error: (err) => {
          console.error('Error cargando estadísticas:', err);
          this.statsLoading.set(false);
          this.statsError.set(true);
        },
      });
  }

  loadUsers(page = 1): void {
    this.loading.set(true);
    this.#adminService
      .getUsers(page, 20, {
        search: this.userSearch(),
        role: this.userRoleFilter(),
        isBlocked: this.userBlockedFilter(),
      })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((res) => {
        this.users.set(res.users);
        this.usersTotal.set(res.total);
        this.usersPage.set(page);
        this.loading.set(false);
      });
  }

  loadPosts(page = 1): void {
    this.#adminService
      .getAllPosts(page, 20, {
        search: this.postSearch(),
        privacy: this.postPrivacyFilter(),
        faction: this.postFactionFilter(),
      })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((res) => {
        this.posts.set(res.data);
        this.postsTotal.set(res.total);
        this.postsPage.set(page);
      });
  }

  loadAnalyses(page = 1): void {
    this.#adminService
      .getAllAnalyses(page, 20, {
        search: this.analysisSearch(),
        faction: this.analysisFactionFilter(),
      })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((res) => {
        this.analyses.set(res.data);
        this.analysesTotal.set(res.total);
        this.analysesPage.set(page);
      });
  }

  onFilterChange(type: 'users' | 'posts' | 'analyses'): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      if (type === 'users') this.loadUsers(1);
      if (type === 'posts') this.loadPosts(1);
      if (type === 'analyses') this.loadAnalyses(1);
    }, 400);
  }

  loadChallenges(): void {
    this.#challengeService
      .getAll()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((res) => this.challenges.set(res.data ?? []));
  }

  deleteChallenge(id: string): void {
    this.#challengeService
      .delete(id)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(() => {
        this.challenges.update((list) => list.filter((c) => c._id !== id));
      });
  }

  toggleBlock(user: any): void {
    this.#adminService
      .blockUser(user._id, !user.isBlocked)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(() => {
        this.users.update((list) =>
          list.map((u) => (u._id === user._id ? { ...u, isBlocked: !u.isBlocked } : u))
        );
      });
  }

  toggleRole(user: any): void {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    this.#adminService
      .updateUser(user._id, { role: newRole })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(() => {
        this.users.update((list) =>
          list.map((u) => (u._id === user._id ? { ...u, role: newRole } : u))
        );
      });
  }

  confirmDelete(id: string, type: 'post' | 'analysis' | 'challenge', extra?: string): void {
    this.confirmDeleteId.set(id);
    this.confirmDeleteType.set(type);
    this.confirmDeleteExtra.set(extra ?? null);
  }

  cancelDelete(): void {
    this.confirmDeleteId.set(null);
    this.confirmDeleteType.set(null);
    this.confirmDeleteExtra.set(null);
  }

  executeDelete(): void {
    const id = this.confirmDeleteId();
    const type = this.confirmDeleteType();
    if (!id || !type) return;

    const request$ =
      type === 'post'
        ? this.#adminService.deletePost(id)
        : type === 'analysis'
          ? this.#adminService.deleteAnalysis(id)
          : this.#challengeService.delete(id);

    request$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
      if (type === 'post') {
        this.posts.update((list) => list.filter((p) => p._id !== id));
        this.postsTotal.update((t) => t - 1);
      } else if (type === 'analysis') {
        this.analyses.update((list) => list.filter((a) => a._id !== id));
        this.analysesTotal.update((t) => t - 1);
      } else {
        this.challenges.update((list) => list.filter((challenge) => challenge._id !== id));
      }
      this.cancelDelete();
    });
  }

  itemId(item: any): string {
    return String(item?._id ?? item?.id ?? '');
  }

  itemTitle(item: any): string {
    return String(item?.title ?? item?.name ?? item?.description ?? 'Sin título');
  }

  itemAuthor(item: any): string {
    const author = item?.userId ?? item?.user ?? item?.author ?? item?.createdBy;
    if (!author) return 'CFUSER';
    if (typeof author === 'object') {
      return author.username ?? author.name ?? 'CFUSER';
    }
    return 'CFUSER';
  }

  itemImage(item: any): string {
    const image = item?.imageUrls?.[0] ?? item?.imageUrl ?? item?.coverImage ?? null;
    return image ? toAbsoluteUrl(image) : 'assets/placeholders/placeholder-1.svg';
  }

  itemRating(item: any): number {
    const direct = Number(item?.averageRating ?? item?.ratingAverage ?? 0);
    if (Number.isFinite(direct) && direct > 0) {
      return direct;
    }

    const ratings = Array.isArray(item?.ratings) ? item.ratings : [];
    if (ratings.length === 0) return 0;

    const total = ratings.reduce((sum: number, rating: any) => sum + Number(rating?.value ?? 0), 0);
    const average = total / ratings.length;
    return Number.isFinite(average) ? average : 0;
  }

  confirmDeleteMessage(): string {
    const title = this.itemTitle(
      this.confirmDeleteType() === 'post'
        ? this.posts().find((post) => this.itemId(post) === this.confirmDeleteId())
        : this.confirmDeleteType() === 'analysis'
          ? this.analyses().find((analysis) => this.itemId(analysis) === this.confirmDeleteId())
          : this.challenges().find((challenge) => this.itemId(challenge) === this.confirmDeleteId())
    );

    if (this.confirmDeleteType() === 'challenge') {
      return `Esta acción eliminará el reto ${title}.`;
    }

    return `Esta acción eliminará ${title} de forma permanente.`;
  }
}