import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly store = signal<ToastMessage[]>([]);

  toasts = this.store.asReadonly();

  show(text: string, type: ToastType = 'info', duration = 3000): void {
    const toast: ToastMessage = { id: this.nextId++, type, text };
    this.store.update((list) => [...list, toast]);

    window.setTimeout(() => {
      this.dismiss(toast.id);
    }, duration);
  }

  success(text: string): void {
    this.show(text, 'success');
  }

  error(text: string): void {
    this.show(text, 'error', 4200);
  }

  info(text: string): void {
    this.show(text, 'info');
  }

  dismiss(id: number): void {
    this.store.update((list) => list.filter((t) => t.id !== id));
  }
}
