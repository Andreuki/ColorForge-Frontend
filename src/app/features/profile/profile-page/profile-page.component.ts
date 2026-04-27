import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, resource, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PageWrapperComponent } from '../../../shared/components/page-wrapper/page-wrapper.component';
import { SectionTitleComponent } from '../../../shared/components/section-title/section-title.component';
import { AuthService } from '../../../core/services/auth.service';
import { PostService } from '../../../core/services/post.service';
import { Post } from '../../../shared/models/post.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ForgeBadgeComponent } from '../../../shared/components/forge-badge/forge-badge.component';
import { getUserDisplayName, getUserId } from '../../../shared/models/user.model';
import { ToastService } from '../../../shared/services/toast.service';
import { ProfileService } from '../../../users/services/profile.service';
import { toAbsoluteUrl, onAvatarError } from '../../../shared/utils/url.helper';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [RouterLink, DecimalPipe, ConfirmDialogComponent, ForgeBadgeComponent, PageWrapperComponent, SectionTitleComponent],
  templateUrl: './profile-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit {
  #auth = inject(AuthService);
  #postService = inject(PostService);
  #router = inject(Router);
  #profileService = inject(ProfileService);
  #toast = inject(ToastService);

  id = input<number | string | undefined>(undefined);
  profileId = computed(() => {
    const routeId = this.id();
    if (routeId !== undefined && routeId !== null && routeId !== '') {
      return routeId;
    }
    // Para perfil propio: usar el _id del usuario autenticado como request.
    // Esto evita que el resource Angular 19 entre en estado "idle".
    return getUserId(this.#auth.currentUser()) || undefined;
  });
  profileResource = this.#profileService.getProfileResource(this.profileId);
  user = computed(() => {
    if (this.id()) {
      return this.profileResource.value()?.user ?? undefined;
    }
    return this.profileResource.value()?.user ?? this.#auth.currentUser();
  });

  previewAvatarUrl = signal<string | null>(null);
  isFollowing = signal(false);
  followLoading = signal(false);
  followersDisplayCount = signal(0);

  // Resource dedicado para contar seguidores y siguiendo en tiempo real.
  // No depende de user() para evitar datos desactualizados.
  #countsResource = resource({
    request: () => ({ userId: this.profileUserId() }),
    loader: async ({ request }) => {
      if (!request.userId) return { followersCount: 0, followingCount: 0 };
      const [followers, following] = await Promise.all([
        firstValueFrom(this.#profileService.getFollowers(request.userId)),
        firstValueFrom(this.#profileService.getFollowing(request.userId)),
      ]);
      return {
        followersCount: followers.length,
        followingCount: following.length,
      };
    },
  });

  isMyProfile = computed(() => {
    const routeId = this.profileId();
    if (routeId === undefined) return true;
    const me = getUserId(this.#auth.currentUser());
    return me !== '' && String(routeId) === me;
  });

  readonly displayName = computed(() => getUserDisplayName(this.user()));
  readonly userEmail = computed(() => this.user()?.email ?? '');
  readonly onAvatarError = onAvatarError;
  readonly resolvedAvatar = computed(() => {
    const preview = this.previewAvatarUrl();
    if (preview) return preview;
    return toAbsoluteUrl(this.user()?.avatar);
  });

  readonly analysesLink = computed(() => {
    const idFromProfile = this.profileId();
    const fallback = getUserId(this.user());
    return idFromProfile ?? fallback;
  });

  readonly resolvedFollowersCount = computed(() => {
    // Prioridad: valor del resource dedicado (fresco de API).
    // Fallback: followersDisplayCount para las actualizaciones optimistas de toggleFollow.
    const fromApi = this.#countsResource.value()?.followersCount;
    if (fromApi !== undefined) return fromApi;
    return this.followersDisplayCount();
  });

  readonly resolvedFollowingCount = computed(() => {
    const fromApi = this.#countsResource.value()?.followingCount;
    if (fromApi !== undefined) return fromApi;
    return this.user()?.following?.length ?? 0;
  });

  readonly forgeTier = computed(() => {
    const tier = (this.user() as any)?.forgeTier;
    return typeof tier === 'string' && tier.trim() ? tier : 'Aprendiz de Forja';
  });

  readonly forgeScore = computed(() => {
    const score = Number((this.user() as any)?.forgeScore ?? 0);
    return Number.isFinite(score) ? score : 0;
  });

  readonly badges = computed<string[]>(() => {
    const list = (this.user() as any)?.badges;
    return Array.isArray(list) ? list : [];
  });

  readonly profileUserId = computed(() => {
    const idFromProfile = this.profileId();
    if (idFromProfile !== undefined && idFromProfile !== null) return String(idFromProfile);
    return getUserId(this.user());
  });

  userPostsResource = resource({
    request: () => ({ userId: this.profileUserId() }),
    loader: async ({ request }) => {
      if (!request.userId) return [] as Post[];

      const response = await firstValueFrom(this.#postService.getUserPosts(request.userId));
      return response.data ?? [];
    },
  });

  userPosts = computed(() => this.userPostsResource.value() ?? []);
  userPostsState = signal<Post[]>([]);
  deleteDialogOpen = signal(false);
  postToDelete = signal<Post | null>(null);

  constructor() {
    effect((onCleanup) => {
      const url = this.previewAvatarUrl();
      if (!url) return;
      onCleanup(() => URL.revokeObjectURL(url));
    });

    effect(() => {
      this.userPostsState.set(this.userPosts());
    });

    effect(() => {
      const profile = this.user() as any;
      const fromCount = Number(profile?.followersCount);
      if (Number.isFinite(fromCount)) {
        this.followersDisplayCount.set(fromCount);
        return;
      }

      if (Array.isArray(profile?.followers)) {
        this.followersDisplayCount.set(profile.followers.length);
        return;
      }

      this.followersDisplayCount.set(0);
    });

    effect(() => {
      if (this.isMyProfile()) {
        this.isFollowing.set(false);
        return;
      }

      const profile = this.user() as any;
      if (typeof profile?.isFollowing === 'boolean') {
        this.isFollowing.set(profile.isFollowing);
        return;
      }

      const me = this.#auth.currentUser();
      const targetId = this.profileUserId();
      const following = (me?.following ?? []).map((id) => String(id));
      this.isFollowing.set(!!targetId && following.includes(String(targetId)));
    });
  }

  ngOnInit(): void {}

  openEdit(view: 'profile' | 'password'): void {
    this.#router.navigate(['/profile/edit'], { queryParams: { view } });
  }

  triggerAvatarInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onAvatarSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.#toast.error('Selecciona una imagen valida.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    this.previewAvatarUrl.set(previewUrl);

    this.#profileService.uploadAvatar(file).subscribe({
      next: (response) => {
        this.#auth.patchCurrentUser({ avatar: response.avatarUrl });
        this.profileResource.reload();
        this.#toast.success('Avatar actualizado.');
      },
      error: () => {
        untracked(() => this.previewAvatarUrl.set(null));
        this.#toast.error('No se pudo subir el avatar.');
      },
    });
  }

  avgRating(post: Post): number {
    if (!post.ratings?.length) return 0;
    return post.ratings.reduce((sum, r) => sum + r.value, 0) / post.ratings.length;
  }

  postPreviewImage(post: Post): string {
    const firstImage = post.imageUrls[0] || post.imageUrl;
    return this.toAbsoluteUrl(firstImage);
  }

  askDeletePost(post: Post, event: Event): void {
    event.stopPropagation();
    this.postToDelete.set(post);
    this.deleteDialogOpen.set(true);
  }

  cancelDeletePost(): void {
    this.deleteDialogOpen.set(false);
    this.postToDelete.set(null);
  }

  confirmDeletePost(): void {
    const post = this.postToDelete();
    if (!post?._id) return;

    this.#postService.deletePost(post._id).subscribe({
      next: () => {
        this.userPostsState.update((list) => list.filter((item) => item._id !== post._id));
        this.#toast.success('Publicación eliminada.');
        this.cancelDeletePost();
      },
      error: () => {
        this.#toast.error('No se pudo eliminar la publicación.');
        this.cancelDeletePost();
      },
    });
  }

  canDeletePost(post: Post): boolean {
    const me = getUserId(this.#auth.currentUser());
    const owner =
      typeof post.userId === 'object' ? String(post.userId._id ?? post.userId.id ?? '') : String(post.userId);
    return me !== '' && me === owner;
  }

  toggleFollow(): void {
    if (this.isMyProfile() || this.followLoading()) return;

    const targetId = this.profileUserId();
    if (!targetId) return;

    this.followLoading.set(true);

    const onSuccess = () => {
      const nextFollowing = !this.isFollowing();
      this.isFollowing.set(nextFollowing);
      this.followersDisplayCount.update((count) => Math.max(0, count + (nextFollowing ? 1 : -1)));

      const me = this.#auth.currentUser();
      if (me) {
        const current = (me.following ?? []).map((id) => String(id));
        const updated = nextFollowing
          ? Array.from(new Set([...current, String(targetId)]))
          : current.filter((id) => id !== String(targetId));
        this.#auth.patchCurrentUser({ following: updated });
      }

      this.#countsResource.reload();
      this.followLoading.set(false);
    };

    const onError = (err: unknown) => {
      console.error('Error al seguir/dejar de seguir:', err);
      this.followLoading.set(false);
    };

    if (this.isFollowing()) {
      this.#profileService.unfollowUser(targetId).subscribe({
        next: onSuccess,
        error: onError,
      });
      return;
    }

    this.#postService.followUser(targetId).subscribe({
      next: onSuccess,
      error: onError,
    });
  }

  readonly toAbsoluteUrl = toAbsoluteUrl;
}
