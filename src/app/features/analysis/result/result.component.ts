import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  input,
  OnInit,
  effect,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { PageWrapperComponent } from '../../../shared/components/page-wrapper/page-wrapper.component';
import { SectionTitleComponent } from '../../../shared/components/section-title/section-title.component';
import { AnalysisService } from '../../../core/services/analysis.service';
import { PostService } from '../../../core/services/post.service';
import { Analysis } from '../../../shared/models/analysis.model';
import { toAbsoluteUrl } from '../../../shared/utils/url.helper';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, NgClass, PageWrapperComponent, SectionTitleComponent],
  templateUrl: './result.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultComponent implements OnInit {
  private readonly analysisService = inject(AnalysisService);
  private readonly postService = inject(PostService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Recibe el parámetro de ruta como input() signal gracias a withComponentInputBinding()
  id = input.required<string>();

  // Estado del análisis
  analysis = signal<Analysis | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  // Tabs activa (identificación, esquema, imprimación, guía, técnicas, tips, materiales)
  activeTab = signal<
    'identification' | 'scheme' | 'primer' | 'guide' | 'advanced' | 'tips' | 'materials'
  >('identification');

  // Pasos del acordeón — almacena qué índices están abiertos
  openSteps = signal<Set<number>>(new Set());

  // Modal de publicación
  showModal = signal(false);
  publishLoading = signal(false);
  publishError = signal<string | null>(null);
  publishSuccess = signal(false);
  factionImageUrl = signal<string | null>(null);

  publishForm = this.fb.group({
    description: ['', [Validators.required, Validators.minLength(5)]],
  });

  imageUrlFull = computed(() => {
    return toAbsoluteUrl(this.analysis()?.imageUrl);
  });

  allPaints = computed(() => {
    const analysis = this.analysis();
    if (!analysis) return [];

    const fromSteps = (analysis.stepByStepGuide ?? []).map((step) => ({
      zone: step.zone,
      paintingStage: step.technique,
      citadel: step.citadelPaint,
      vallejo: step.vallejoPaint,
      ak: step.akPaint,
      armyPainter: step.armyPainterPaint,
      hex: step.colorHex,
    }));

    const seen = new Set<string>();
    return fromSteps.filter((paint) => {
      if (!paint.citadel) return false;
      const key = paint.citadel.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

  constructor() {
    effect(() => {
      const faction = this.analysis()?.miniatureIdentification?.detectedFaction;
      if (faction) {
        this.loadFactionImage(faction);
      } else {
        this.factionImageUrl.set(null);
      }
    });
  }

  ngOnInit(): void {
    this.analysisService
      .getAnalysisById(this.id())
      .subscribe({
      next: (data) => {
        this.analysis.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err?.error?.message || 'Ha ocurrido un error al cargar el análisis.'
        );
      },
      });
  }

  setTab(
    tab: 'identification' | 'scheme' | 'primer' | 'guide' | 'advanced' | 'tips' | 'materials'
  ): void {
    this.activeTab.set(tab);
  }

  toggleStep(index: number): void {
    this.openSteps.update((set) => {
      const next = new Set(set);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  isStepOpen(index: number): boolean {
    return this.openSteps().has(index);
  }

  /** Badge de color según la confianza de identificación */
  confidenceBadgeClass(confidence: string): string {
    const lower = confidence?.toLowerCase() ?? '';
    if (lower.includes('alta') || lower.includes('high')) return 'badge-success';
    if (lower.includes('media') || lower.includes('medium')) return 'badge-warning';
    return 'badge-error';
  }

  /** Badge de dificultad */
  difficultyClass(difficulty: string): string {
    switch (difficulty) {
      case 'Principiante': return 'badge-success';
      case 'Intermedio':   return 'badge-warning';
      case 'Avanzado':     return 'badge-error';
      default:             return 'badge-neutral';
    }
  }

  openModal(): void {
    this.showModal.set(true);
    this.publishError.set(null);
    this.publishSuccess.set(false);
    this.publishForm.reset();
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  publish(): void {
    if (this.publishForm.invalid) {
      this.publishForm.markAllAsTouched();
      return;
    }

    const analysis = this.analysis();
    if (!analysis) return;

    this.publishLoading.set(true);
    this.publishError.set(null);

    const description = this.publishForm.value.description!;
    const title =
      analysis.title?.trim() ||
      analysis.miniatureIdentification?.specificUnit?.trim() ||
      analysis.miniatureIdentification?.detectedFaction?.trim() ||
      'Miniatura analizada';
    const faction = analysis.miniatureIdentification?.detectedFaction?.trim() ?? '';

    const fallbackTechniques = (analysis.stepByStepGuide ?? [])
      .map((step) => step.technique?.trim())
      .filter((value): value is string => !!value);
    const techniques = Array.from(
      new Set((analysis.recommendedTechniques?.length ? analysis.recommendedTechniques : fallbackTechniques)
        .map((item) => item.trim())
        .filter(Boolean))
    );

    const colors = Array.from(new Set((analysis.detectedColors ?? []).map((item) => item.trim()).filter(Boolean)));

    const payload = new FormData();
    payload.append('title', title);
    payload.append('description', description.trim());
    payload.append('techniques', JSON.stringify(techniques));
    payload.append('colors', JSON.stringify(colors));
    payload.append('privacy', 'public');
    payload.append('faction', faction);
    payload.append('imageUrl', analysis.imageUrl);
    if (analysis._id) {
      payload.append('analysisId', analysis._id);
    }

    this.postService.createPost(payload).subscribe({
      next: () => {
        this.publishLoading.set(false);
        this.publishSuccess.set(true);
        setTimeout(() => {
          this.closeModal();
          this.router.navigate(['/gallery']);
        }, 1500);
      },
      error: (err) => {
        this.publishLoading.set(false);
        this.publishError.set(err?.error?.message || 'Error al publicar, inténtalo de nuevo.');
      },
    });
  }

  /** Construye la URL de búsqueda en YouTube */
  youtubeUrl(query: string): string {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }

  loadFactionImage(factionName: string): void {
    const normalizedFaction = factionName.split('(')[0].trim();

    if (!normalizedFaction || normalizedFaction === 'No identificada con certeza') {
      this.factionImageUrl.set(null);
      return;
    }

    const encodedFaction = encodeURIComponent(normalizedFaction);
    const wikipediaUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedFaction}`;

    fetch(wikipediaUrl)
      .then((response) => {
        if (!response.ok) {
          this.factionImageUrl.set(null);
          return null;
        }
        return response.json();
      })
      .then((data: { thumbnail?: { source?: string } } | null) => {
        if (data?.thumbnail?.source) {
          this.factionImageUrl.set(data.thumbnail.source);
        } else {
          this.factionImageUrl.set(null);
        }
      })
      .catch(() => {
        this.factionImageUrl.set(null);
      });
  }
}
