import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfileService } from '../../../users/services/profile.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileEditComponent {
  #router = inject(Router);
  #fb = inject(FormBuilder);
  #profileService = inject(ProfileService);
  #authService = inject(AuthService);
  #toast = inject(ToastService);
  #destroyRef = inject(DestroyRef);

  view = input<string | undefined>(undefined, { alias: 'view' });
  activeSection = computed(() => (this.view() === 'password' ? 'password' : 'profile'));

  profileResource = this.#profileService.getProfileResource(computed(() => undefined));
  user = computed(() => this.profileResource.value()?.user);
  showDeleteConfirm = signal(false);
  deleting = signal(false);

  profileForm = this.#fb.group({
    nameUser: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
  });

  passwordForm = this.#fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', [Validators.required, Validators.minLength(8)]],
    },
    {
      validators: (group) => {
        const p1 = group.get('password')?.value;
        const p2 = group.get('passwordConfirm')?.value;
        return p1 === p2 ? null : { samePassword: true };
      },
    }
  );

  constructor() {
    effect(() => {
      const u = this.user();
      if (u) {
        untracked(() => {
          this.profileForm.patchValue({
            nameUser: u.name ?? u.username ?? '',
            email: u.email,
          });
        });
      }
    });
  }

  saveProfile(event: Event): void {
    event.preventDefault();
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const { nameUser, email } = this.profileForm.getRawValue();
    this.#profileService
      .saveProfile(nameUser ?? '', email ?? '')
      .pipe(switchMap(() => this.#authService.refreshUser()))
      .subscribe({
      next: () => {
        this.#toast.success('Perfil actualizado.');
        this.#router.navigate(['/profile']);
      },
      error: () => this.#toast.error('No se pudo guardar el perfil.'),
      });
  }

  savePassword(event: Event): void {
    event.preventDefault();
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { password } = this.passwordForm.getRawValue();
    this.#profileService.savePassword(password ?? '').subscribe({
      next: () => {
        this.#toast.success('Contrasena actualizada.');
        this.#router.navigate(['/profile']);
      },
      error: () => this.#toast.error('No se pudo actualizar la contrasena.'),
    });
  }

  confirmDeleteAccount(): void {
    this.showDeleteConfirm.set(true);
  }

  cancelDeleteAccount(): void {
    if (this.deleting()) return;
    this.showDeleteConfirm.set(false);
  }

  deleteAccount(): void {
    this.deleting.set(true);
    this.#profileService
      .deleteMyAccount()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: () => {
          this.#authService.logout();
          this.#router.navigate(['/login']);
        },
        error: () => {
          this.deleting.set(false);
          this.#toast.error('No se pudo eliminar la cuenta.');
        },
      });
  }
}
