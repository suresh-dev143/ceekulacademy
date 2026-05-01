import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { AdPlatformService, Advertisement } from '../../services/ad-platform.service';
import { RazorpayService } from '../../services/razorpay.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-advertiser-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
      <div class="advertiser-dashboard">

        <!-- Notifications -->
        @if (errorMessage()) {
          <div class="alert alert-error" role="alert">
            <span>{{ errorMessage() }}</span>
            <button class="alert-close" (click)="errorMessage.set(null)" aria-label="Dismiss">&#x2715;</button>
          </div>
        }
        @if (successMessage()) {
          <div class="alert alert-success" role="alert">
            <span>{{ successMessage() }}</span>
            <button class="alert-close" (click)="successMessage.set(null)" aria-label="Dismiss">&#x2715;</button>
          </div>
        }

        <!-- Header -->
        <div class="dashboard-header">
          <h1 class="page-title">Advertiser Dashboard</h1>
          <button class="btn-primary" (click)="activeTab.set('create')">+ Upload Ad</button>
        </div>

        <!-- Wallet Summary -->
        @if (wallet()) {
        <div class="wallet-summary-bar">
          <div class="wallet-stat">
            <span class="stat-label">Balance</span>
            <span class="stat-value neuron">{{ wallet()!.balance | number:'1.2-2' }} ⚡</span>
          </div>
          <div class="wallet-stat">
            <span class="stat-label">Locked</span>
            <span class="stat-value">{{ wallet()!.lockedBalance | number:'1.2-2' }} ⚡</span>
          </div>
          <div class="wallet-stat">
            <span class="stat-label">Total Spent</span>
            <span class="stat-value">{{ wallet()!.totalSpent | number:'1.2-2' }} ⚡</span>
          </div>
          <button class="btn-outline-sm" (click)="openDepositModal()">Top Up Wallet</button>
        </div>
        }

        <!-- Tab Navigation -->
        <div class="tab-nav">
          <button [class.active]="activeTab() === 'ads'" (click)="activeTab.set('ads')">My Ads</button>
          <button [class.active]="activeTab() === 'analytics'" (click)="activeTab.set('analytics')">Analytics</button>
          <button [class.active]="activeTab() === 'create'" (click)="activeTab.set('create')">Create Ad</button>
        </div>

        <!-- My Ads Tab -->
        @if (activeTab() === 'ads') {
          <div class="ads-grid">
            <div class="status-filter">
              @for (s of statusFilters; track $index) {
              <button [class.active]="selectedStatus() === s"
                (click)="filterByStatus(s)">{{ s | titlecase }}</button>
              }
            </div>

            @if (isLoading()) {
              <div class="loading-spinner">Loading...</div>
            } @else if (ads().length === 0) {
              <div class="empty-state">
                <p>No ads yet. <a (click)="activeTab.set('create')">Create your first ad</a></p>
              </div>
            } @else {
              <div class="ad-cards">
                @for (ad of ads(); track ad._id) {
                  <div class="ad-card" [class.active]="ad.status === 'active'">
                    <div class="ad-card-header">
                      <img [src]="ad.thumbnailUrl || '/assets/placeholder-ad.jpg'" [alt]="ad.title" class="ad-thumb">
                      <div class="ad-meta">
                        <h3>{{ ad.title }}</h3>
                        <span class="category-badge">{{ ad.category }}</span>
                        <span class="status-badge" [class]="'status-' + ad.status">{{ ad.status }}</span>
                      </div>
                    </div>
                    <div class="ad-stats">
                      <div class="stat">
                        <span class="label">Rate/sec</span>
                        <span class="value">{{ ad.ratePerSecondPerStudent }} ⚡</span>
                      </div>
                      <div class="stat">
                        <span class="label">Budget Used</span>
                        <span class="value">{{ ad.totalSpent | number:'1.2-2' }}/{{ ad.totalBudget }} ⚡</span>
                      </div>
                      <div class="stat">
                        <span class="label">Impressions</span>
                        <span class="value">{{ ad.totalImpressions }}</span>
                      </div>
                    </div>
                    <div class="budget-bar">
                      <div class="budget-fill"
                        [style.width.%]="(ad.remainingBudget / ad.totalBudget) * 100">
                      </div>
                    </div>
                    <div class="ad-actions">
                      <button class="btn-sm" (click)="viewAnalytics(ad)">Analytics</button>
                      @if (ad.status === 'active') {
                        <button class="btn-sm btn-warning" (click)="toggleAdStatus(ad, 'paused')">Pause</button>
                      } @else if (ad.status === 'paused') {
                        <button class="btn-sm btn-success" (click)="toggleAdStatus(ad, 'active')">Resume</button>
                      }
                      <button class="btn-sm" (click)="topUpBudget(ad)">Top Up</button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Analytics Tab -->
        @if (activeTab() === 'analytics' && selectedAd()) {
          <div class="analytics-panel">
            <button class="back-btn" (click)="selectedAd.set(null); activeTab.set('ads')">← Back</button>
            <h2>{{ selectedAd()!.title }} — Analytics</h2>

            @if (analytics()) {
              <div class="analytics-kpis">
                <div class="kpi">
                  <span class="kpi-value">{{ analytics()!.totalImpressions }}</span>
                  <span class="kpi-label">Total Impressions</span>
                </div>
                <div class="kpi">
                  <span class="kpi-value">{{ analytics()!.uniqueStudents }}</span>
                  <span class="kpi-label">Unique Students</span>
                </div>
                <div class="kpi">
                  <span class="kpi-value">{{ analytics()!.avgCompletionRate | number:'1.1-1' }}%</span>
                  <span class="kpi-label">Avg Completion</span>
                </div>
                <div class="kpi">
                  <span class="kpi-value neuron">{{ analytics()!.totalSpent | number:'1.2-2' }} ⚡</span>
                  <span class="kpi-label">Total Spent</span>
                </div>
                <div class="kpi warning">
                  <span class="kpi-value">{{ analytics()!.fraud.fraudulent }}</span>
                  <span class="kpi-label">Blocked (Fraud)</span>
                </div>
              </div>

              <!-- Daily Chart (simple bar) -->
              <div class="daily-chart">
                <h3>Daily Spend (Last 30 Days)</h3>
                <div class="chart-bars">
                  @for (day of analytics()!.dailyBreakdown; track day._id) {
                    <div class="chart-bar-wrap" [title]="day._id + ': ' + day.spend + ' ⚡'">
                      <div class="chart-bar"
                        [style.height.%]="getBarHeight(day.spend)"
                        [style.background]="'var(--primary)'">
                      </div>
                      <span class="chart-label">{{ day._id | slice:8:10 }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Create Ad Tab -->
        @if (activeTab() === 'create') {
          <div class="create-ad-form">
            <h2>Upload New Advertisement</h2>
            <form [formGroup]="adForm" (ngSubmit)="submitAd()">

              <div class="form-grid">
                <div class="form-group">
                  <label>Ad Title *</label>
                  <input type="text" formControlName="title" placeholder="e.g. Learn Python in 30 Days">
                </div>
                <div class="form-group">
                  <label>Category *</label>
                  <select formControlName="category">
                    <option value="">Select Category</option>
                    @for (cat of categories; track $index) {
                    <option [value]="cat">{{ cat }}</option>
                    }
                  </select>
                </div>

                <!-- Media Upload -->
                <div class="form-group full-width">
                  <label>Ad Media (Image or Video) *</label>
                  <div class="upload-area" [class.has-file]="uploadedMediaUrl()" [class.uploading]="isUploading()">
                    @if (!uploadedMediaUrl() && !isUploading()) {
                      <label class="upload-label" for="mediaFileInput">
                        <span class="upload-icon">&#8679;</span>
                        <span>Click to upload image or video</span>
                        <small>JPG, PNG, WebP, MP4, WebM &bull; Max 20 MB</small>
                      </label>
                      <input id="mediaFileInput" type="file" class="file-input"
                        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                        (change)="onMediaSelected($event)">
                    } @else if (isUploading()) {
                      <div class="upload-progress">
                        <div class="spinner"></div>
                        <span>Uploading...</span>
                      </div>
                    } @else {
                      <div class="upload-preview">
                        @if (uploadedAdType() === 'video') {
                          <video [src]="uploadedMediaUrl()!" controls class="media-preview"></video>
                        } @else {
                          <img [src]="uploadedMediaUrl()!" alt="Ad preview" class="media-preview">
                        }
                        <button type="button" class="remove-media" (click)="removeMedia()">&#x2715; Remove</button>
                      </div>
                    }
                  </div>
                  @if (uploadError()) {
                    <small class="error-text">{{ uploadError() }}</small>
                  }
                </div>

                <div class="form-group full-width">
                  <label>Click-Through URL</label>
                  <input type="url" formControlName="clickThroughUrl"
                    placeholder="https://yoursite.com/landing-page">
                  <small>Users will be directed here when they tap/click the ad</small>
                </div>

                <div class="form-group">
                  <label>Duration (seconds) *</label>
                  <input type="number" formControlName="duration" min="10" max="60" step="10">
                  <small>Min 10s &bull; Max 60s &bull; Must be a multiple of 10</small>
                </div>
                <div class="form-group">
                  <label>Rate per Second per Student (⚡) *</label>
                  <input type="number" formControlName="ratePerSecondPerStudent" min="0.001" step="0.001">
                  <small>Estimated cost: {{ estimatedCost() }} ⚡ for 100 students watching full ad</small>
                </div>
                <div class="form-group">
                  <label>Total Budget (⚡ Neurons) *</label>
                  <input type="number" formControlName="totalBudget" min="1">
                </div>
                <div class="form-group">
                  <label>Expiry Date *</label>
                  <input type="date" formControlName="expiryDate" [min]="today">
                </div>
                <div class="form-group full-width">
                  <label>Description</label>
                  <textarea formControlName="description" rows="3" placeholder="Brief description of your ad"></textarea>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn-outline" (click)="activeTab.set('ads')">Cancel</button>
                <button type="submit" class="btn-primary"
                  [disabled]="adForm.invalid || isSubmitting() || isUploading() || !uploadedMediaUrl()">
                  {{ isSubmitting() ? 'Submitting...' : 'Submit for Review' }}
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Deposit Modal -->
        @if (showDepositModal()) {
          <div class="modal-overlay" (click)="showDepositModal.set(false)">
            <div class="modal" (click)="$event.stopPropagation()">
              <h3>Top Up Neuron Wallet</h3>
              <p>1 ⚡ Neuron = 1 INR</p>
              <div class="form-group">
                <label>Amount (INR)</label>
                <input type="number" [(ngModel)]="depositAmount" min="100">
              </div>
              <div class="modal-actions">
                <button class="btn-outline" (click)="showDepositModal.set(false)">Cancel</button>
                <button class="btn-primary" (click)="processDeposit()">Pay ₹{{ depositAmount }}</button>
              </div>
            </div>
          </div>
        }

      </div>
  `,
  styles: [`
    .advertiser-dashboard { padding: 24px 0; max-width: 1200px; margin: 0 auto; }
    .alert { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; font-weight: 500; }
    .alert-error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .alert-success { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
    .alert-close { background: none; border: none; cursor: pointer; font-size: 16px; line-height: 1; opacity: 0.6; color: inherit; padding: 0 0 0 12px; }
    .alert-close:hover { opacity: 1; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title { font-size: 28px; font-weight: 700; color: var(--text-primary, #1a1a1a); }
    .wallet-summary-bar { display: flex; gap: 24px; align-items: center; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 16px 24px; border-radius: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .wallet-stat { display: flex; flex-direction: column; }
    .stat-label { font-size: 12px; opacity: 0.7; }
    .stat-value { font-size: 20px; font-weight: 700; }
    .stat-value.neuron { color: #ffd700; }
    .tab-nav { display: flex; gap: 4px; border-bottom: 2px solid #e5e7eb; margin-bottom: 24px; }
    .tab-nav button { padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: 15px; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -2px; }
    .tab-nav button.active { color: var(--primary, #4f46e5); border-bottom-color: var(--primary, #4f46e5); font-weight: 600; }
    .status-filter { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .status-filter button { padding: 6px 14px; border-radius: 20px; border: 1px solid #d1d5db; cursor: pointer; font-size: 13px; }
    .status-filter button.active { background: var(--primary, #4f46e5); color: white; border-color: transparent; }
    .ad-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .ad-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
    .ad-card.active { border-color: #10b981; }
    .ad-card-header { display: flex; gap: 12px; margin-bottom: 12px; }
    .ad-thumb { width: 80px; height: 60px; object-fit: cover; border-radius: 6px; }
    .ad-meta h3 { font-size: 15px; font-weight: 600; margin: 0 0 6px; }
    .category-badge, .status-badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; margin-right: 4px; }
    .category-badge { background: #ede9fe; color: #7c3aed; }
    .status-active { background: #d1fae5; color: #065f46; }
    .status-paused { background: #fef3c7; color: #92400e; }
    .status-exhausted { background: #fee2e2; color: #991b1b; }
    .status-pending_review { background: #dbeafe; color: #1e40af; }
    .ad-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px; }
    .stat { text-align: center; }
    .stat .label { display: block; font-size: 11px; color: #9ca3af; }
    .stat .value { display: block; font-weight: 600; font-size: 14px; }
    .budget-bar { height: 6px; background: #e5e7eb; border-radius: 3px; margin-bottom: 12px; overflow: hidden; }
    .budget-fill { height: 100%; background: linear-gradient(90deg, #4f46e5, #10b981); border-radius: 3px; transition: width 0.3s; }
    .ad-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-sm { padding: 6px 12px; border-radius: 6px; border: 1px solid #d1d5db; background: white; cursor: pointer; font-size: 13px; color:#6b7280; }
    .btn-sm:hover { background: #f3f4f6; }
    .btn-warning { border-color: #f59e0b; color: #92400e; }
    .btn-success { border-color: #10b981; color: #065f46; }
    .analytics-kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi { background: white; border-radius: 10px; padding: 16px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .kpi-value { display: block; font-size: 24px; font-weight: 700; }
    .kpi-label { font-size: 12px; color: #6b7280; }
    .kpi.warning .kpi-value { color: #ef4444; }
    .daily-chart { background: white; border-radius: 12px; padding: 20px; }
    .chart-bars { display: flex; gap: 4px; align-items: flex-end; height: 120px; padding-top: 10px; }
    .chart-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .chart-bar { width: 100%; min-height: 2px; border-radius: 3px 3px 0 0; transition: height 0.3s; }
    .chart-label { font-size: 10px; color: #9ca3af; }
    .upload-area { border: 2px dashed #d1d5db; border-radius: 10px; min-height: 140px; display: flex; align-items: center; justify-content: center; background: white; position: relative; transition: border-color 0.2s; }
    .upload-area.has-file { border-style: solid; border-color: #10b981; }
    .upload-area.uploading { border-color: #4f46e5; }
    .upload-label { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; padding: 24px; text-align: center; color: #6b7280; width: 100%; }
    .upload-icon { font-size: 32px; color: #9ca3af; }
    .upload-label small { color: #9ca3af; font-size: 12px; }
    .file-input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
    .upload-progress { display: flex; flex-direction: column; align-items: center; gap: 10px; color: #4f46e5; }
    .spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .upload-preview { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 12px; width: 100%; }
    .media-preview { max-height: 160px; max-width: 100%; border-radius: 8px; object-fit: contain; }
    .remove-media { background: none; border: 1px solid #ef4444; color: #ef4444; border-radius: 6px; padding: 4px 12px; cursor: pointer; font-size: 13px; }
    .error-text { color: #ef4444; font-size: 12px; }
    .create-ad-form { background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%); border-radius: 16px; padding: 32px; box-shadow: 0 4px 24px rgba(79,70,229,0.08); border: 1px solid rgba(79,70,229,0.1); position: relative; overflow: hidden; }
    .create-ad-form::before { content: ''; position: absolute; top: -60px; right: -60px; width: 220px; height: 220px; background: radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%); pointer-events: none; }
    .create-ad-form::after { content: ''; position: absolute; bottom: -40px; left: -40px; width: 160px; height: 160px; background: radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%); pointer-events: none; }
    .create-ad-form h2 { background: linear-gradient(135deg, #4f46e5, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 24px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full-width { grid-column: 1/-1; }
    .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
    .form-group input, .form-group select, .form-group textarea { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
    .form-group small { color: #6b7280; font-size: 12px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; }
    .btn-primary { padding: 10px 24px; background: var(--primary, #4f46e5); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-outline { padding: 10px 24px; background: white; color: var(--primary, #4f46e5); border: 1px solid var(--primary, #4f46e5); border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-outline-sm { padding: 6px 14px; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; cursor: pointer; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 16px; padding: 28px; width: 400px; }
    .modal h3 { margin: 0 0 16px; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
    .back-btn { background: none; border: none; cursor: pointer; color: var(--primary, #4f46e5); font-size: 15px; margin-bottom: 16px; }
    .empty-state { text-align: center; padding: 40px; color: #9ca3af; }
    .loading-spinner { text-align: center; padding: 40px; }
    .neuron { color: #ffd700; }
  `]
})
export class AdvertiserDashboardComponent implements OnInit {
  private adService = inject(AdPlatformService);
  private razorpayService = inject(RazorpayService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  activeTab = signal<'ads' | 'analytics' | 'create'>('ads');
  ads = signal<Advertisement[]>([]);
  wallet = signal<any>(null);
  selectedAd = signal<Advertisement | null>(null);
  analytics = signal<any>(null);
  isLoading = signal(false);
  isSubmitting = signal(false);
  isUploading = signal(false);
  uploadedMediaUrl = signal<string | null>(null);
  uploadedAdType = signal<'image' | 'video' | null>(null);
  uploadError = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showDepositModal = signal(false);
  selectedStatus = signal('all');
  depositAmount = 1000;
  today = new Date().toISOString().split('T')[0];

  private _notifyTimer: any;
  private notify(type: 'error' | 'success', msg: string) {
    clearTimeout(this._notifyTimer);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (type === 'error') this.errorMessage.set(msg);
    else this.successMessage.set(msg);
    this._notifyTimer = setTimeout(() => {
      this.errorMessage.set(null);
      this.successMessage.set(null);
    }, 5000);
  }

  private serverError(err: any, fallback: string): string {
    return err?.error?.message || fallback;
  }

  statusFilters = ['all', 'active', 'paused', 'pending_review', 'exhausted', 'expired'];
  categories = ['Technology', 'Finance', 'Health', 'Education', 'Entertainment', 'Fitness', 'Travel', 'Food', 'Fashion', 'Sports','Other'];

  adForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    category: ['', Validators.required],
    clickThroughUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
    duration: [30, [Validators.required, Validators.min(10), Validators.max(60)]],
    ratePerSecondPerStudent: [0.01, [Validators.required, Validators.min(0.001)]],
    totalBudget: [1000, [Validators.required, Validators.min(1)]],
    expiryDate: ['', Validators.required],
    description: ['']
  });

  ngOnInit() {
    if (!this.isBrowser || !this.authService.isLoggedIn()) return;
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading.set(true);
    this.adService.getAdvertiserDashboard().subscribe({
      next: (res) => {
        this.wallet.set(res.data.wallet);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notify('error', this.serverError(err, 'Could not load your dashboard. Please refresh the page.'));
      }
    });
    this.loadAds();
  }

  loadAds(status?: string) {
    this.isLoading.set(true);
    const params = status && status !== 'all' ? { status } : {};
    this.adService.getMyAds(params).subscribe({
      next: (res) => {
        this.ads.set(res.data.ads || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notify('error', this.serverError(err, 'Could not load your ads. Please try again.'));
      }
    });
  }

  filterByStatus(status: string) {
    this.selectedStatus.set(status);
    this.loadAds(status);
  }

  viewAnalytics(ad: Advertisement) {
    this.selectedAd.set(ad);
    this.activeTab.set('analytics');
    this.adService.getAdAnalytics(ad._id).subscribe({
      next: (res) => this.analytics.set(res.data.analytics),
      error: (err) => this.notify('error', this.serverError(err, 'Could not load analytics for this ad. Please try again.'))
    });
  }

  toggleAdStatus(ad: Advertisement, status: 'active' | 'paused') {
    this.adService.updateAd(ad._id, { status }).subscribe({
      next: () => this.loadAds(this.selectedStatus()),
      error: (err) => this.notify('error', this.serverError(err,
        `Could not ${status === 'active' ? 'resume' : 'pause'} "${ad.title}". Please try again.`))
    });
  }

  topUpBudget(ad: Advertisement) {
    const input = prompt('Enter additional budget (Neurons):');
    if (!input) return;
    const amount = Number(input);
    if (isNaN(amount) || amount <= 0) {
      this.notify('error', 'Please enter a valid amount greater than 0.');
      return;
    }
    this.adService.updateAd(ad._id, { additionalBudget: amount }).subscribe({
      next: () => {
        this.notify('success', `Budget topped up by ${amount} Neurons.`);
        this.loadAds();
      },
      error: (err) => this.notify('error', this.serverError(err,
        'Budget top-up failed. Make sure your wallet has enough balance and try again.'))
    });
  }

  onMediaSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadError.set(null);
    this.isUploading.set(true);

    this.adService.uploadAdMedia(file).subscribe({
      next: (res) => {
        this.uploadedMediaUrl.set(res.data.mediaUrl);
        this.uploadedAdType.set(res.data.adType);
        this.isUploading.set(false);
      },
      error: (err) => {
        const status = err?.status;
        let msg = 'Upload failed. Please try again.';
        if (status === 413) msg = 'File is too large. Maximum allowed size is 20 MB.';
        else if (status === 400) msg = this.serverError(err, 'Invalid file type. Please upload an image or video.');
        else if (status === 0)  msg = 'Upload failed. Check your internet connection and try again.';
        this.uploadError.set(msg);
        this.isUploading.set(false);
        input.value = '';
      }
    });
  }

  removeMedia() {
    this.uploadedMediaUrl.set(null);
    this.uploadedAdType.set(null);
    this.uploadError.set(null);
  }

  submitAd() {
    if (this.adForm.invalid || !this.uploadedMediaUrl() || !this.uploadedAdType()) return;
    this.isSubmitting.set(true);

    const payload = {
      ...this.adForm.value,
      mediaUrl: this.uploadedMediaUrl(),
      adType: this.uploadedAdType(),
      clickThroughUrl: this.adForm.value.clickThroughUrl || undefined
    };

    this.adService.createAd(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.adForm.reset();
        this.removeMedia();
        this.activeTab.set('ads');
        this.loadAds();
        this.notify('success', 'Your ad has been submitted for review. We\'ll activate it once approved.');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.notify('error', this.serverError(err, 'Could not submit your ad. Please check your details and try again.'));
      }
    });
  }

  openDepositModal() {
    this.showDepositModal.set(true);
  }

  processDeposit() {
    const amount = this.depositAmount;
    if (!amount || amount <= 0) {
      this.notify('error', 'Please enter a valid amount to top up.');
      return;
    }
    this.razorpayService.createOrder(amount).subscribe({
      next: order => {
        this.razorpayService.openCheckout(order, (response: any) => {
          this.adService.depositToWallet(amount, response.razorpay_payment_id).subscribe({
            next: () => {
              this.showDepositModal.set(false);
              this.loadDashboard();
              this.notify('success', `${amount} Neurons added to your wallet.`);
            },
            error: (err) => {
              this.showDepositModal.set(false);
              this.notify('error', this.serverError(err, 'Payment was received but wallet credit failed. Please contact support.'));
            }
          });
        });
      },
      error: (err) => this.notify('error', this.serverError(err, 'Could not initiate payment. Please try again.'))
    });
  }

  estimatedCost(): string {
    const rate = this.adForm.get('ratePerSecondPerStudent')?.value || 0;
    const duration = this.adForm.get('duration')?.value || 0;
    return (rate * duration * 100).toFixed(2);
  }

  getBarHeight(spend: number): number {
    if (!this.analytics()?.dailyBreakdown?.length) return 0;
    const max = Math.max(...this.analytics()!.dailyBreakdown.map((d: any) => d.spend));
    return max > 0 ? (spend / max) * 100 : 0;
  }
}
