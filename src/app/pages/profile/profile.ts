import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../components/layout/layout';
import { ProfileHeaderComponent } from '../../components/profile-management/profile-header/profile-header';
import { ProfilePersonalComponent } from '../../components/profile-management/profile-personal/profile-personal';
import { ProfileProfessionalComponent } from '../../components/profile-management/profile-professional/profile-professional';
import { ProfileAddressComponent } from '../../components/profile-management/profile-address/profile-address';
import { ProfileAvailabilityComponent } from '../../components/profile-management/profile-availability/profile-availability';
import { ProfileSidebarRightComponent } from '../../components/profile-management/profile-sidebar-right/profile-sidebar-right';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        CommonModule,
        LayoutComponent,
        ProfileHeaderComponent,
        ProfilePersonalComponent,
        ProfileAddressComponent,
        ProfileProfessionalComponent,
        ProfileAvailabilityComponent,
        ProfileSidebarRightComponent
    ],
    templateUrl: './profile.html',
    styleUrl: './profile.scss'
})
export class ProfileComponent {
    private userService = inject(UserService);

    userProfile = this.userService.userProfile;
    completeness = this.userService.completeness;

    handlePersonalSave(personalData: any) {
        this.userService.updateProfile(personalData);
    }

    handleAddressSave(addressData: any) {
        this.userService.updateAddress(addressData);
    }

    handleProfessionalSave(professionalData: any) {
        this.userService.updateProfessional(professionalData);
    }
}
