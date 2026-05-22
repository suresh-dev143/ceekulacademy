import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GuestSessionData {
  sessionId: string;
  sessionType: string;
  status: string;
  filledEntities: Record<string, string>;
}

export interface OtpVerifyResult {
  verified: boolean;
  isNewUser: boolean;
  token?: string;
  userId?: string;
}

@Injectable({ providedIn: 'root' })
export class GuestSessionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/guest-session`;

  async createSession(sessionType: string): Promise<GuestSessionData> {
    const res = await firstValueFrom(
      this.http.post<{ data: GuestSessionData }>(`${this.base}`, { sessionType })
    );
    return res.data;
  }

  async fillEntity(sessionId: string, entity: string, value: string): Promise<void> {
    await firstValueFrom(
      this.http.patch(`${this.base}/${sessionId}/entity`, { entity, value })
    );
  }

  async requestOtp(sessionId: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.base}/${sessionId}/request-otp`, {})
    );
  }

  async verifyOtp(sessionId: string, otp: string): Promise<OtpVerifyResult> {
    const res = await firstValueFrom(
      this.http.post<{ data: OtpVerifyResult }>(`${this.base}/${sessionId}/verify-otp`, { otp })
    );
    return res.data;
  }

  async promote(sessionId: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.base}/${sessionId}/promote`, {})
    );
  }
}
