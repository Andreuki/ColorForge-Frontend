import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-section-title',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="text-center pt-14 pb-10">
      <div class="flex items-center justify-center gap-4 mb-4">
        <div class="h-px w-24 bg-gradient-to-r from-transparent to-cf-gold-dim"></div>
        <span class="text-cf-gold text-xs">◆</span>
        <div class="h-px w-24 bg-gradient-to-l from-transparent to-cf-gold-dim"></div>
      </div>
      <h1
        class="font-display text-4xl md:text-5xl tracking-widest-cf bg-gradient-to-r from-cf-gold-dim via-cf-gold-light to-cf-gold bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer"
      >
        {{ title() }}
      </h1>
      @if (subtitle()) {
        <p class="font-body italic text-cf-parchment-dim text-lg mt-3">
          {{ subtitle() }}
        </p>
      }
    </div>
  `,
})
export class SectionTitleComponent {
  title = input.required<string>();
  subtitle = input<string>('');
}
