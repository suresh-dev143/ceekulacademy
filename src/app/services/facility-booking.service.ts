import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { InfrastructureService } from '../core/services/infrastructure.service';
import { InfrastructureData, Classroom, ComputerLab, OtherFacility } from '../core/models/infrastructure.model';

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
}

@Injectable({
    providedIn: 'root'
})
export class FacilityBookingService {
    private http = inject(HttpClient);
    private readonly base = environment.apiUrl;

    /**
     * Searches for nearby institutions with available infrastructure from real backend.
     */
    getAvailableLocations(lat: number, lng: number, filters: FacilityFilters): Observable<PartnerLocationSearchResult[]> {
        const radius = filters.maxDistance || 20;
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
     * Checks if a facility is available for a specific time slot (Refined).
     */
    checkAvailability(facilityId: string, date: string, startTime: string, endTime: string): Observable<{ available: boolean; conflict?: any }> {
        // Mock conflict: Computer Lab 2 (f103) is always booked
        const isConflict = facilityId === 'f103';
        
        return of({
            available: !isConflict,
            conflict: isConflict ? { message: 'Conflict: This facility is reserved by another session.' } : undefined
        }).pipe(delay(300));
    }

    /**
     * Books a facility for a session.
     */
    bookFacility(payload: { sessionId: string; facilityId: string; date: string; startTime: string; endTime: string }): Observable<{ status: boolean; message: string }> {
        return of({ status: true, message: 'Facility booked successfully!' }).pipe(delay(500));
    }
}
