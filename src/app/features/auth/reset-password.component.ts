import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PageWrapperComponent } from '../../shared/components/page-wrapper/page-wrapper.component';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterLink, PageWrapperComponent, SectionTitleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-wrapper>
      <section class="mx-auto max-w-md px-6 py-10">
        <app-section-title title="Restablecer Contrasena" subtitle="Define una nueva clave para tu cuenta" />
        <div class="bg-cf-surface2 border border-gold-subtle rounded-sm p-6 md:p-8">
          <input
            type="password"
            placeholder="Nueva contrasena"
            [value]="password()"
            (input)="password.set($any($event.target).value)"
            class="bg-cf-surface border border-gold-subtle rounded-sm text-cf-parchment font-body text-base px-4 py-2.5 w-full placeholder:text-cf-parchment-muted focus:outline-none focus:border-cf-gold focus:ring-2 focus:ring-[rgba(200,146,42,0.1)] transition-all duration-200 mb-3"
          />

          <input
            type="password"
            placeholder="Repite la contrasena"
            [value]="confirmPassword()"
            (input)="confirmPassword.set($any($event.target).value)"
            class="bg-cf-surface border border-gold-subtle rounded-sm text-cf-parchment font-body text-base px-4 py-2.5 w-full placeholder:text-cf-parchment-muted focus:outline-none focus:border-cf-gold focus:ring-2 focus:ring-[rgba(200,146,42,0.1)] transition-all duration-200 mb-4"
          />

          @if (validationError()) {
            <p class="text-cf-crimson-light text-sm mb-4">{{ validationError() }}</p>
          }

          <button
            (click)="submit()"
            [disabled]="loading() || success()"
            class="w-full bg-gradient-to-br from-cf-gold to-cf-gold-dim text-cf-black font-heading text-[0.75rem] tracking-widest-cf uppercase px-6 py-3 rounded-sm shadow-gold-md hover:-translate-y-0.5 hover:shadow-gold-lg active:scale-95 transition-all duration-200 disabled:opacity-60"
          >
            {{ success() ? 'Contrasena actualizada' : loading() ? 'Actualizando...' : 'Guardar nueva contrasena' }}
          </button>

          @if (error()) {
            <p class="text-cf-crimson-light text-sm mt-4 text-center">{{ error() }}</p>
          }

          @if (success()) {
            <p class="font-body italic text-cf-parchment-dim text-sm mt-4 text-center">
              Contrasena actualizada. Redirigiendo al login...
            </p>
          }

          <a routerLink="/login" class="block text-center font-ui text-[0.72rem] uppercase tracking-wide-cf text-cf-parchment-dim mt-4 hover:text-cf-gold">
            Volver al login
          </a>
        </div>
      </section>
    </app-page-wrapper>
  `,
})
export class ResetPasswordComponent {
  #http = inject(HttpClient);
  #route = inject(ActivatedRoute);
  #router = inject(Router);

  password = signal('');
  confirmPassword = signal('');
  loading = signal(false);
  success = signal(false);
  error = signal<string | null>(null);

  token = computed(() => this.#route.snapshot.queryParamMap.get('token') ?? '');

  validationError = computed(() => {
    if (!this.token()) return 'Token invalido o ausente.';
    if (!this.password()) return 'La contrasena es obligatoria.';
    if (this.password().length < 8) return 'Minimo 8 caracteres.';
    if (this.password() !== this.confirmPassword()) return 'Las contrasenas no coinciden.';
    return null;
  });

  submit(): void {
    if (this.validationError()) {
      this.error.set(this.validationError());
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.#http
      .post(`${environment.apiUrl}/api/auth/reset-password`, {
        token: this.token(),
        password: this.password(),
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.success.set(true);
          setTimeout(() => this.#router.navigate(['/login']), 1200);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? 'No se pudo restablecer la contrasena.');
        },
      });
  }
}
