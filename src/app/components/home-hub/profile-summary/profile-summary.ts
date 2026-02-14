import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-profile-summary',
    imports: [CommonModule],
    templateUrl: './profile-summary.html',
    styleUrl: './profile-summary.scss'
})
export class ProfileSummaryComponent {
    @Input() user: any = {
        name: 'John Doe',
        role: 'Student',
        avatar: '👤'
    };

    @Output() viewProfile = new EventEmitter<void>();
    @Output() editProfile = new EventEmitter<void>();
    @Output() logout = new EventEmitter<void>();

    onViewProfile() {
        this.viewProfile.emit();
    }

    onEditProfile() {
        this.editProfile.emit();
    }

    onLogout() {
        this.logout.emit();
    }
}
