import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id:       string;
    type:     ToastType;
    message:  string;
    duration: number;
}

const DEFAULT_DURATION: Record<ToastType, number> = {
    success: 3000,
    error:   6000,
    warning: 4500,
    info:    4000,
};

@Injectable({ providedIn: 'root' })
export class ToastService {

    private _toasts = signal<Toast[]>([]);
    readonly toasts = this._toasts.asReadonly();

    show(type: ToastType, message: string, duration?: number) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const ms = duration ?? DEFAULT_DURATION[type];

        this._toasts.update(list => [...list, { id, type, message, duration: ms }]);

        if (ms > 0) {
            setTimeout(() => this.dismiss(id), ms);
        }
    }

    success(message: string, duration?: number) { this.show('success', message, duration); }
    error(message: string, duration?: number)   { this.show('error',   message, duration); }
    warning(message: string, duration?: number) { this.show('warning', message, duration); }
    info(message: string, duration?: number)    { this.show('info',    message, duration); }

    dismiss(id: string) {
        this._toasts.update(list => list.filter(t => t.id !== id));
    }
}
