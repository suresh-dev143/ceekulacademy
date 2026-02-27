import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../core/services/toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './toast.html',
    styleUrl: './toast.scss'
})
export class ToastComponent {
    private toastService = inject(ToastService);

    toasts = this.toastService.toasts;

    dismiss(id: string) {
        this.toastService.dismiss(id);
    }

    trackById(_: number, t: Toast) {
        return t.id;
    }

    iconFor(type: Toast['type']): string {
        const icons: Record<Toast['type'], string> = {
            success: 'fa-check-circle',
            error:   'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info:    'fa-info-circle',
        };
        return icons[type];
    }
}
