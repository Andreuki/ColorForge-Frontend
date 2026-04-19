import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { getProgressToNextTier, getTierInfo } from '../../utils/forge-tier.helper';

@Component({
  selector: 'app-forge-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-2">
      <span class="text-2xl" [title]="tierName()">{{ tierInfo().icon }}</span>
      <div>
        <p
          class="text-xs font-bold"
          [style.color]="tierInfo().color"
          style="font-family: var(--font-heading); letter-spacing: 0.08em"
        >
          {{ tierInfo().name }}
        </p>
        @if (showScore()) {
          <p class="text-xs text-gray-400">{{ score() }} pts</p>
        }
      </div>
    </div>
    @if (showProgress()) {
      <div class="mt-2">
        <div class="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            [style.width.%]="progress()"
            [style.background-color]="tierInfo().color"
          ></div>
        </div>
        @if (tierInfo().nextMin) {
          <p class="text-xs text-gray-500 mt-1">
            {{ score() }} / {{ tierInfo().nextMin }} pts para el siguiente rango
          </p>
        } @else {
          <p class="text-xs text-gray-500 mt-1">Rango maximo alcanzado.</p>
        }
      </div>
    }
  `,
})
export class ForgeBadgeComponent {
  tierName = input.required<string>();
  score = input<number>(0);
  showScore = input<boolean>(false);
  showProgress = input<boolean>(false);

  tierInfo = computed(() => getTierInfo(this.tierName() || 'Aprendiz de Forja'));
  progress = computed(() =>
    getProgressToNextTier(this.score(), this.tierName() || 'Aprendiz de Forja')
  );
}
