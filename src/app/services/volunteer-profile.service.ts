import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VolunteerAvailability {
  timezone: string;
  weekdays: string[];
  hoursStart: number;
  hoursEnd: number;
}

export interface VolunteerStats {
  totalSessions: number;
  totalHours: number;
  rating: number;
}

export interface VolunteerProfileData {
  userId: string;
  bio?: string;
  domains: string[];
  skills: string[];
  languages: string[];
  maxCapacity: number;
  availability: VolunteerAvailability;
  verificationStatus: string;
  stats: VolunteerStats;
  isActive: boolean;
  rating: number;
}

@Injectable({ providedIn: 'root' })
export class VolunteerProfileService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/volunteer/profile`;
  private readonly volunteerBase = `${environment.apiUrl}/api/volunteer`;

  async enroll(payload: {
    domains: string[];
    languages: string[];
    bio?: string;
    skills?: string[];
    maxCapacity?: number;
    availability: VolunteerAvailability;
  }): Promise<VolunteerProfileData> {
    const res = await firstValueFrom(
      this.http.post<{ data: { profile: VolunteerProfileData } }>(`${this.base}/enroll`, payload)
    );
    return res.data.profile;
  }

  async getProfile(): Promise<VolunteerProfileData> {
    const res = await firstValueFrom(
      this.http.get<{ data: { profile: VolunteerProfileData } }>(`${this.base}`)
    );
    return res.data.profile;
  }

  async updateProfile(updates: Partial<VolunteerProfileData>): Promise<VolunteerProfileData> {
    const res = await firstValueFrom(
      this.http.patch<{ data: { profile: VolunteerProfileData } }>(`${this.base}`, updates)
    );
    return res.data.profile;
  }

  async deactivate(): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.base}`));
  }

  async heartbeat(payload: {
    userId: string;
    domains: string[];
    languages: string[];
    maxCapacity: number;
    isOnline: boolean;
  }): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.volunteerBase}/heartbeat`, payload)
    );
  }
}
