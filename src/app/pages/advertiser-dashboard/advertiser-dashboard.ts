import { Component, inject, signal, computed, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule, DecimalPipe, TitleCasePipe, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AdPlatformService, Advertisement, AdAnalytics } from '../../services/ad-platform.service';
import { RazorpayService } from '../../services/razorpay.service';
import { AuthService } from '../../services/auth.service';
import { UcrsService } from '../../services/ucrs.service';

type TabId = 'campaigns' | 'create' | 'analytics' | 'schedule';

interface CampaignDraft {
  title:                string;
  description:          string;
  category:             string;
  duration:             number;
  adType:               'image' | 'video' | null;
  mediaUrl:             string;
  clickThroughUrl:      string;
  ratePerSecondPerStudent: number;
  totalBudget:          number;
  expiryDate:           string;
  mandatoryCriteria: {
    categories:    string[];
    ageGroup:      string;
    minRatePerSecond: number;
  };
  optionalCriteria: {
    engagementScoreTarget: number;
    preferredLanguage:     string;
    interestTags:          string[];
  };
}

@Component({
  selector: 'app-advertiser-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DecimalPipe, TitleCasePipe, DatePipe, SlicePipe],
  templateUrl: './advertiser-dashboard.html',
  styleUrl: './advertiser-dashboard.scss',
})
export class AdvertiserDashboardComponent implements OnInit {
  private adService     = inject(AdPlatformService);
  private razorpay      = inject(RazorpayService);
  private authService   = inject(AuthService);
  private ucrs          = inject(UcrsService);
  private platformId    = inject(PLATFORM_ID);
  private isBrowser     = isPlatformBrowser(this.platformId);

  // ── View state ─────────────────────────────────────────────────────────────
  activeTab    = signal<TabId>('campaigns');
  wizardStep   = signal<1 | 2 | 3 | 4>(1);
  selectedStatus = signal('all');

  // ── Data ───────────────────────────────────────────────────────────────────
  ads          = signal<Advertisement[]>([]);
  wallet       = signal<any>(null);
  selectedAd   = signal<Advertisement | null>(null);
  analytics    = signal<AdAnalytics | null>(null);

  // ── Loading flags ──────────────────────────────────────────────────────────
  isLoading          = signal(false);
  isLoadingAnalytics = signal(false);
  isCommitting       = signal(false);
  isSubmitting       = signal(false);
  commitStage        = signal('Uploading…');

  // ── Media / UCE state ──────────────────────────────────────────────────────
  committedCid = signal<string | null>(null);
  uploadError  = signal<string | null>(null);

  // ── Toast ──────────────────────────────────────────────────────────────────
  toast = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  // ── Deposit modal ──────────────────────────────────────────────────────────
  showDepositModal = signal(false);
  depositAmount    = 1000;
  today            = new Date().toISOString().split('T')[0];

