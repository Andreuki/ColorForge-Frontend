import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
export class PaintInventoryComponent {
  #paintService = inject(PaintService);

  activeTab = signal<'catalog' | 'inventory'>('inventory');
  catalog = signal<any[]>([]);
  inventory = signal<any[]>([]);

  search = signal('');
  brandFilter = signal('');
  typeFilter = signal('');
  colorFamilyFilter = signal('');

  ownedIds = computed(() =>
    new Set(this.inventory().map((p) => String(p.paintId?._id ?? p.paintId ?? '')))
  );

  constructor() {
    this.loadInventory();
    this.loadCatalog();
  }

  loadInventory(): void {
    this.#paintService.getMyInventory().subscribe((res) => this.inventory.set(res.data ?? []));
  }

  loadCatalog(): void {
    this.#paintService
      .getCatalog({
        search: this.search(),
        brand: this.brandFilter(),
        type: this.typeFilter(),
        colorFamily: this.colorFamilyFilter(),
      })
      .subscribe((res) => this.catalog.set(res.data ?? []));
  }

  togglePaint(paint: any): void {
    const id = String(paint._id);
    if (this.ownedIds().has(id)) {
      this.inventory.update((list) =>
        list.filter((p) => String(p.paintId?._id ?? p.paintId ?? '') !== id)
      );
      this.#paintService.removeFromInventory(id).subscribe();
    } else {
      this.inventory.update((list) => [...list, { paintId: paint, status: 'Full' }]);
      this.#paintService.addToInventory(id).subscribe();
    }
  }

  hasPaint(paint: any): boolean {
    return this.ownedIds().has(String(paint?._id ?? ''));
  }

  updateStatus(paintId: string, status: 'Full' | 'Low' | 'Empty'): void {
    this.inventory.update((list) =>
      list.map((p) =>
        String(p.paintId?._id ?? p.paintId ?? '') === String(paintId) ? { ...p, status } : p
      )
    );
    this.#paintService.updateStatus(paintId, status).subscribe();
  }
}
