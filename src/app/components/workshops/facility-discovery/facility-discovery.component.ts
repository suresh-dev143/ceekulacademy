import { Component, inject, signal, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacilityBookingService, PartnerLocationSearchResult, FacilityDetail } from '../../../services/facility-booking.service';
import { ToastService } from '../../../core/services/toast.service';
import { LocationService } from '../../../core/services/location.service';
import { PartnerService } from '../../../services/partner.service';
import { TeacherDashboardService } from '../../../services/teacher-dashboard.service';
import { GeoLocation } from '../../../core/models/address.model';
import { SlotOrchestrator } from '../../../core/utils/slot-orchestrator.util';
import { HourlySlot } from '../../../core/models/infrastructure.model';

@Component({
    selector: 'app-facility-discovery',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './facility-discovery.component.html',
    styleUrl: './facility-discovery.component.scss'
})
export class FacilityDiscoveryComponent implements OnInit {
    private bookingService = inject(FacilityBookingService);
    private locationService = inject(LocationService);
    private partnerService = inject(PartnerService);
    private teacherService = inject(TeacherDashboardService);
    private toast = inject(ToastService);

    // Inputs for session context
    sessionDate = input<string>('');
    sessionStartTime = input<string>('');
    sessionEndTime = input<string>('');
    requiredCapacity = input<number>(0);
    isOffline = input<boolean>(false);
    requiredSlots = input<number>(1); // New: defaults to 1 hour

    // Outputs
    facilitySelected = output<any>(); // { partnerId, partnerName, facilityId, facilityName, facilityType, address, pricing }
    close = output<void>();

    // State
    locations = signal<PartnerLocationSearchResult[]>([]);
    isLoading = signal(false);
    expandedLocationId = signal<string | null>(null);
    selectedFacilityId = signal<string | null>(null);
    searchAddress = signal<string>('');
    searchCity = signal<string>('');
    searchDistrict = signal<string>('');
    searchPincode = signal<string>('');
    searchLocationLabel = signal<string>('Detecting location...');
    selectedFacilitySlots = signal<Map<string, string[]>>(new Map()); // Map<facilityId, slotTime[]>

    filters = signal({
        type: 'All',
        minCapacity: 0,
        maxDistance: 10
    });

    ngOnInit() {
        // Initialize filters from inputs
        this.filters.update(f => ({
            ...f,
            minCapacity: this.requiredCapacity() || f.minCapacity
        }));
        this.fetchLocations();
    }

