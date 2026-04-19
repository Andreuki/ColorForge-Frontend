import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { PageWrapperComponent } from '../../../shared/components/page-wrapper/page-wrapper.component';
import { SectionTitleComponent } from '../../../shared/components/section-title/section-title.component';
import { PostService } from '../../../core/services/post.service';
import { ChallengeService } from '../../../core/services/challenge.service';
import { toAbsoluteUrl } from '../../../shared/utils/url.helper';

@Component({
  selector: 'app-post-create',
  standalone: true,
  imports: [RouterLink, PageWrapperComponent, SectionTitleComponent],
  templateUrl: './post-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCreateComponent implements OnInit {
  #postService = inject(PostService);
  #challengeService = inject(ChallengeService);
  #router = inject(Router);

  id = input<string | undefined>(undefined);

  selectedImages = signal<File[]>([]);
  imagePreviewUrls = signal<string[]>([]);
  techniques = signal<string[]>([]);
  colors = signal<string[]>([]);
  privacy = signal<'public' | 'followers' | 'private'>('public');
  joinChallenge = signal(false);
  activeChallenge = signal<any>(null);

  title = signal('');
  description = signal('');
  faction = signal('');
  techniqueInput = signal('');
  colorInput = signal('#C8922A');
  loading = signal(false);
  error = signal<string | null>(null);

  isEditMode = computed(() => !!this.id());
  readonly toAbsoluteUrl = toAbsoluteUrl;

  ngOnInit(): void {
    this.#challengeService.getActive().subscribe({
      next: (res) => this.activeChallenge.set(res.data ?? null),
    });

    const postId = this.id();
    if (!postId) return;

    this.#postService.getPostById(postId).subscribe({
      next: (post) => {
        this.title.set(post.title ?? '');
        this.description.set(post.description ?? '');
        this.faction.set(post.faction ?? '');
        this.techniques.set(post.techniques ?? []);
        this.colors.set(post.colors ?? []);
        this.privacy.set(post.privacy ?? 'public');
        this.imagePreviewUrls.set((post.imageUrls ?? []).map((url) => this.toAbsoluteUrl(url)));
      },
    });
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).slice(0, 10);
    this.selectedImages.set(files);
    this.imagePreviewUrls.set(files.map((file) => URL.createObjectURL(file)));
  }

  addTechnique(): void {
    const value = this.techniqueInput().trim();
    if (!value) return;
    this.techniques.update((list) => (list.includes(value) ? list : [...list, value]));
    this.techniqueInput.set('');
  }

  removeTechnique(value: string): void {
    this.techniques.update((list) => list.filter((item) => item !== value));
  }

  addColor(value?: string): void {
    const color = (value ?? this.colorInput()).trim();
    if (!color) return;
    this.colors.update((list) => (list.includes(color) ? list : [...list, color]));
  }

  removeColor(value: string): void {
    this.colors.update((list) => list.filter((item) => item !== value));
  }

  submitPost(): void {
    if (!this.title().trim()) {
      this.error.set('El título es obligatorio.');
      return;
    }

    if (this.title().length > 120) {
      this.error.set('El título no puede superar 120 caracteres.');
      return;
    }

    const formData = new FormData();
    this.selectedImages().forEach((file) => formData.append('images', file));
    formData.append('title', this.title().trim());
    formData.append('description', this.description().trim());
    formData.append('techniques', JSON.stringify(this.techniques()));
    formData.append('colors', JSON.stringify(this.colors()));
    formData.append('privacy', this.privacy());
    formData.append('faction', this.faction().trim());
    if (this.joinChallenge() && this.activeChallenge()) {
      formData.append('challengeId', this.activeChallenge()._id);
    }

    this.loading.set(true);
    this.error.set(null);

    const postId = this.id();
    const request$: Observable<{ data?: { _id?: string }; post?: { _id?: string } }> = postId
      ? this.#postService.updatePost(postId, formData)
      : this.#postService.createPost(formData) as Observable<{ data?: { _id?: string }; post?: { _id?: string } }>;

    request$.subscribe({
      next: (response: { data?: { _id?: string }; post?: { _id?: string } }) => {
        this.loading.set(false);
        if (postId) {
          const updatedId = response?.data?._id ?? response?.post?._id ?? postId;
          this.#router.navigate(['/posts', updatedId], {
            queryParams: { _t: Date.now() },
          });
          return;
        }
        this.#router.navigate(['/gallery']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo guardar la publicación.');
      },
    });
  }
}
