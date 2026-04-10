import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { MatchedAd } from './ad-platform.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PageType    = 'teacher_global' | 'student' | 'private';
export type ControlMode = 1 | 2 | 3;

export interface AdCriteria {
  categories:       string[];
  themes:           string[];
  minRatePerSecond: number;
}

export interface Page {
  _id:         string;
  ownerId:     string;
  ownerRole:   'teacher' | 'student';
  title:       string;
  description: string;
  pageType:    PageType;
  /** 1 = teacher mandatory | 2 = student override | 3 = private per user */
  controlMode: ControlMode;
  adCriteria:  AdCriteria;
  lectureId?:  string;
  revenueSplit: { teacher: number; student: number; platform: number };
  isActive:       boolean;
  totalViewers:   number;
  totalAdRevenue: number;
  createdAt:      string;
}

export interface CreatePagePayload {
  title:        string;
  description?: string;
  pageType:     PageType;
  controlMode?: ControlMode;
  adCriteria?:  Partial<AdCriteria>;
  lectureId?:   string;
  revenueSplit?: { teacher: number; student: number; platform: number };
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PageService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/pages`;

  // Reactive state — currently active/selected page
  activePage = signal<Page | null>(null);
  myPages    = signal<Page[]>([]);

  // ── CRUD ───────────────────────────────────────────────────────────────────

  createPage(payload: CreatePagePayload): Observable<{ status: boolean; data: Page }> {
    return this.http.post<{ status: boolean; data: Page }>(this.base, payload).pipe(
      tap(res => {
        this.myPages.update(pages => [res.data, ...pages]);
        this.activePage.set(res.data);
      })
    );
  }

  getMyPages(): Observable<{ status: boolean; data: Page[] }> {
    return this.http.get<{ status: boolean; data: Page[] }>(this.base).pipe(
      tap(res => this.myPages.set(res.data))
    );
  }

  getPageById(pageId: string): Observable<{ status: boolean; data: Page }> {
    return this.http.get<{ status: boolean; data: Page }>(`${this.base}/${pageId}`).pipe(
      tap(res => this.activePage.set(res.data))
    );
  }

  /** Returns the teacher_global page linked to a lecture (students call this at join time) */
  getPageForLecture(lectureId: string): Observable<{ status: boolean; data: Page }> {
    return this.http.get<{ status: boolean; data: Page }>(
      `${this.base}/lecture/${lectureId}`
    ).pipe(
      tap(res => this.activePage.set(res.data))
    );
  }

  updatePage(pageId: string, updates: Partial<CreatePagePayload>): Observable<{ status: boolean; data: Page }> {
    return this.http.patch<{ status: boolean; data: Page }>(`${this.base}/${pageId}`, updates).pipe(
      tap(res => {
        this.activePage.set(res.data);
        this.myPages.update(pages =>
          pages.map(p => p._id === pageId ? res.data : p)
        );
      })
    );
  }

  deactivatePage(pageId: string): Observable<{ status: boolean }> {
    return this.http.delete<{ status: boolean }>(`${this.base}/${pageId}`).pipe(
      tap(() => {
        this.myPages.update(pages => pages.filter(p => p._id !== pageId));
        if (this.activePage()?._id === pageId) this.activePage.set(null);
      })
    );
  }

  // ── Ad operations ──────────────────────────────────────────────────────────

  /** Resolve what ad criteria apply to the current user on this page */
  resolveEffectiveCriteria(pageId: string): Observable<{ status: boolean; data: AdCriteria }> {
    return this.http.get<{ status: boolean; data: AdCriteria }>(
      `${this.base}/${pageId}/resolve`
    );
  }

  /** Fetch personalised ad playlist — called by video player right after session ends */
  getAdsForPage(pageId: string): Observable<{ status: boolean; data: { ads: MatchedAd[]; totalDuration: number; latencyMs: number } }> {
    return this.http.get<{ status: boolean; data: { ads: MatchedAd[]; totalDuration: number; latencyMs: number } }>(
      `${this.base}/${pageId}/ads`
    );
  }

  // ── Local helpers ──────────────────────────────────────────────────────────

  setActivePage(page: Page): void {
    this.activePage.set(page);
  }

  clearActivePage(): void {
    this.activePage.set(null);
  }
}
