import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Request types ─────────────────────────────────────────────────────────────

export interface WorkshopSession {
    date:      string;       // YYYY-MM-DD
    startTime: string;       // HH:mm
    endTime:   string;       // HH:mm
    activity:  string;
    fee:       number;
    mode:      'online' | 'hybrid';
    location:  string | null;
}

export interface CreateWorkshopRequest {
    workshopTitle:       string;
    workshopDescription: string;
    expertDescription:   string;
    workshopMode:        'online' | 'hybrid';
    timezone:            string;
    instructorType:      'myself' | 'open';
    sessions:            WorkshopSession[];
}

// ── Response types ────────────────────────────────────────────────────────────

export interface CreatedWorkshopData {
    _id:                   string;
    workshopTitle:         string;
    workshopDescription:   string;
    expertDescription:     string;
    workshopMode:          string;
    timezone:              string;
    instructorType:        string;
    createdBy:             string;
    status:                string;
    sessions:              Array<WorkshopSession & { _id: string; date: string }>;
    totalRevenuePotential: number;
    createdAt:             string;
    updatedAt:             string;
}

export interface CreateWorkshopResponse {
    status:  boolean;
    message: string;
    data:    CreatedWorkshopData;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class WorkshopService {
    private http = inject(HttpClient);
    private readonly base = environment.apiUrl;

    create(payload: CreateWorkshopRequest): Observable<CreateWorkshopResponse> {
        return this.http.post<CreateWorkshopResponse>(
            `${this.base}/api/v1/workshops`,
            payload
        );
    }
}
