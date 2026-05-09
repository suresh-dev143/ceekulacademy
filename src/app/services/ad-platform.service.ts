import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Advertisement {
  _id: string;
  title: string;
  description?: string;
  adType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  clickThroughUrl?: string;
  duration: number;
  category: string;
  contentCid?: string;
  ratePerSecondPerStudent: number;
  totalBudget: number;
  remainingBudget: number;
  totalSpent: number;
  status: 'pending_review' | 'active' | 'paused' | 'exhausted' | 'expired' | 'rejected';
  expiryDate: string;
  totalImpressions: number;
  totalSecondsPlayed: number;
  createdAt: string;
}

export interface AdAnalytics {
  totalImpressions: number;
  totalSecondsPlayed: number;
  totalSpent: number;
  remainingBudget: number;
  avgCompletionRate: number;
  uniqueStudents: number;
  dailyBreakdown: { _id: string; impressions: number; spend: number }[];
  fraud: { total: number; fraudulent: number; blockedRevenue: number };
}

export interface Lecture {
  _id: string;
  title: string;
  description?: string;
  category: string;
  type: 'live' | 'recorded';
  status: string;
  isLive: boolean;
  duration: number;
  adSlotDuration: number;
  adControl: 'teacher' | 'student';
  preferredAdCategories: string[];
  blockedAdCategories: string[];
  viewCount: number;
  liveViewerCount: number;
  hlsPlaylistUrl?: string;
  totalRevenue: number;
  createdAt: string;
}

export interface NeuronWallet {
  _id: string;
  balance: number;
  pendingBalance: number;
  lockedBalance: number;
  totalEarned: number;
  totalSpent: number;
  bankAccountVerified: boolean;
}

export interface MatchedAd {
  adId: string;
  title: string;
  adType: 'image' | 'video';
  mediaUrl: string;
  clickThroughUrl?: string;
  duration: number;
  effectiveRate: number;
  multiplier: number;
  category: string;
}

export interface AdPreferences {
  preferredCategories: string[];
  blockedCategories: string[];
  minimumAdRate: number;
  allowStudentAdControl?: boolean;
}

export interface Settlement {
  _id: string;
  month: number;
  year: number;
  grossAmount: number;
  netAmount: number;
  amountInINR: number;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'on_hold';
  paidAt?: string;
  totalImpressions: number;
}

export interface AdPlanSlot {
  contentRef: string;
  adId: string;
  startTime: number;
  endTime: number;
  duration: number;
  matchScore: number;
  ratePerSec: number;
  category: string;
}

