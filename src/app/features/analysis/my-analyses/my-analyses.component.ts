import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AnalysisService } from '../../../core/services/analysis.service';
import { AuthService } from '../../../core/services/auth.service';
import { Analysis } from '../../../shared/models/analysis.model';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageWrapperComponent } from '../../../shared/components/page-wrapper/page-wrapper.component';
import { SectionTitleComponent } from '../../../shared/components/section-title/section-title.component';
import { getUserId } from '../../../shared/models/user.model';
import { toAbsoluteUrl } from '../../../shared/utils/url.helper';

@Component({
  selector: 'app-my-analyses',
  standalone: true,
  imports: [DatePipe, RouterLink, ConfirmDialogComponent, PageWrapperComponent, SectionTitleComponent],
  templateUrl: './my-analyses.component.html',
})
export class MyAnalysesComponent implements OnInit {
  private readonly analysisService = inject(AnalysisService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  analyses = signal<Analysis[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  deleteDialogOpen = signal(false);
  deleteTarget = signal<Analysis | null>(null);

  coachDialogOpen = signal(false);
  coachTargetPostId = signal<string | null>(null);
  coachImageFile = signal<File | null>(null);
  coachImagePreview = signal<string | null>(null);
  coachFeedback = signal<string | null>(null);
  coachLoading = signal(false);
  coachError = signal<string | null>(null);

  editingAnalysisId = signal<string | null>(null);
  editingTitle = signal('');

  hasData = computed(() => this.analyses().length > 0);
  currentUser = this.authService.currentUser;

  ngOnInit(): void {
    this.analysisService.getMyAnalyses().subscribe({
      next: (data) => {
        this.analyses.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'No se pudieron cargar tus análisis.');
      },
    });
  }

  imageUrl(url: string, index: number): string {
    if (!url) {
      return `assets/placeholders/placeholder-${(index % 3) + 1}.svg`;
    }
    return toAbsoluteUrl(url);
  }

  openAnalysis(analysisId: string): void {
    this.router.navigate(['/result', analysisId]);
  }

  analysisId(analysis: Analysis): string {
    return String(analysis.id ?? analysis._id ?? '');
  }

  canManage(analysis: Analysis): boolean {
    const currentId = getUserId(this.currentUser());
    return currentId !== '' && currentId === String(analysis.userId);
  }

  openDeleteDialog(analysis: Analysis, event: Event): void {
    event.stopPropagation();
    this.deleteTarget.set(analysis);
    this.deleteDialogOpen.set(true);
  }

  cancelDelete(): void {
    this.deleteDialogOpen.set(false);
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;

    this.analysisService.deleteAnalysis(this.analysisId(target)).subscribe({
      next: () => {
        const targetId = this.analysisId(target);
        this.analyses.update((list) => list.filter((item) => this.analysisId(item) !== targetId));
        this.toast.success('Analisis eliminado.');
        this.cancelDelete();
      },
      error: () => {
        this.toast.error('No se pudo eliminar el analisis.');
        this.cancelDelete();
      },
    });
  }

  defaultTitle(analysis: Analysis, index: number): string {
    const title = analysis.title?.trim();
    return title && title.length > 0 ? title : `Analisis #${index + 1}`;
  }

  startTitleEdit(analysis: Analysis, index: number, event: Event): void {
    event.stopPropagation();
    const id = this.analysisId(analysis);
    this.editingAnalysisId.set(id);
    this.editingTitle.set(this.defaultTitle(analysis, index));
  }

  onTitleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingTitle.set(input.value);
  }

  saveTitle(analysis: Analysis, index: number, event?: Event): void {
    event?.stopPropagation();

    const newTitle = this.editingTitle().trim();
    if (newTitle.length < 3 || newTitle.length > 80) {
      this.toast.error('El titulo debe tener entre 3 y 80 caracteres.');
      return;
    }

    const id = this.analysisId(analysis);
    this.analysisService.updateAnalysisTitle(id, newTitle).subscribe({
      next: () => {
        this.analyses.update((list) =>
          list.map((item) => (this.analysisId(item) === id ? { ...item, title: newTitle } : item))
        );
        this.editingAnalysisId.set(null);
        this.toast.success('Titulo actualizado.');
      },
      error: () => this.toast.error('No se pudo actualizar el titulo.'),
    });
  }

  cancelTitleEdit(event: Event): void {
    event.stopPropagation();
    this.editingAnalysisId.set(null);
  }

  openCoachDialog(analysis: Analysis, event: Event): void {
    event.stopPropagation();
    this.coachTargetPostId.set(this.resolveCoachPostId(analysis));
    this.coachImageFile.set(null);
    this.coachImagePreview.set(null);
    this.coachFeedback.set(null);
    this.coachError.set(null);
    this.coachDialogOpen.set(true);
  }

  closeCoachDialog(): void {
    this.coachDialogOpen.set(false);
    this.coachLoading.set(false);
    this.coachTargetPostId.set(null);
  }

  onCoachImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.coachImageFile.set(file);
    this.coachError.set(null);

    if (file) {
      this.coachImagePreview.set(URL.createObjectURL(file));
    } else {
      this.coachImagePreview.set(null);
    }
  }

  requestCoachFeedback(): void {
    const postId = this.coachTargetPostId();
    const image = this.coachImageFile();
    if (!postId && !image) {
      this.coachError.set('Sube una imagen para pedir consejo sin publicacion vinculada.');
      return;
    }

    this.coachLoading.set(true);
    this.coachFeedback.set(null);
    this.coachError.set(null);

    this.analysisService
      .requestCoachFeedback({ postId: postId ?? undefined, image: image ?? undefined })
      .subscribe({
        next: (res) => {
          this.coachFeedback.set(res.feedback);
          this.coachLoading.set(false);
        },
        error: (err) => {
          this.coachError.set(err?.error?.message ?? 'No se pudo generar feedback ahora mismo.');
          this.coachLoading.set(false);
        },
      });
  }

  private resolveCoachPostId(analysis: Analysis): string | null {
    const raw = (analysis as any).postId ?? (analysis as any).post?._id ?? (analysis as any).post?.id;
    if (raw === undefined || raw === null || String(raw).trim() === '') return null;
    return String(raw);
  }
}
