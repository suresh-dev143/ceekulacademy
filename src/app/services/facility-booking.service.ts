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
        const url = `${this.base}/api/nearby/partners?lat=${lat}&lng=${lng}&radius=${radius}`;

        return this.http.get<any>(url).pipe(
            map((res: { status: boolean; data: any[] }) => {
                if (!res.status || !res.data) return [];
                const data = Array.isArray(res.data) ? res.data : [res.data];

                return data.map((item: InfrastructureData) => {
                    const facilities: FacilityDetail[] = [];

                    // Map Classrooms
                    item.classrooms?.forEach((c: Classroom) => {
                        facilities.push({
                            facilityId: c._id || c.id || Math.random().toString(),
                            facilityName: c.name,
                            facilityType: 'Classroom',
                            capacity: c.capacity,
                            features: c.technology || [],
                            status: 'Available', // Backend should ideally provide this
                            pricing: { 
                                amount: c.availabilitySchedule?.[0]?.pricing?.amount || 0,
                                unit: c.availabilitySchedule?.[0]?.pricing?.unit || 'Hourly'
                            }
                        });
                    });

                    // Map Computer Labs
                    item.computerLabs?.forEach((c: ComputerLab) => {
                        facilities.push({
                            facilityId: c._id || c.id || Math.random().toString(),
                            facilityName: c.name,
                            facilityType: 'Lab',
                            capacity: c.capacity || (c as any).workstations || 0,
                            features: [...(c.softwareAvailable || []), c.internetSpeed].filter((x): x is string => !!x),
                            status: 'Available',
                            pricing: {
                                amount: c.availabilitySchedule?.[0]?.pricing?.amount || 0,
                                unit: c.availabilitySchedule?.[0]?.pricing?.unit || 'Hourly'
                            }
                        });
                    });

                    // Map Other Facilities
                    item.otherFacilities?.forEach((c: OtherFacility) => {
                        facilities.push({
                            facilityId: c._id || c.id || Math.random().toString(),
                            facilityName: c.name,
                            facilityType: 'Other',
                            capacity: c.capacity || 0,
                            features: [
                                ...(c.soundSystem ? ['Sound System'] : []),
                                ...(c.lightingSystem ? ['Lighting System'] : []),
                                ...(c.projectorScreen ? ['Projector Screen'] : [])
                            ],
                            status: 'Available',
                            pricing: {
                                amount: c.availabilitySchedule?.[0]?.pricing?.amount || 0,
                                unit: c.availabilitySchedule?.[0]?.pricing?.unit || 'Hourly'
                            }
                        });
                    });

                    // Filter facilities based on type and capacity
                    let filteredFacilities = facilities;
                    if (filters.type && filters.type !== 'All') {
                        filteredFacilities = filteredFacilities.filter(f => f.facilityType === filters.type);
                    }
                    if (filters.minCapacity) {
                        filteredFacilities = filteredFacilities.filter(f => f.capacity >= filters.minCapacity!);
                    }

                    // Apply "Recommended" logic
                    if (filters.minCapacity && filteredFacilities.length > 0) {
                        const bestMatch = [...filteredFacilities]
                            .sort((a, b) => (a.capacity - filters.minCapacity!) - (b.capacity - filters.minCapacity!))[0];
                        
                        if (bestMatch) {
                            filteredFacilities = filteredFacilities.map(f => ({
                                ...f,
                                isRecommended: f.facilityId === bestMatch.facilityId
                            }));
                        }
                    }

                    const address = item.generalInfo?.address;
                    const formattedAddress = address ? 
                        `${address.addressLine1}, ${address.city}, ${address.state} ${address.pincode}` : 
                        'Address not available';

                    return {
                        partnerId: item.partnerId || item._id,
                        partnerName: item.generalInfo?.schoolName || item.title || 'Unknown Partner',
                        address: formattedAddress,
                        shortAddress: address?.city || 'Local Area',
                        distance: (item as any).dist?.calculated ? parseFloat(((item as any).dist.calculated / 1000).toFixed(1)) : 0,
                        coordinates: item.generalInfo?.location?.coordinates ? {
                            lat: item.generalInfo.location.coordinates[1],
                            lng: item.generalInfo.location.coordinates[0]
                        } : { lat: 0, lng: 0 },
                        totalFacilities: facilities.length,
                        availableFacilities: filteredFacilities.length,
                        facilities: filteredFacilities
                    } as PartnerLocationSearchResult;
                }).filter((loc: PartnerLocationSearchResult) => loc.facilities.length > 0);
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
