import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PostService } from '../../../core/services/post.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChallengeService } from '../../../core/services/challenge.service';
import { Post } from '../../../shared/models/post.model';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ForgeLoaderComponent } from '../../../shared/components/forge-loader/forge-loader.component';
import { getUserId } from '../../../shared/models/user.model';
import { toAbsoluteUrl } from '../../../shared/utils/url.helper';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [DatePipe, RouterLink, ConfirmDialogComponent, ForgeLoaderComponent],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostListComponent implements OnInit {
  private readonly postService = inject(PostService);
  private readonly challengeService = inject(ChallengeService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  private readonly placeholderImages = [
    'assets/placeholders/placeholder-1.svg',
    'assets/placeholders/placeholder-2.svg',
    'assets/placeholders/placeholder-3.svg',
  ];

  posts = signal<Post[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  deleteDialogOpen = signal(false);
  postToDelete = signal<Post | null>(null);
  searchTerm = signal('');
  sortBy = signal<'recent' | 'top'>('recent');
  showSaved = signal(false);
  activeChallenge = signal<any>(null);
  readonly toAbsoluteUrl = toAbsoluteUrl;

  currentUser = this.authService.currentUser;

  filteredPosts = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const me = String(this.currentUser()?._id ?? this.currentUser()?.id ?? '');

    let items = [...this.posts()];

    if (query) {
      items = items.filter((post) => {
        const author = this.authorName(post.userId).toLowerCase();
        const title = (post.title ?? '').toLowerCase();
        const description = (post.description ?? '').toLowerCase();
        const techniques = (post.techniques ?? []).join(' ').toLowerCase();
        return (
          author.includes(query) ||
          title.includes(query) ||
          description.includes(query) ||
          techniques.includes(query)
        );
      });
    }

    if (this.showSaved() && me) {
      items = items.filter((post) => (post.savedBy ?? []).includes(me));
    }

    if (this.sortBy() === 'top') {
      items.sort((a, b) => this.ratingValue(b) - this.ratingValue(a));
    } else {
      items.sort((a, b) => {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return db - da;
      });
    }

    return items;
  });

  ngOnInit(): void {
    this.challengeService.getPublic().subscribe({
      next: (res) => this.activeChallenge.set((res.data ?? [])[0] ?? null),
      error: () => this.activeChallenge.set(null),
    });

    this.postService.getAllPosts().subscribe({
      next: (data) => {
        this.posts.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Ha ocurrido un error al cargar la galería.');
      },
    });
  }

  postId(post: Post): string {
    return String(post.id ?? post._id ?? '');
  }

  userIdOf(entity: Post['userId']): string {
    if (typeof entity === 'object') {
      return String(entity.id ?? entity._id ?? '');
    }
    return String(entity);
  }

  authorProfileId(userId: Post['userId']): string {
    return this.userIdOf(userId);
  }

  ratingValue(post: Post): number {
    const directRating = Number(post.averageRating ?? 0);
    if (Number.isFinite(directRating) && directRating > 0) {
      return directRating;
    }

    const ratings = post.ratings ?? [];
    if (ratings.length === 0) return 0;

    const total = ratings.reduce((sum, rating) => sum + Number(rating.value ?? 0), 0);
    const average = total / ratings.length;
    return Number.isFinite(average) ? average : 0;
  }

  canDelete(post: Post): boolean {
    const me = getUserId(this.currentUser());
    return me !== '' && me === this.userIdOf(post.userId);
  }

  goToDetail(id: string): void {
    this.router.navigate(['/posts', id]);
  }

  imageUrl(post: Post, index: number): string {
    const primary = post.imageUrls?.[0] ?? post.imageUrl;
    const url = primary;
    if (!url) {
      return this.placeholderImages[index % this.placeholderImages.length];
    }
    return toAbsoluteUrl(url);
  }

  onImageError(event: Event, index: number): void {
    const img = event.target as HTMLImageElement;
    img.src = this.placeholderImages[index % this.placeholderImages.length];
  }

  /** Obtiene el username del autor */
  authorName(userId: Post['userId']): string {
    return typeof userId === 'object' ? (userId.name ?? userId.username ?? 'CFUSER') : 'CFUSER';
  }

  /** Genera un array de 5 elements para renderizar estrellas */
  starsArray(avg: number | string | undefined): boolean[] {
    const val = Number(avg ?? 0);
    const normalized = Number.isFinite(val) ? val : 0;
    return Array.from({ length: 5 }, (_, i) => i < Math.round(normalized));
  }

  askDelete(post: Post, event: Event): void {
    event.stopPropagation();
    this.postToDelete.set(post);
    this.deleteDialogOpen.set(true);
  }

  cancelDelete(): void {
    this.deleteDialogOpen.set(false);
    this.postToDelete.set(null);
  }

  confirmDelete(): void {
    const post = this.postToDelete();
    if (!post) return;

    const id = this.postId(post);
    this.postService.deletePost(id).subscribe({
      next: () => {
        this.posts.update((list) => list.filter((item) => this.postId(item) !== id));
        this.toast.success('Post eliminado de la galeria.');
        this.cancelDelete();
      },
      error: () => {
        this.toast.error('No se pudo eliminar el post.');
        this.cancelDelete();
      },
    });
  }
}
