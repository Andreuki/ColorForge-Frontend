import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PageWrapperComponent } from '../../../shared/components/page-wrapper/page-wrapper.component';
import { SectionTitleComponent } from '../../../shared/components/section-title/section-title.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, PageWrapperComponent, SectionTitleComponent],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  model = signal({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  touched = signal({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  usernameError = computed(() => {
    const username = this.model().username.trim();
    if (!username) return 'El nombre de usuario es obligatorio.';
    return username.length >= 3 ? null : 'Minimo 3 caracteres.';
  });

  emailError = computed(() => {
    const email = this.model().email.trim();
    if (!email) return 'El email es obligatorio.';
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return validEmail ? null : 'Introduce un email valido.';
  });

  passwordError = computed(() => {
    const password = this.model().password;
    if (!password) return 'La contrasena es obligatoria.';
    return password.length >= 8 ? null : 'Minimo 8 caracteres.';
  });

  confirmPasswordError = computed(() => {
    const confirm = this.model().confirmPassword;
    if (!confirm) return 'Debes confirmar la contrasena.';
    return null;
  });

  passwordMismatch = computed(() => {
    const { password, confirmPassword } = this.model();
    if (!password || !confirmPassword) return false;
    return password !== confirmPassword;
  });

  formInvalid = computed(
    () =>
      !!this.usernameError() ||
      !!this.emailError() ||
      !!this.passwordError() ||
      !!this.confirmPasswordError() ||
      this.passwordMismatch()
  );

  onInput(field: 'username' | 'email' | 'password' | 'confirmPassword', event: Event): void {
    const input = event.target as HTMLInputElement;
    this.model.update((state) => ({ ...state, [field]: input.value }));
  }

  touchField(field: 'username' | 'email' | 'password' | 'confirmPassword'): void {
    this.touched.update((state) => ({ ...state, [field]: true }));
  }

  touchAll(): void {
    this.touched.set({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
  }

  onSubmit(): void {
    this.touchAll();
    if (this.formInvalid()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { username, email, password } = this.model();

    this.authService.register(username.trim(), email.trim(), password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/gallery']);
      },
      error: (err) => {
        this.loading.set(false);
        const msg =
          err?.error?.message || 'Ha ocurrido un error, inténtalo de nuevo';
        this.errorMessage.set(msg);
      },
    });
  }
}