    fetchLocations(isReset = false) {
        this.isLoading.set(true);
        if (isReset) this.searchLocationLabel.set('Detecting location...');

        const searchFilters = {
            ...this.filters(),
            date: this.sessionDate(),
            startTime: this.sessionStartTime(),
            endTime: this.sessionEndTime(),
            requiredSlots: this.requiredSlots()
        };

        if (this.isOffline()) {
            this.loadOfflineLocations();
            return;
        }

        // Get user location using Browser GPS
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    this.searchLocationLabel.set('Current GPS Location');
                    this.callBookingService(lat, lng, searchFilters);
                },
                (error) => {
                    console.warn('Geolocation denied or failed, using profile fallback.', error);
                    this.useFallbackCoordinates(searchFilters);
                },
                { timeout: 10000 }
            );
        } else {
            console.warn('Geolocation not supported, using profile fallback.');
            this.useFallbackCoordinates(searchFilters);
        }
    }

    private useFallbackCoordinates(searchFilters: any) {
        // 1. Try Partner Profile
        const partner = this.partnerService.profile();
        if (partner.coordinates && partner.address.city) {
            this.searchLocationLabel.set(`${partner.address.city}, ${partner.address.state}`);
            this.callBookingService(partner.coordinates.lat, partner.coordinates.lng, searchFilters);
            return;
        }

        // 2. Try Teacher Profile
        const teacherCoords = this.teacherService.currentCoordinates();
        const teacherAddr = this.teacherService.currentLocation();
        if (teacherCoords) {
            this.searchLocationLabel.set(teacherAddr || 'Profile Address');
            this.callBookingService(teacherCoords.lat, teacherCoords.lng, searchFilters);
            return;
        }

        // 3. Last Resort: Hardcoded Fallback
        this.searchLocationLabel.set('Noida (Default)');
        this.callBookingService(28.6273, 77.3725, searchFilters);
    }

    resetToMyLocation() {
        this.searchAddress.set('');
        this.searchCity.set('');
        this.searchDistrict.set('');
        this.searchPincode.set('');
        this.fetchLocations(true);
    }

    private callBookingService(lat: number, lng: number, searchFilters: any) {
        this.bookingService.getAvailableLocations(lat, lng, searchFilters).subscribe({
            next: (results) => {
                const resultsWithSlots = results.map(loc => ({
                    ...loc,
                    facilities: loc.facilities.map(f => {
                        let extractedSlots = f.slots || [];
                        const schedules = (f as any).availabilitySchedule as any[];
                        
                        if (extractedSlots.length === 0 && schedules && schedules.length > 0) {
                            // Find schedule for requested date or day
                            let targetSchedule = null;
                            if (searchFilters.date) {
                                const searchDate = new Date(searchFilters.date);
                                const dayName = searchDate.toLocaleDateString('en-US', { weekday: 'long' });
                                targetSchedule = schedules.find(s => s.date === searchFilters.date || s.day === dayName);
                            }
                            
                            // If no specific match, just take the first schedule's slots as a preview
                            if (!targetSchedule) targetSchedule = schedules[0];
                            if (targetSchedule && targetSchedule.slots) extractedSlots = targetSchedule.slots;
                        }

                        return {
                            ...f,
                            slots: extractedSlots.length > 0 ? extractedSlots : this.generateFallbackSlots(f)
                        };
                    })
                }));
                this.locations.set(resultsWithSlots);
                this.isLoading.set(false);
                // Auto-expand first result if available and none expanded
                if (resultsWithSlots.length > 0 && !this.expandedLocationId()) {
                    this.expandedLocationId.set(resultsWithSlots[0].partnerId);
                }
            },
            error: () => {
                console.warn('API fetch failed, trying offline fallback...');
                this.loadOfflineLocations();
            }
        });
    }

    private loadOfflineLocations() {
        this.bookingService.getOfflineLocations().subscribe({
            next: (results) => {
                const resultsWithSlots = results.map(loc => ({
                    ...loc,
                    facilities: loc.facilities.map(f => {
                        let extractedSlots = f.slots || [];
                        const schedules = (f as any).availabilitySchedule as any[];
                        
                        if (extractedSlots.length === 0 && schedules && schedules.length > 0) {
                            // Find schedule for requested date or day
                            let targetSchedule = null;
                            const sessionDateStr = this.sessionDate();
                            if (sessionDateStr) {
                                const searchDate = new Date(sessionDateStr);
                                const dayName = searchDate.toLocaleDateString('en-US', { weekday: 'long' });
                                targetSchedule = schedules.find(s => s.date === sessionDateStr || s.day === dayName);
                            }
                            
                            if (!targetSchedule) targetSchedule = schedules[0];
                            if (targetSchedule && targetSchedule.slots) extractedSlots = targetSchedule.slots;
                        }

                        return {
                            ...f,
                            slots: extractedSlots.length > 0 ? extractedSlots : this.generateFallbackSlots(f)
                        };
                    })
                }));
                this.locations.set(resultsWithSlots);
                this.isLoading.set(false);
                if (resultsWithSlots.length > 0 && !this.expandedLocationId()) {
                    this.expandedLocationId.set(resultsWithSlots[0].partnerId);
                }
                if (this.isOffline() && resultsWithSlots.length === 0) {
                    this.toast.info('No locally saved locations found.');
                }
            },
            error: () => {
                this.isLoading.set(false);
                this.toast.error('Failed to load locations.');
            }
        });
    }

    toggleExpand(partnerId: string) {
        this.expandedLocationId.update(current => current === partnerId ? null : partnerId);
    }

    toggleSlot(facilityId: string, slotTime: string) {
        this.selectedFacilitySlots.update(map => {
            const newMap = new Map(map);
            const currentSlots = newMap.get(facilityId) || [];
            if (currentSlots.includes(slotTime)) {
                newMap.set(facilityId, currentSlots.filter(s => s !== slotTime));
            } else {
                newMap.set(facilityId, [...currentSlots, slotTime]);
            }
            return newMap;
        });
    }

    isSlotSelected(facilityId: string, slotTime: string): boolean {
        return this.selectedFacilitySlots().get(facilityId)?.includes(slotTime) ?? false;
    }

    isSlotAvailable(slot: HourlySlot): boolean {
        return slot.status === 'Available';
    }

    hasAnyAvailable(slots: HourlySlot[] | undefined): boolean {
        return slots?.some(s => s.status === 'Available') ?? false;
    }

    private generateFallbackSlots(facility: FacilityDetail): HourlySlot[] {
        // Fallback: Generate standard slots but mark all as "Closed" by default
        // to prevent booking of non-declared infrastructure capacity.
        const standard = SlotOrchestrator.generateStandardSlots();
        return standard.map((slot) => {
            return {
                ...slot,
                status: 'Closed',
                pricing: facility.pricing as any
            };
        });
    }

    /**
     * @deprecated Use f.slots directly in the template. This method is kept for backward compatibility if needed.
     */
    getFacilityHourlySlots(facility: FacilityDetail): HourlySlot[] {
        return facility.slots || this.generateFallbackSlots(facility);
    }

    selectFacility(partner: PartnerLocationSearchResult, facility: FacilityDetail) {
        if (facility.status !== 'Available' && facility.status !== 'Closed') {
             // In slot mode, 'Closed' facilities might have available slots if generated dynamically
             // But we check top-level status first if provided
        }

        const chosenSlots = this.selectedFacilitySlots().get(facility.facilityId) || [];
        
        if (chosenSlots.length === 0) {
            this.toast.warning('Please select at least one hourly slot.');
            return;
        }

        this.facilitySelected.emit({
            partnerId: partner.partnerId,
            partnerName: partner.partnerName,
            facilityId: facility.facilityId,
            facilityName: facility.facilityName,
            facilityType: facility.facilityType,
            address: partner.address,
            pricing: facility.pricing,
            selectedSlots: chosenSlots
        });
    }

    getBestSlotSequence(facility: any): string[] {
        return [this.sessionStartTime()]; 
    }

    onFilterChange() {
        this.fetchLocations();
    }

    searchByAddress() {
        const addr = this.searchAddress().trim();
        const city = this.searchCity().trim();
        const district = this.searchDistrict().trim();
        const pincode = this.searchPincode().trim();

        // 1. Build a combination if specific fields are provided
        let combinedAddr = addr;
        if (city || district || pincode) {
            combinedAddr = [addr, city, district, pincode].filter(x => x).join(', ');
        }

        if (!combinedAddr) {
            this.fetchLocations();
            return;
        }

        this.isLoading.set(true);
        this.locationService.geocodeAddress(combinedAddr).subscribe({
            next: (loc: GeoLocation) => {
                this.searchLocationLabel.set(combinedAddr);
                this.callBookingService(loc.coordinates[1], loc.coordinates[0], {
                    ...this.filters(),
                    date: this.sessionDate(),
                    startTime: this.sessionStartTime(),
                    endTime: this.sessionEndTime()
                });
            },
            error: () => {
                this.isLoading.set(false);
                this.toast.error('Could not find that location.');
            }
        });
    }

    clearLocationFilters() {
        this.searchAddress.set('');
        this.searchCity.set('');
        this.searchDistrict.set('');
        this.searchPincode.set('');
    }

    onClose() {
        this.close.emit();
    }
}
