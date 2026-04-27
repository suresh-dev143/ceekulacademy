import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ValidationResult {
  status: 'APPROVED' | 'NEEDS_REVIEW' | 'REJECTED';
  reason: string;
  category_match_score: number;
  safety_score: number;
  quality_score: number;
}

@Injectable({ providedIn: 'root' })
export class ValidationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/validate`;

  validateContent(payload: { title: string; description: string; category: string }): Observable<{ status: boolean; data: ValidationResult }> {
    return this.http.post<{ status: boolean; data: ValidationResult }>(`${this.base}/content`, payload);
  }
}
