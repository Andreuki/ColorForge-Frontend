import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { PaintService } from '../../core/services/paint.service';
import { PageWrapperComponent } from '../../shared/components/page-wrapper/page-wrapper.component';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';

@Component({
  selector: 'app-paint-inventory',
  standalone: true,
  imports: [FormsModule, PageWrapperComponent, SectionTitleComponent],
  templateUrl: './paint-inventory.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaintInventoryComponent implements OnInit {
  #http = inject(HttpClient);
  #paintService = inject(PaintService);

  activeTab: 'catalog' | 'inventory' = 'inventory';
  userPaints: any[] = [];

  // Catálogo estático
  catalog: any[] = [];
  catalogLoaded = false;

  // Búsqueda en catálogo
  searchTerm = '';
  selectedBrand = '';
  showDropdown = false;
  filteredResults: any[] = [];

  // Formulario de pintura custom
  showCustomForm = false;
  customPaint = { name: '', brand: '', hexColor: '#000000', notes: '' };

  // Estado de operaciones
  addingPaint = false;
  deletingIds = new Set<string>();

  ngOnInit(): void {
    this.#http.get<any>('assets/data/paints-catalog.json').subscribe({
      next: (data) => {
        this.catalog = data?.brands ?? [];
        this.catalogLoaded = true;
      },
      error: () => {
        this.catalog = [];
        this.catalogLoaded = false;
      },
    });

    this.loadUserPaints();
  }

  loadUserPaints(): void {
    this.#paintService.getUserPaints().subscribe({
      next: (paints: any) => {
        this.userPaints = Array.isArray(paints) ? paints : (paints?.data ?? []);
      },
      error: (err) => console.error('Error cargando maletín:', err),
    });
  }

  onSearchInput(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (term.length < 2) {
      this.filteredResults = [];
      this.showDropdown = false;
      return;
    }

    const results: any[] = [];
    for (const brand of this.catalog) {
      if (this.selectedBrand && brand.name !== this.selectedBrand) continue;
      for (const paint of brand.paints ?? []) {
        if (String(paint.name ?? '').toLowerCase().includes(term)) {
          results.push({ ...paint, brandName: brand.name });
        }
      }
    }

    this.filteredResults = results.slice(0, 15);
    this.showDropdown = this.filteredResults.length > 0 || term.length >= 2;
  }

  addFromCatalog(paint: any): void {
    this.addingPaint = true;
    this.#paintService
      .addPaint({
        name: paint.name,
        brand: paint.brandName,
        hexColor: paint.hex,
        line: paint.line,
        isCustom: false,
      })
      .subscribe({
        next: (newPaint) => {
          this.userPaints = [...this.userPaints, newPaint];
          this.searchTerm = '';
          this.filteredResults = [];
          this.showDropdown = false;
          this.addingPaint = false;
        },
        error: (err) => {
          console.error('Error añadiendo pintura:', err);
          this.addingPaint = false;
        },
      });
  }

  addCustomPaint(): void {
    if (!this.customPaint.name || !this.customPaint.brand || !this.customPaint.hexColor) return;

    this.addingPaint = true;
    this.#paintService
      .addPaint({
        ...this.customPaint,
        isCustom: true,
      })
      .subscribe({
        next: (newPaint) => {
          this.userPaints = [...this.userPaints, newPaint];
          this.customPaint = { name: '', brand: '', hexColor: '#000000', notes: '' };
          this.showCustomForm = false;
          this.addingPaint = false;
        },
        error: (err) => {
          console.error('Error añadiendo pintura custom:', err);
          this.addingPaint = false;
        },
      });
  }

  deletePaint(paintId: string, paintName: string): void {
    if (!confirm(`¿Eliminar "${paintName}" de tu maletín?`)) return;

    this.deletingIds.add(paintId);
    this.#paintService.deletePaint(paintId).subscribe({
      next: () => {
        this.userPaints = this.userPaints.filter((paint) => this.paintId(paint) !== paintId);
        this.deletingIds.delete(paintId);
      },
      error: (err) => {
        console.error('Error eliminando pintura:', err);
        this.deletingIds.delete(paintId);
      },
    });
  }

  paintId(paint: any): string {
    return String(paint?._id ?? paint?.paintId?._id ?? paint?.paintId ?? '');
  }

  paintName(paint: any): string {
    return String(paint?.name ?? paint?.paintId?.name ?? 'Sin nombre');
  }

  paintBrand(paint: any): string {
    return String(paint?.brand ?? paint?.paintId?.brand ?? 'Marca desconocida');
  }

  paintHexColor(paint: any): string {
    return String(paint?.hexColor ?? paint?.paintId?.hexColor ?? paint?.paintId?.hex ?? '#888888');
  }
}
