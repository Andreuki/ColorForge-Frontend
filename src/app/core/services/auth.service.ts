import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { User, AuthResponse } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly currentUserSignal = signal<User | null>(null);

  // Compatibilidad con componentes que usan Observable
  currentUser$ = toObservable(this.currentUserSignal);
  currentUser = this.currentUserSignal.asReadonly();
  isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');

  constructor() {
    if (this.isLoggedIn()) {
      this.getMe().subscribe({
        next: (user) => this.currentUserSignal.set(user),
        error: () => this.logout(),
      });
    }
  }

  register(username: string, email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/api/auth/register`, { username, email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem('token', res.data.token);
          this.currentUserSignal.set(res.data.user);
        }),
        map((res) => res.data.user)
      );
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/api/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem('token', res.data.token);
          this.currentUserSignal.set(res.data.user);
        }),
        map((res) => res.data.user)
      );
  }

  loginWithGoogle(idToken: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/api/auth/google`, { idToken })
      .pipe(
        tap((res) => {
          localStorage.setItem('token', res.data.token);
          this.currentUserSignal.set(res.data.user);
        }),
        map((res) => res.data.user)
      );
  }

  getMe(): Observable<User> {
    return this.http
      .get<{ success: boolean; data: User }>(`${environment.apiUrl}/api/auth/me`)
      .pipe(map((res) => res.data));
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser() {
    return this.currentUser;
  }

  setCurrentUser(user: User | null): void {
    this.currentUserSignal.set(user);
  }

  patchCurrentUser(partial: Partial<User>): void {
    const current = this.currentUserSignal();
    if (current) {
      this.currentUserSignal.set({ ...current, ...partial });
    }
  }

  refreshUser(): Observable<User> {
    return this.getMe().pipe(
      tap((user) => this.currentUserSignal.set(user))
    );
  }
}
