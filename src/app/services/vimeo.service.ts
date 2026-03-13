import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VimeoTokenResponse {
    token: string;
    expiresAt: string;
    streamUrl: string;
}

@Injectable({
    providedIn: 'root'
})
export class VimeoService {
    private http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    generateAccessToken(workshopId: string, enrollmentId: string): Observable<VimeoTokenResponse> {
        return this.http.post<VimeoTokenResponse>(`${this.apiUrl}/api/v1/workshops/${workshopId}/vimeo-token`, { 
            enrollmentId 
        });
    }

    validateEligibility(workshopId: string): Observable<{ eligible: boolean, message?: string }> {
        return this.http.get<{ eligible: boolean, message?: string }>(
            `${this.apiUrl}/api/v1/workshops/${workshopId}/eligibility`
        );
    }
}
