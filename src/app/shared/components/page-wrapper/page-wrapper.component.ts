import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-page-wrapper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="relative min-h-screen bg-cf-black text-cf-parchment font-body">
      <div
        class="fixed inset-0 pointer-events-none z-0 opacity-30"
        style="background-image: url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E&quot;)"
      ></div>
      <div class="relative z-10">
        <ng-content></ng-content>
      </div>
    </section>
  `,
})
export class PageWrapperComponent {}
