import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AnalysisService } from '../../../core/services/analysis.service';
import { PageWrapperComponent } from '../../../shared/components/page-wrapper/page-wrapper.component';
import { SectionTitleComponent } from '../../../shared/components/section-title/section-title.component';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [PageWrapperComponent, SectionTitleComponent],
  templateUrl: './upload.component.html',
})
export class UploadComponent {
  private readonly analysisService = inject(AnalysisService);
  private readonly router = inject(Router);

  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  isDragOver = signal(false);

  // Gestión del drag & drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
  }

  private processFile(file: File): void {
    this.errorMessage.set(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.errorMessage.set('Solo se aceptan imágenes JPEG, PNG o WebP.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      this.errorMessage.set('La imagen no puede superar los 5 MB.');
      return;
    }

    this.selectedFile.set(file);

    // Generamos la URL de preview con FileReader
    const reader = new FileReader();
    reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  clearSelection(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.errorMessage.set(null);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.analysisService.uploadAnalysis(file).subscribe({
      next: (analysis) => {
        this.loading.set(false);
        this.router.navigate(['/result', analysis._id]);
      },
      error: (err) => {
        this.loading.set(false);
        const msg =
          err?.error?.message || 'Ha ocurrido un error al analizar la imagen, inténtalo de nuevo.';
        this.errorMessage.set(msg);
      },
    });
  }
}
