import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { PageWrapperComponent } from '../../../shared/components/page-wrapper/page-wrapper.component';
import { SectionTitleComponent } from '../../../shared/components/section-title/section-title.component';
import { PostService } from '../../../core/services/post.service';
import { AuthService } from '../../../core/services/auth.service';
import { Post, Comment } from '../../../shared/models/post.model';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { getUserId } from '../../../shared/models/user.model';
import { toAbsoluteUrl } from '../../../shared/utils/url.helper';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, ConfirmDialogComponent, PageWrapperComponent, SectionTitleComponent],
  templateUrl: './post-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostDetailComponent implements OnInit {
  private readonly postService = inject(PostService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Parámetro de ruta como input() signal (withComponentInputBinding)
  id = input.required<string>();
  postId = computed(() => this.id());

  currentUser = this.authService.currentUser;

  post = signal<Post | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  // Valoración
  hoverRating = signal(0);
  submitRatingLoading = signal(false);
  ratingError = signal<string | null>(null);

  // Comentarios
  commentText = signal('');
  commentLink = signal('');
  commentImageFile = signal<File | null>(null);
  commentImagePreview = signal<string | null>(null);
  comments = signal<Comment[]>([]);
  commentLoading = signal(false);
  commentError = signal<string | null>(null);
  deleteCommentDialogOpen = signal(false);
  commentToDelete = signal<Comment | null>(null);
  editingCommentId = signal<string | null>(null);
  editCommentText = signal('');
  editCommentLink = signal('');
  editCommentImageFile = signal<File | null>(null);
  editCommentImagePreview = signal<string | null>(null);

  activeImage = signal<string | null>(null);
  isFollowing = signal(false);
  isFullscreen = signal(false);
  readonly toAbsoluteUrl = toAbsoluteUrl;

  isSaved = computed(() => {
    const me = getUserId(this.currentUser());
    if (!me) return false;
    return (this.post()?.savedBy ?? []).includes(me);
  });

  isOwner = computed(() => {
    const currentUser = this.authService.currentUser();
    const postAuthor = this.post()?.userId;
    if (!currentUser || !postAuthor) return false;

    const currentId = String(currentUser._id ?? currentUser.id ?? '');
    const authorId =
      typeof postAuthor === 'object'
        ? String(postAuthor._id ?? postAuthor.id ?? '')
        : String(postAuthor ?? '');

    return currentId !== '' && currentId === authorId;
  });

  authorId = computed(() => {
    const user = this.post()?.userId;
    if (!user) return '';
    if (typeof user === 'object') {
      return String(user._id ?? user.id ?? '');
    }
    return String(user);
  });

  authorUsername = computed(() => {
    const user = this.post()?.userId;
    if (!user || typeof user !== 'object') return 'Artesano';
    return user.username ?? user.name ?? 'Artesano';
  });

  authorAvatar = computed(() => {
    const user = this.post()?.userId;
    if (!user || typeof user !== 'object') return null;
    return user.avatar ?? null;
  });

  authorProfileLink = computed(() => {
    const authorId = this.authorId();
    return authorId ? ['/user', authorId] : ['/user'];
  });

  // Indica si el usuario logueado ya votó
  userRating = computed(() => {
    const user = this.currentUser();
    const ratings = this.post()?.ratings ?? [];
    if (!user) return null;
    const userId = getUserId(user);
    return ratings.find((r) => String(r.userId) === userId) ?? null;
  });

  // Media de valoraciones calculada localmente
  averageRating = computed(() => {
    const ratings = this.post()?.ratings ?? [];
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length;
  });

  isAdmin = this.authService.isAdmin;

  constructor() {
    effect(() => {
      const postData = this.post();
      if (postData?.comments) {
        this.comments.set(postData.comments);
      }

      const images = postData?.imageUrls ?? [];
      const candidate = images[0] ?? postData?.imageUrl ?? null;
      const current = this.activeImage();
      if (!current || (!images.includes(current) && current !== postData?.imageUrl)) {
        this.activeImage.set(candidate);
      }
    });

    effect(() => {
      const me = this.currentUser();
      const author = this.authorId();
      if (!me || !author) {
        this.isFollowing.set(false);
        return;
      }

      const following = (me.following ?? []).map((id) => String(id));
      this.isFollowing.set(following.includes(String(author)));
    });
  }

  ngOnInit(): void {
    this.postService.getPostById(this.id()).subscribe({
      next: (data) => {
        this.post.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Ha ocurrido un error al cargar el post.');
      },
    });
  }

  authorName(userId: Post['userId']): string {
    return typeof userId === 'object' ? (userId.name ?? userId.username ?? 'Artesano') : 'Artesano';
  }

  commentAuthor(userId: Comment['userId']): string {
    return userId.username ?? 'Usuario';
  }

  private commentId(comment: Comment): string {
    return String(comment.id ?? comment._id ?? '');
  }

  private commentUserId(comment: Comment): string {
    return String(comment.userId._id ?? '');
  }

  canDeleteComment(comment: Comment): boolean {
    const me = getUserId(this.currentUser());
    return this.isAdmin() || (me !== '' && me === this.commentUserId(comment));
  }

  /** Genera un array para renderizar estrellas interactivas */
  starsArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  getStarClass(star: number): string {
    const rated = this.userRating()?.value ?? 0;
    const hover = this.hoverRating();
    const active = hover > 0 ? hover : rated;
    return star <= active ? 'star-filled' : 'star-empty';
  }

  ratePost(value: number): void {
    if (!this.currentUser()) return;

    this.submitRatingLoading.set(true);
    this.ratingError.set(null);

    this.postService.ratePost(this.postId(), value).subscribe({
      next: (updated) => {
        this.post.set(updated);
        this.submitRatingLoading.set(false);
      },
      error: (err) => {
        this.submitRatingLoading.set(false);
        this.ratingError.set(err?.error?.message || 'Error al enviar la valoración.');
      },
    });
  }

  submitComment(): void {
    const text = this.commentText().trim();
    if (!text) return;

    this.commentLoading.set(true);
    this.commentError.set(null);

    this.postService
      .addComment(this.postId(), text, this.commentLink(), this.commentImageFile())
      .subscribe({
      next: (res) => {
        this.comments.update((prev) => [
          ...prev,
          {
            ...res.data,
            imageUrl: res.data.imageUrl ?? null,
            link: res.data.link ?? null,
          },
        ]);
        this.commentLoading.set(false);
        this.commentText.set('');
        this.commentLink.set('');
        this.commentImageFile.set(null);
        this.commentImagePreview.set(null);
        this.toast.success('Comentario publicado.');
      },
      error: (err) => {
        this.commentLoading.set(false);
        this.commentError.set(err?.error?.message || 'Error al enviar el comentario.');
      },
    });
  }

  onCommentImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.commentImageFile.set(file);

    if (file) {
      this.commentImagePreview.set(URL.createObjectURL(file));
    } else {
      this.commentImagePreview.set(null);
    }
  }

  askDeleteComment(comment: Comment): void {
    this.commentToDelete.set(comment);
    this.deleteCommentDialogOpen.set(true);
  }

  cancelDeleteComment(): void {
    this.deleteCommentDialogOpen.set(false);
    this.commentToDelete.set(null);
  }

  confirmDeleteComment(): void {
    const comment = this.commentToDelete();
    if (!comment) return;

    const cId = this.commentId(comment);
    this.postService.deleteComment(this.id(), cId).subscribe({
      next: () => {
        this.comments.update((currentComments) =>
          currentComments.filter((item) => this.commentId(item) !== cId)
        );
        this.toast.success('Comentario eliminado.');
        this.cancelDeleteComment();
      },
      error: () => {
        this.toast.error('No se pudo eliminar el comentario.');
        this.cancelDeleteComment();
      },
    });
  }

  toggleSave(): void {
    const id = this.post()?._id;
    if (!id) return;

    this.postService.savePost(id).subscribe({
      next: (res) => {
        const me = getUserId(this.currentUser());
        if (!me) return;

        this.post.update((current) => {
          if (!current) return current;

          const savedBy = current.savedBy ?? [];
          const nextSaved = res.saved
            ? Array.from(new Set([...savedBy, me]))
            : savedBy.filter((uid) => uid !== me);

          return { ...current, savedBy: nextSaved };
        });
      },
    });
  }

  toggleFollow(): void {
    if (!this.authService.currentUser()) return;
    const author = this.authorId();
    if (!author) return;

    this.postService.followUser(author).subscribe({
      next: (res) => {
        this.isFollowing.set(res.following);
        const me = this.currentUser();
        if (!me) return;

        const nextFollowing = res.following
          ? Array.from(new Set([...(me.following ?? []), author]))
          : (me.following ?? []).filter((id) => id !== author);
        this.authService.patchCurrentUser({ following: nextFollowing });
      },
    });
  }

  sharePost(): void {
    const title = this.post()?.title ?? 'ColorForge';
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({ title, url }).catch(() => undefined);
      return;
    }

    navigator.clipboard
      .writeText(url)
      .then(() => this.toast.success('Enlace copiado al portapapeles.'))
      .catch(() => this.toast.error('No se pudo copiar el enlace.'));
  }

  openFullscreen(): void {
    this.isFullscreen.set(true);
  }

  editPost(): void {
    const id = this.post()?._id;
    if (!id) return;
    this.router.navigate(['/posts', id, 'edit']);
  }

  startEditComment(comment: Comment): void {
    this.editingCommentId.set(comment._id);
    this.editCommentText.set(comment.text);
    this.editCommentLink.set(comment.link ?? '');
    this.editCommentImageFile.set(null);
    this.editCommentImagePreview.set(comment.imageUrl ? this.toAbsoluteUrl(comment.imageUrl) : null);
  }

  cancelEditComment(): void {
    this.editingCommentId.set(null);
    this.editCommentText.set('');
    this.editCommentLink.set('');
    this.editCommentImageFile.set(null);
    this.editCommentImagePreview.set(null);
  }

  onEditCommentImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.editCommentImageFile.set(file);

    if (file) {
      this.editCommentImagePreview.set(URL.createObjectURL(file));
    } else {
      this.editCommentImagePreview.set(null);
    }
  }

  saveEditComment(commentId: string, textOverride?: string): void {
    const text = (textOverride ?? this.editCommentText()).trim();
    if (!text) return;

    const formData = new FormData();
    formData.append('text', text);
    if (this.editCommentLink().trim()) {
      formData.append('link', this.editCommentLink().trim());
    }
    if (this.editCommentImageFile()) {
      formData.append('image', this.editCommentImageFile() as File);
    }

    this.postService.editComment(this.postId(), commentId, formData).subscribe({
      next: (res) => {
        this.comments.update((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? {
                  ...c,
                  text: res.data.text,
                  editedAt: res.data.editedAt,
                  link: res.data.link ?? null,
                  imageUrl: res.data.imageUrl ?? c.imageUrl,
                }
              : c
          )
        );
        this.cancelEditComment();
      },
    });
  }

  isCommentOwner(comment: Comment): boolean {
    return comment.userId?._id === this.authService.currentUser()?._id || this.authService.isAdmin();
  }

  goBack(): void {
    this.router.navigate(['/gallery']);
  }
}
