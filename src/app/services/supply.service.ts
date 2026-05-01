import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type SupplyCategory = 'education' | 'healthcare' | 'justice' | 'infrastructure' | 'service' | 'product';

export interface ScheduleRow { day: string; time: string; location: string; }

export interface SupplyResource {
  _id?:              string;
  resourceType:      string;
  resourceName:      string;
  details:           string;
  possibleUses:      string;
  discussionEnabled: boolean;
  gradingEnabled:    boolean;
}

export interface SupplyPayload {
  category:     SupplyCategory;
  title:        string;
  ceebrainId?:  string;
  details?:     Record<string, string>;
  schedule?:    { rows: ScheduleRow[]; durationFrom: string; durationTo: string };
  pricing?:     Record<string, unknown>;
  contact?:     { phone: string; email: string; address: string };
  resources?:   SupplyResource[];
  status?:      'active' | 'draft';
}

export interface Supply extends SupplyPayload {
  _id:          string;
  providerId:   string;
  providerName: string;
  createdAt:    string;
  updatedAt:    string;
}

interface ApiResponse<T> { status: boolean; data: T; message?: string; }

@Injectable({ providedIn: 'root' })
export class SupplyService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/supply`;

  list(category?: SupplyCategory): Observable<ApiResponse<Supply[]>> {
    const qs = category ? `?category=${category}` : '';
    return this.http.get<ApiResponse<Supply[]>>(`${this.base}${qs}`);
  }

  get(id: string): Observable<ApiResponse<Supply>> {
    return this.http.get<ApiResponse<Supply>>(`${this.base}/${id}`);
  }

  create(payload: SupplyPayload): Observable<ApiResponse<Supply>> {
    return this.http.post<ApiResponse<Supply>>(this.base, payload);
  }

  update(id: string, payload: Partial<SupplyPayload>): Observable<ApiResponse<Supply>> {
    return this.http.put<ApiResponse<Supply>>(`${this.base}/${id}`, payload);
  }

  addResource(supplyId: string, resource: SupplyResource): Observable<ApiResponse<SupplyResource[]>> {
    return this.http.post<ApiResponse<SupplyResource[]>>(`${this.base}/${supplyId}/resource`, resource);
  }

  removeResource(supplyId: string, resourceId: string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/${supplyId}/resource/${resourceId}`);
  }

  delete(id: string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/${id}`);
  }
}
