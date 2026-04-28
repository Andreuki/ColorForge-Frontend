import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild, input } from '@angular/core';
import { DotLottie } from '@lottiefiles/dotlottie-web';

@Component({
  selector: 'app-forge-loader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center py-16 gap-4">
      <canvas #lottieCanvas width="120" height="120"></canvas>
      <p class="font-ui text-[0.72rem] uppercase tracking-widest-cf text-cf-parchment-muted">
        {{ message() }}
      </p>
    </div>
  `,
})
export class ForgeLoaderComponent implements OnInit, OnDestroy {
  @ViewChild('lottieCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  message = input<string>('Forjando contenido...');

  private dotLottie?: DotLottie;

  ngOnInit(): void {
    this.dotLottie = new DotLottie({
      canvas: this.canvasRef.nativeElement,
      src: 'assets/lottie/forge-loading.json',
      loop: true,
      autoplay: true,
      renderConfig: { autoResize: true },
    });
  }

  ngOnDestroy(): void {
    this.dotLottie?.destroy();
  }
}
