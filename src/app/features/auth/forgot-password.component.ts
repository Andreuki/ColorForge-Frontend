import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PageWrapperComponent } from '../../shared/components/page-wrapper/page-wrapper.component';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, PageWrapperComponent, SectionTitleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-wrapper>
      <section class="mx-auto max-w-md px-6 py-10">
        <app-section-title title="Recuperar Cuenta" subtitle="Te enviaremos un enlace de acceso seguro" />
        <div class="bg-cf-surface2 border border-gold-subtle rounded-sm p-6 md:p-8">
          <input
            type="email"
            placeholder="tu@email.com"
            [value]="email()"
            (input)="email.set($any($event.target).value)"
            class="bg-cf-surface border border-gold-subtle rounded-sm text-cf-parchment font-body text-base px-4 py-2.5 w-full placeholder:text-cf-parchment-muted focus:outline-none focus:border-cf-gold focus:ring-2 focus:ring-[rgba(200,146,42,0.1)] transition-all duration-200"
          />

          <button
            (click)="submit()"
            [disabled]="loading() || sent()"
            class="mt-4 w-full bg-gradient-to-br from-cf-gold to-cf-gold-dim text-cf-black font-heading text-[0.75rem] tracking-widest-cf uppercase px-6 py-3 rounded-sm shadow-gold-md hover:-translate-y-0.5 hover:shadow-gold-lg active:scale-95 transition-all duration-200 disabled:opacity-60"
          >
            {{ sent() ? 'Email enviado' : loading() ? 'Enviando...' : 'Enviar enlace' }}
          </button>

          @if (sent()) {
            <p class="font-body italic text-cf-parchment-dim text-sm mt-4 text-center">Revisa tu bandeja de entrada.</p>
          }

          @if (error()) {
            <p class="text-cf-crimson-light text-sm mt-4 text-center">{{ error() }}</p>
          }

          <a routerLink="/login" class="block text-center font-ui text-[0.72rem] uppercase tracking-wide-cf text-cf-parchment-dim mt-4 hover:text-cf-gold">
            Volver al login
          </a>
        </div>
      </section>
    </app-page-wrapper>
  `,
})
export class ForgotPasswordComponent {
  #http = inject(HttpClient);

  email = signal('');
  loading = signal(false);
  sent = signal(false);
  error = signal<string | null>(null);

  submit(): void {
    const email = this.email().trim();
    if (!email) {
      this.error.set('Introduce un email valido.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.#http
      .post(`${environment.apiUrl}/api/auth/forgot-password`, { email })
      .subscribe({
        next: () => {
          this.sent.set(true);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? 'No se pudo enviar el enlace.');
        },
      });
  }
}
