import { Component, inject, signal, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacilityBookingService, PartnerLocationSearchResult, FacilityDetail } from '../../../services/facility-booking.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-facility-discovery',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './facility-discovery.component.html',
    styleUrl: './facility-discovery.component.scss'
})
export class FacilityDiscoveryComponent implements OnInit {
    private bookingService = inject(FacilityBookingService);
    private toast = inject(ToastService);

    // Inputs for session context
    sessionDate = input<string>('');
    sessionStartTime = input<string>('');
    sessionEndTime = input<string>('');
    requiredCapacity = input<number>(0);

    // Outputs
    facilitySelected = output<any>(); // { partnerId, partnerName, facilityId, facilityName, facilityType, address, pricing }
    close = output<void>();

    // State
    locations = signal<PartnerLocationSearchResult[]>([]);
    isLoading = signal(false);
    expandedLocationId = signal<string | null>(null);
    selectedFacilityId = signal<string | null>(null);

    filters = signal({
        type: 'All',
        minCapacity: 0,
        maxDistance: 20
    });

    ngOnInit() {
        // Initialize filters from inputs
        this.filters.update(f => ({
            ...f,
            minCapacity: this.requiredCapacity() || f.minCapacity
        }));
        this.fetchLocations();
    }

    fetchLocations() {
        this.isLoading.set(true);

        const searchFilters = {
            ...this.filters(),
            date: this.sessionDate(),
            startTime: this.sessionStartTime(),
            endTime: this.sessionEndTime()
        };

        // Get user location using Browser GPS
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    this.callBookingService(lat, lng, searchFilters);
                },
                (error) => {
                    console.warn('Geolocation denied or failed, using fallback coordinates.', error);
                    // Fallback to Delhi/Noida region
                    this.callBookingService(28.6273, 77.3725, searchFilters);
                },
                { timeout: 10000 }
            );
        } else {
            console.warn('Geolocation not supported, using fallback coordinates.');
            this.callBookingService(28.6273, 77.3725, searchFilters);
        }
    }

    private callBookingService(lat: number, lng: number, searchFilters: any) {
        this.bookingService.getAvailableLocations(lat, lng, searchFilters).subscribe({
            next: (results) => {
                this.locations.set(results);
                this.isLoading.set(false);
                // Auto-expand first result if available and none expanded
                if (results.length > 0 && !this.expandedLocationId()) {
                    this.expandedLocationId.set(results[0].partnerId);
                }
            },
            error: () => {
                this.isLoading.set(false);
                this.toast.error('Failed to load nearby locations.');
            }
        });
    }

    toggleExpand(partnerId: string) {
        this.expandedLocationId.update(current => current === partnerId ? null : partnerId);
    }

    selectFacility(partner: PartnerLocationSearchResult, facility: FacilityDetail) {
        if (facility.status !== 'Available') {
            this.toast.warning('This facility is currently unavailable.');
            return;
        }

        // Emit complete selection data
        this.facilitySelected.emit({
            partnerId: partner.partnerId,
            partnerName: partner.partnerName,
            facilityId: facility.facilityId,
            facilityName: facility.facilityName,
            facilityType: facility.facilityType,
            address: partner.address,
            pricing: facility.pricing
        });
    }

    onFilterChange() {
        this.fetchLocations();
    }

    onClose() {
        this.close.emit();
    }
}