  // ── Static config ──────────────────────────────────────────────────────────
  readonly tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'campaigns', label: 'Campaigns', icon: '◈' },
    { id: 'create',    label: 'Create',    icon: '+' },
    { id: 'analytics', label: 'Analytics', icon: '↗' },
    { id: 'schedule',  label: 'Schedule',  icon: '⧖' },
  ];

  readonly statusFilters = [
    { value: 'all',            label: 'All' },
    { value: 'active',         label: 'Active' },
    { value: 'paused',         label: 'Paused' },
    { value: 'pending_review', label: 'In Review' },
    { value: 'exhausted',      label: 'Exhausted' },
    { value: 'expired',        label: 'Expired' },
  ];

  readonly categories = [
    'Technology', 'Finance', 'Health', 'Education', 'Entertainment',
    'Fitness', 'Travel', 'Food', 'Fashion', 'Sports', 'Other',
  ];

  readonly durations = [10, 20, 30, 40, 50, 60];

  readonly wizardSteps = [
    { n: 1, label: 'Content' },
    { n: 2, label: 'Targeting' },
    { n: 3, label: 'Budget' },
    { n: 4, label: 'Review' },
  ] as { n: 1 | 2 | 3 | 4; label: string }[];

  // ── Campaign draft ─────────────────────────────────────────────────────────
  draft: CampaignDraft = this._freshDraft();

  // ── Computed quick-stats ───────────────────────────────────────────────────
  activeCampaigns  = computed(() => this.ads().filter(a => a.status === 'active').length);
  totalImpressions = computed(() => this.ads().reduce((s, a) => s + a.totalImpressions, 0));
  totalSpent       = computed(() => this.ads().reduce((s, a) => s + a.totalSpent, 0));
  avgCompletion    = computed(() => {
    const active = this.ads().filter(a => a.status === 'active');
    if (!active.length) return 0;
    return active.reduce((s, a) => s + ((a as any).avgCompletionRate ?? 0), 0) / active.length;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    if (!this.isBrowser || !this.authService.isLoggedIn()) return;
    this._loadDashboard();
  }

  // ── Tab navigation ─────────────────────────────────────────────────────────
  setTab(tab: TabId) {
    this.activeTab.set(tab);
    if (tab === 'create') { this.wizardStep.set(1); this.draft = this._freshDraft(); this.committedCid.set(null); }
    if (tab === 'analytics' && !this.selectedAd()) { /* just navigate */ }
  }

  // ── Status filter ──────────────────────────────────────────────────────────
  filterByStatus(status: string) {
    this.selectedStatus.set(status);
    this._loadAds(status);
  }

  // ── Analytics ──────────────────────────────────────────────────────────────
  viewAnalytics(ad: Advertisement) {
    this.selectedAd.set(ad);
    this.activeTab.set('analytics');
    this.isLoadingAnalytics.set(true);
    this.adService.getAdAnalytics(ad._id).subscribe({
      next: (res) => { this.analytics.set(res.data.analytics); this.isLoadingAnalytics.set(false); },
      error: (err) => { this.isLoadingAnalytics.set(false); this._toast('error', this._msg(err, 'Could not load analytics')); },
    });
  }

  toggleAdStatus(ad: Advertisement, status: 'active' | 'paused') {
    this.adService.updateAd(ad._id, { status }).subscribe({
      next: () => this._loadAds(this.selectedStatus()),
      error: (err) => this._toast('error', this._msg(err, `Could not ${status === 'active' ? 'resume' : 'pause'} campaign`)),
    });
  }

  topUpBudget(ad: Advertisement) {
    const input = prompt('Additional budget (₹):');
    if (!input) return;
    const amount = Number(input);
    if (isNaN(amount) || amount <= 0) { this._toast('error', 'Enter a valid amount'); return; }
    this.adService.updateAd(ad._id, { additionalBudget: amount }).subscribe({
      next: () => { this._toast('success', `Budget topped up by ₹${amount}`); this._loadAds(); },
      error: (err) => this._toast('error', this._msg(err, 'Top-up failed')),
    });
  }

  // ── Wizard step 1: media upload + UCE commit ──────────────────────────────

  onMediaSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploadError.set(null);
    this.isCommitting.set(true);
    this.commitStage.set('Uploading media…');

    // Step A: upload media to get mediaUrl
    this.adService.uploadAdMedia(file).subscribe({
      next: (res) => {
        this.draft.mediaUrl = res.data.mediaUrl;
        this.draft.adType   = res.data.adType;
        this.commitStage.set('Processing through UCE…');

        // Step B: commit content through UCE to get CID
        this.ucrs.commit({
          source:      'advertiser',
          contentType: 'ad',
          payload: {
            title:    this.draft.title || file.name,
            subtitle: this.draft.description,
            body:     this.draft.description,
            mediaUrl: this.draft.mediaUrl,
            keywords: [this.draft.category.toLowerCase()].filter(Boolean),
            category: this.draft.category,
          },
        }).subscribe({
          next: (commit) => {
            this.committedCid.set(commit.cid);
            this.isCommitting.set(false);
          },
          error: (err) => {
            // UCE failed — still allow submission, CID will be null
            this.committedCid.set(null);
            this.isCommitting.set(false);
            console.warn('[UCE] Commit failed, continuing without CID:', err);
          },
        });
      },
      error: (err) => {
        const status = err?.status;
        let msg = 'Upload failed. Please try again.';
        if (status === 413) msg = 'File too large (max 20 MB).';
        else if (status === 400) msg = 'Invalid file type.';
        else if (status === 0)   msg = 'Network error. Check connection.';
        this.uploadError.set(msg);
        this.isCommitting.set(false);
      },
    });
  }

  resetMedia() {
    this.draft.mediaUrl = '';
    this.draft.adType   = null;
    this.committedCid.set(null);
    this.uploadError.set(null);
  }

  canStep1(): boolean {
    return !!this.draft.title && !!this.draft.category && !!this.draft.mediaUrl && !this.isCommitting();
  }

  // ── Wizard step 2: targeting ───────────────────────────────────────────────

  toggleCategory(cat: string) {
    const list = this.draft.mandatoryCriteria.categories;
    const idx  = list.indexOf(cat);
    if (idx === -1) list.push(cat);
    else list.splice(idx, 1);
  }

  setInterestTags(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.draft.optionalCriteria.interestTags = val.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  }

  // ── Wizard step 3: budget ──────────────────────────────────────────────────

  updateCostPreview() { /* signals auto-update via estimatedCost() */ }

  estimatedCost(): number {
    return this.draft.ratePerSecondPerStudent * this.draft.duration * 100;
  }

  budgetDuration(): string {
    const cost = this.estimatedCost();
    if (!cost || !this.draft.totalBudget) return '—';
    return Math.floor(this.draft.totalBudget / cost).toLocaleString();
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  submitCampaign() {
    if (!this.draft.mediaUrl || !this.draft.adType) return;
    this.isSubmitting.set(true);

    const payload = {
      title:                   this.draft.title,
      description:             this.draft.description,
      category:                this.draft.category,
      adType:                  this.draft.adType,
      mediaUrl:                this.draft.mediaUrl,
      duration:                this.draft.duration,
      clickThroughUrl:         this.draft.clickThroughUrl || undefined,
      ratePerSecondPerStudent: this.draft.ratePerSecondPerStudent,
      totalBudget:             this.draft.totalBudget,
      expiryDate:              this.draft.expiryDate,
      contentCid:              this.committedCid() || undefined,
      mandatoryCriteria:       this.draft.mandatoryCriteria,
      optionalCriteria:        this.draft.optionalCriteria,
    };

    this.adService.createAd(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.draft = this._freshDraft();
        this.committedCid.set(null);
        this.setTab('campaigns');
        this._loadAds();
        this._toast('success', 'Campaign submitted for review');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this._toast('error', this._msg(err, 'Submission failed'));
      },
    });
  }

  // ── Deposit ────────────────────────────────────────────────────────────────

  openDepositModal() { this.showDepositModal.set(true); }

  processDeposit() {
    if (!this.depositAmount || this.depositAmount <= 0) { this._toast('error', 'Enter a valid amount'); return; }
    this.razorpay.createOrder(this.depositAmount).subscribe({
      next: order => {
        this.razorpay.openCheckout(order, (response: any) => {
          this.adService.depositToWallet(this.depositAmount, response.razorpay_payment_id).subscribe({
            next: () => { this.showDepositModal.set(false); this._loadDashboard(); this._toast('success', `₹${this.depositAmount} added to wallet`); },
            error: (err) => { this.showDepositModal.set(false); this._toast('error', this._msg(err, 'Wallet credit failed. Contact support')); },
          });
        });
      },
      error: (err) => this._toast('error', this._msg(err, 'Could not initiate payment')),
    });
  }

  // ── Utility: CID copy ──────────────────────────────────────────────────────

  copyCid(cid: string) {
    if (!this.isBrowser) return;
    navigator.clipboard.writeText(cid).then(() => this._toast('success', 'CID copied'));
  }

  // ── Utility: budget ring ───────────────────────────────────────────────────

  budgetPct(ad: Advertisement): number {
    if (!ad.totalBudget) return 0;
    return Math.round((ad.remainingBudget / ad.totalBudget) * 100);
  }

  budgetDash(ad: Advertisement): string {
    const pct = this.budgetPct(ad) / 100;
    const r   = 20;
    const circ = 2 * Math.PI * r; // ≈ 125.66
    return `${circ * pct} ${circ * (1 - pct)}`;
  }

  budgetRingColor(ad: Advertisement): string {
    const pct = this.budgetPct(ad);
    if (pct > 50) return '#10b981';
    if (pct > 20) return '#f59e0b';
    return '#ef4444';
  }

  getBarHeight(spend: number): number {
    const breakdown = this.analytics()?.dailyBreakdown;
    if (!breakdown?.length) return 0;
    const max = Math.max(...breakdown.map(d => d.spend));
    return max > 0 ? (spend / max) * 100 : 0;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      active: 'Active', paused: 'Paused', pending_review: 'In Review',
      exhausted: 'Exhausted', expired: 'Expired', rejected: 'Rejected',
    };
    return map[status] ?? status;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _freshDraft(): CampaignDraft {
    return {
      title: '', description: '', category: '', duration: 30,
      adType: null, mediaUrl: '', clickThroughUrl: '',
      ratePerSecondPerStudent: 0.01, totalBudget: 1000,
      expiryDate: '',
      mandatoryCriteria: { categories: [], ageGroup: 'all', minRatePerSecond: 0 },
      optionalCriteria:  { engagementScoreTarget: 50, preferredLanguage: '', interestTags: [] },
    };
  }

  private _loadDashboard() {
    this.adService.getAdvertiserDashboard().subscribe({
      next: (res) => this.wallet.set(res.data.wallet),
      error: (err) => this._toast('error', this._msg(err, 'Could not load dashboard')),
    });
    this._loadAds();
  }

  private _loadAds(status?: string) {
    this.isLoading.set(true);
    const params = status && status !== 'all' ? { status } : {};
    this.adService.getMyAds(params).subscribe({
      next: (res) => { this.ads.set(res.data.ads || []); this.isLoading.set(false); },
      error: (err) => { this.isLoading.set(false); this._toast('error', this._msg(err, 'Could not load campaigns')); },
    });
  }

  private _toast(type: 'success' | 'error', message: string) {
    this.toast.set({ type, message });
    setTimeout(() => this.toast.set(null), 4500);
  }

  private _msg(err: any, fallback: string): string {
    return err?.error?.message || fallback;
  }
}
