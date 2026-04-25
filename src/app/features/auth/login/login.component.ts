import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { PageWrapperComponent } from '../../../shared/components/page-wrapper/page-wrapper.component';
import { SectionTitleComponent } from '../../../shared/components/section-title/section-title.component';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, PageWrapperComponent, SectionTitleComponent],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  model = signal({
    email: '',
    password: '',
  });

  touched = signal({
    email: false,
    password: false,
  });

  loading = signal(false);
  googleLoading = signal(false);
  googleReady = signal(false);
  errorMessage = signal<string | null>(null);

  emailError = computed(() => {
    const email = this.model().email.trim();
    if (!email) return 'El email es obligatorio.';
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return validEmail ? null : 'Introduce un email valido.';
  });

  passwordError = computed(() => {
    const password = this.model().password;
    if (!password) return 'La contrasena es obligatoria.';
    return null;
  });

  formInvalid = computed(() => !!this.emailError() || !!this.passwordError());

  onEmailInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.model.update((state) => ({ ...state, email: input.value }));
  }

  onPasswordInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.model.update((state) => ({ ...state, password: input.value }));
  }

  touchField(field: 'email' | 'password'): void {
    this.touched.update((state) => ({ ...state, [field]: true }));
  }

  touchAll(): void {
    this.touched.set({ email: true, password: true });
  }

  onSubmit(): void {
    this.touchAll();
    if (this.formInvalid()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.model();

    this.authService.login(email.trim(), password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/gallery']);
      },
      error: (err) => {
        this.loading.set(false);
        // Muestra el mensaje del servidor si existe, o uno genérico
        const msg =
          err?.error?.message ||
          (err.status === 401 ? 'Credenciales incorrectas' : 'Ha ocurrido un error, inténtalo de nuevo');
        this.errorMessage.set(msg);
      },
    });
  }

  ngOnInit(): void {
    this.setupGoogleLogin();
  }

  private async setupGoogleLogin(): Promise<void> {
    if (!environment.googleClientId) return;

    try {
      await this.loadGoogleScript();
      const googleId = window.google?.accounts?.id;
      const container = document.getElementById('google-login-button');
      if (!googleId || !container) return;

      googleId.initialize({
        client_id: environment.googleClientId,
        callback: ({ credential }) => this.onGoogleCredential(credential),
      });

      container.innerHTML = '';
      googleId.renderButton(container, {
        type: 'standard',
        shape: 'pill',
        theme: 'filled_black',
        text: 'continue_with',
        size: 'large',
      });
      this.googleReady.set(true);
    } catch {
      this.googleReady.set(false);
    }
  }

  private onGoogleCredential(credential: string): void {
    if (!credential) return;
    this.googleLoading.set(true);
    this.errorMessage.set(null);

    this.authService.loginWithGoogle(credential).subscribe({
      next: () => {
        this.googleLoading.set(false);
        this.router.navigate(['/gallery']);
      },
      error: (err) => {
        this.googleLoading.set(false);
        const msg = err?.error?.message || 'No se pudo iniciar sesión con Google.';
        this.errorMessage.set(msg);
      },
    });
  }

  triggerGooglePrompt(): void {
    window.google?.accounts?.id?.prompt();
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      const existing = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      ) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('gsi-load-error')), {
          once: true,
        });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('gsi-load-error'));
      document.head.appendChild(script);
    });
  }
}
