import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Target types ───────────────────────────────────────────────────────────────

export type TransformTargetType = 'workshop' | 'course' | 'research' | 'advertisement';

// ── Output shapes (one per target type) ───────────────────────────────────────

export interface TransformedSession {
  order: number;
  title: string;
  description: string;
}

export interface TransformedLecture {
  title: string;
  description: string;
  duration: number; // estimated minutes
}

export interface TransformedWorkshop {
  sessions: TransformedSession[];
}

export interface TransformedCourse {
  lectures: TransformedLecture[];
}

export interface TransformedResearch {
  problem: string;
  hypothesis: string;
  keywords: string[];
}

export interface TransformedAdvertisement {
  title: string;
  mediaUrl: string;
  type: string;
}

export type TransformData =
  | TransformedWorkshop
  | TransformedCourse
  | TransformedResearch
  | TransformedAdvertisement;

// ── API response ───────────────────────────────────────────────────────────────

export interface TransformResult {
  cid: string;
  targetType: TransformTargetType;
  version: number;
  data: TransformData;
  status: 'ok' | 'needs_review';
  message?: string;
  fromCache: boolean;
}

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class TransformService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/creator`;

  transform(cid: string, type: TransformTargetType): Observable<{ data: TransformResult }> {
    return this.http.get<{ data: TransformResult }>(
      `${this.base}/transform?cid=${encodeURIComponent(cid)}&type=${type}`
    );
  }

  isWorkshop(data: TransformData): data is TransformedWorkshop {
    return 'sessions' in data;
  }

  isCourse(data: TransformData): data is TransformedCourse {
    return 'lectures' in data;
  }

  isResearch(data: TransformData): data is TransformedResearch {
    return 'problem' in data;
  }

  isAdvertisement(data: TransformData): data is TransformedAdvertisement {
    return 'mediaUrl' in data && 'type' in data;
  }
}