export interface AdPlan {
  sessionKey: string;
  slots: AdPlanSlot[];
  totalDuration: number;
  computedAt: string;
  expiresAt: string;
  fromCache: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdPlatformService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api`;

  // ==================== ADVERTISER ====================

  uploadAdMedia(file: File): Observable<{ status: boolean; data: { mediaUrl: string; adType: 'image' | 'video'; filename: string; size: number } }> {
    const formData = new FormData();
    formData.append('media', file);
    return this.http.post<any>(`${this.api}/advertiser/ads/upload-media`, formData);
  }

  createAd(adData: Partial<Advertisement>): Observable<any> {
    return this.http.post(`${this.api}/advertiser/ads`, adData);
  }

  getMyAds(params: { page?: number; limit?: number; status?: string } = {}): Observable<any> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) httpParams = httpParams.set(k, String(v)); });
    return this.http.get(`${this.api}/advertiser/ads`, { params: httpParams });
  }

  getAdAnalytics(adId: string): Observable<{ status: boolean; data: { ad: Advertisement; analytics: AdAnalytics } }> {
    return this.http.get<any>(`${this.api}/advertiser/ads/${adId}/analytics`);
  }

  updateAd(adId: string, update: { status?: string; additionalBudget?: number }): Observable<any> {
    return this.http.patch(`${this.api}/advertiser/ads/${adId}`, update);
  }

  getAdvertiserDashboard(): Observable<any> {
    return this.http.get(`${this.api}/advertiser/dashboard`);
  }

  depositToWallet(amount: number, razorpayPaymentId: string): Observable<any> {
    return this.http.post(`${this.api}/advertiser/wallet/deposit`, { amount, razorpayPaymentId });
  }

  // ==================== LECTURES ====================

  createLecture(data: Partial<Lecture>): Observable<any> {
    return this.http.post(`${this.api}/lectures`, data);
  }

  getLectures(params: { page?: number; category?: string; type?: string; search?: string } = {}): Observable<any> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) httpParams = httpParams.set(k, String(v)); });
    return this.http.get(`${this.api}/lectures`, { params: httpParams });
  }

  getTeacherLectures(params: { page?: number; status?: string } = {}): Observable<any> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) httpParams = httpParams.set(k, String(v)); });
    return this.http.get(`${this.api}/lectures/teacher/mine`, { params: httpParams });
  }

  goLive(lectureId: string): Observable<any> {
    return this.http.post(`${this.api}/lectures/${lectureId}/go-live`, {});
  }

  endLive(lectureId: string): Observable<any> {
    return this.http.post(`${this.api}/lectures/${lectureId}/end-live`, {});
  }

  watchLecture(lectureId: string, sessionId: string, deviceFingerprint?: string): Observable<any> {
    let params = new HttpParams().set('sessionId', sessionId);
    if (deviceFingerprint) params = params.set('deviceFingerprint', deviceFingerprint);
    return this.http.get(`${this.api}/lectures/${lectureId}/watch`, { params });
  }

  leaveLecture(lectureId: string): Observable<any> {
    return this.http.post(`${this.api}/lectures/${lectureId}/leave`, {});
  }

  publishLecture(lectureId: string): Observable<any> {
    return this.http.patch(`${this.api}/lectures/${lectureId}/publish`, {});
  }

  updateLectureAdPreferences(lectureId: string, prefs: Partial<Lecture>): Observable<any> {
    return this.http.patch(`${this.api}/lectures/${lectureId}/ad-preferences`, prefs);
  }

  // ==================== ADS ====================

  getMatchedAds(lectureId: string): Observable<{ status: boolean; data: { ads: MatchedAd[]; totalDuration: number; isLive: boolean } }> {
    return this.http.get<any>(`${this.api}/ads/match`, { params: { lectureId } });
  }

  startImpression(data: { adId: string; lectureId: string; sessionId: string; deviceFingerprint?: string }): Observable<any> {
    return this.http.post(`${this.api}/ads/impression/start`, data);
  }

  tickImpression(data: { sessionId: string; adId: string; lectureId: string; activeStudentIds?: string[]; isLive?: boolean; teacherId?: string }): Observable<any> {
    return this.http.post(`${this.api}/ads/impression/tick`, data);
  }

  completeImpression(sessionId: string, watchedSeconds: number): Observable<any> {
    return this.http.post(`${this.api}/ads/impression/complete`, { sessionId, watchedSeconds });
  }

  getAdPreferences(): Observable<{ status: boolean; data: AdPreferences }> {
    return this.http.get<any>(`${this.api}/ads/preferences`);
  }

  updateAdPreferences(prefs: Partial<AdPreferences>): Observable<any> {
    return this.http.put(`${this.api}/ads/preferences`, prefs);
  }

  // ==================== WALLET ====================

  getWallet(): Observable<{ status: boolean; data: NeuronWallet }> {
    return this.http.get<any>(`${this.api}/wallet`);
  }

  getTransactions(params: { page?: number; limit?: number; type?: string } = {}): Observable<any> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) httpParams = httpParams.set(k, String(v)); });
    return this.http.get(`${this.api}/wallet/transactions`, { params: httpParams });
  }

  getEarnings(period: '7d' | '30d' | '90d' = '30d'): Observable<any> {
    return this.http.get(`${this.api}/wallet/earnings`, { params: { period } });
  }

  getSettlements(page = 1): Observable<any> {
    return this.http.get(`${this.api}/wallet/settlements`, { params: { page: String(page) } });
  }

  linkBankAccount(data: { accountNumber: string; ifscCode: string; accountHolderName: string; upiId?: string }): Observable<any> {
    return this.http.post(`${this.api}/wallet/bank-account`, data);
  }

  // ==================== CID-BASED AD DELIVERY ====================

  getAdPlan(sessionKey: string): Observable<{ status: boolean; data: AdPlan }> {
    return this.http.get<any>(`${this.api}/ads/delivery/${encodeURIComponent(sessionKey)}`);
  }

  precomputePlan(body: { pageId: string; userId?: string; learnerProfile?: Record<string, unknown>; force?: boolean }): Observable<any> {
    return this.http.post(`${this.api}/ads/precompute`, body);
  }

  upsertAdIndex(entry: { adId: string; contentRef: string; rate: number; duration: number; category?: string; themes?: string[]; ageGroup?: string }): Observable<any> {
    return this.http.post(`${this.api}/ads/index/upsert`, entry);
  }

  removeAdFromIndex(adId: string): Observable<any> {
    return this.http.post(`${this.api}/ads/index/remove`, { adId });
  }

  invalidateAdPlans(pageId: string): Observable<any> {
    return this.http.delete(`${this.api}/ads/plan/${pageId}`);
  }
}
