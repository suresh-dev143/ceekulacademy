import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DinnerTimeCheck {
  isDinnerTime: boolean;
  localHour: number;
  window: string | null;
  suggestedMode: string;
}

export interface DinnerSession {
  sessionId: string;
}

export interface DinnerMemory {
  memoryId: string;
  text: string;
  memoryType: string;
  mood: string;
  aiSummary?: string;
}

@Injectable({ providedIn: 'root' })
export class DinnerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/dinner`;

  async timeCheck(): Promise<DinnerTimeCheck> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await firstValueFrom(
      this.http.get<{ data: DinnerTimeCheck }>(`${this.base}/time-check`, {
        params: { timezone: tz }
      })
    );
    return res.data;
  }

  async createSession(mode: string, dinnerType: string): Promise<DinnerSession> {
    const res = await firstValueFrom(
      this.http.post<{ data: DinnerSession }>(`${this.base}/session`, { mode, dinnerType })
    );
    return res.data;
  }

  async joinSession(sessionId: string, displayName: string, ageGroup: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.base}/session/${sessionId}/join`, {
        displayName,
        ageGroup,
        presenceType: 'physical',
      })
    );
  }

  async generatePrompt(sessionId: string): Promise<string> {
    const res = await firstValueFrom(
      this.http.post<{ data: any }>(`${this.base}/session/${sessionId}/prompt`, {})
    );
    const data = res.data;
    return data?.text ?? data?.prompt?.text ?? 'Share something meaningful with your family.';
  }

  async respondToPrompt(sessionId: string, promptText: string, responseText: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.base}/session/${sessionId}/prompt/respond`, {
        promptText,
        responseText,
      })
    );
  }

  async saveMemory(sessionId: string, text: string, memoryType: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.base}/session/${sessionId}/memory`, { text, memoryType })
    );
  }

  async getMemories(sessionId: string): Promise<DinnerMemory[]> {
    const res = await firstValueFrom(
      this.http.get<{ data: { memories: DinnerMemory[] } }>(`${this.base}/session/${sessionId}/memories`)
    );
    return res.data?.memories ?? [];
  }

  async endSession(sessionId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.base}/session/${sessionId}`)
    );
  }
}
