import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { InfrastructureService } from '../core/services/infrastructure.service';
import { InfrastructureData, Classroom, ComputerLab, OtherFacility } from '../core/models/infrastructure.model';
import { WorkshopService, WorkshopListItem, WorkshopApiSchedule } from './workshop.service';
import { SlotOrchestrator } from '../core/utils/slot-orchestrator.util';
import { HourlySlot } from '../core/models/infrastructure.model';

export interface FacilityDetail {
    facilityId: string;
    facilityName: string;
    facilityType: 'Classroom' | 'Lab' | 'Other';
    capacity: number;
    features: string[];
    status: 'Available' | 'Booked' | 'Maintenance' | 'Closed';
    pricing: {
        amount: number;
        unit: 'Hourly' | 'Session';
    };
    isRecommended?: boolean;
    slots?: HourlySlot[]; // New granular slot-based model
}

export interface PartnerLocationSearchResult {
    partnerId: string;
    partnerName: string;
    address: string;
    shortAddress: string;
    distance: number; // in km
    coordinates: { lat: number; lng: number };
    totalFacilities: number;
    availableFacilities: number;
    facilities: FacilityDetail[];
    thumbnail?: string;
}

export interface FacilityFilters {
    type?: string;
    minCapacity?: number;
    maxDistance?: number;
    date?: string;
    startTime?: string;
    endTime?: string;
    requiredSlots?: number; // New: number of 1-hour slots needed
}

@Injectable({
    providedIn: 'root'
})
export class FacilityBookingService {
    private http = inject(HttpClient);
    private readonly base = environment.apiUrl;
    private workshopService = inject(WorkshopService);

    /**
     * Searches for nearby institutions with available infrastructure from real backend.
     */
    getAvailableLocations(lat: number, lng: number, filters: FacilityFilters): Observable<PartnerLocationSearchResult[]> {
        const radius = filters.maxDistance || 10;
        let url = `${this.base}/api/nearby/facilities?lat=${lat}&lng=${lng}&radius=${radius}`;
        
        if (filters.type && filters.type !== 'All') {
            url += `&type=${filters.type}`;
        }
        if (filters.minCapacity) {
            url += `&minCapacity=${filters.minCapacity}`;
        }
        if (filters.date) {
            url += `&date=${filters.date}`;
        }
        if (filters.startTime) {
            url += `&startTime=${filters.startTime}`;
        }
        if (filters.endTime) {
            url += `&endTime=${filters.endTime}`;
        }

        return this.http.get<any>(url).pipe(
            map((res: { status: boolean; data: any[] }) => {
                if (!res.status || !res.data) return [];
                return res.data as PartnerLocationSearchResult[];
            })
        );
    }

    /**
     * Checks if a facility is available for a specific time slot (Refined for Hourly Slots).
     */
    checkAvailability(facilityId: string, date: string, slots: string[]): Observable<{ available: boolean; conflict?: any }> {
        // Mock checking against a list of slots
        const isConflict = facilityId === 'f103' && slots.includes('09:00-10:00');
        
        return of({
            available: !isConflict,
            conflict: isConflict ? { message: 'Conflict: One of the selected slots is already reserved.' } : undefined
        }).pipe(delay(300));
    }

    /**
     * Books a facility for one or more sessions.
     */
    bookFacility(payload: { sessionId: string; facilityId: string; date: string; slots: string[] }): Observable<{ status: boolean; message: string }> {
        return this.checkAvailability(payload.facilityId, payload.date, payload.slots).pipe(
            map(res => {
                if (res.available) {
                    return { status: true, message: 'Facility booked successfully for your session(s)!' };
                }
                return { status: false, message: res.conflict?.message || 'Booking failed.' };
            }),
            delay(200)
        );
    }

    /**
     * Aggregates unique locations from locally saved workshops for offline discovery.
     */
    getOfflineLocations(): Observable<PartnerLocationSearchResult[]> {
        const workshops: WorkshopListItem[] = this.workshopService.localWorkshops();

        const locationMap = new Map<string, PartnerLocationSearchResult>();

        workshops.forEach((w: WorkshopListItem) => {
            w.schedules.forEach((s: WorkshopApiSchedule) => {
                if (s.mode === 'hybrid' && s.partnerId && s.facilityDetails) {
                    const partnerId = s.partnerId;
                    if (!locationMap.has(partnerId)) {
                        locationMap.set(partnerId, {
                            partnerId: s.partnerId,
                            partnerName: s.partnerName || 'Unknown Partner',
                            address: s.facilityDetails.address || s.location || '',
                            shortAddress: s.facilityDetails.shortAddress || s.location || '',
                            distance: s.facilityDetails.distance || 0,
                            coordinates: s.facilityDetails.coordinates || { lat: 0, lng: 0 },
                            totalFacilities: 0,
                            availableFacilities: 0,
                            facilities: []
                        });
                    }

                    const loc = locationMap.get(partnerId)!;
                    const exists = loc.facilities.some(f => f.facilityId === s.facilityId);
                    if (!exists && s.facilityId) {
                        const facility: FacilityDetail = {
                            facilityId: s.facilityId,
                            facilityName: s.facilityDetails.facilityName || 'Unknown Facility',
                            facilityType: (s.facilityType as any) || 'Other',
                            capacity: s.facilityDetails.capacity || 0,
                            features: s.facilityDetails.features || [],
                            status: 'Available', // Offline fallback assumes availability for selection
                            pricing: s.facilityDetails.pricing || { amount: 0, unit: 'Session' }
                        };
                        loc.facilities.push(facility);
                        loc.totalFacilities++;
                        loc.availableFacilities++;
                    }
                }
            });
        });

        return of(Array.from(locationMap.values())).pipe(delay(200));
    }
}
