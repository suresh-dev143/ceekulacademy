import { Component, inject, signal, OnInit, Input, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdPlatformService, NeuronWallet, Settlement } from '../../services/ad-platform.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-neuron-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="neuron-wallet">

      <!-- Ad Revenue Credits Card
           ──────────────────────────────────────────────────────────────
           IMPORTANT: These are ad-revenue credits representing real INR
           earned through the advertising platform. They are processed and
           settled via Razorpay (an external, licensed payment gateway)
           and are ENTIRELY SEPARATE from Ceekul's non-monetary
           participation Neurons tracked in the Neuron Hub (/neurons).
           ─────────────────────────────────────────────────────────────── -->
      <div class="wallet-card">
        <div class="wallet-header">
          <span class="wallet-icon">📊</span>
          <div>
            <h3>Ad Revenue Credits</h3>
            <p class="wallet-sub">INR earnings from the ad platform · Settled via Razorpay</p>
          </div>
        </div>
        @if (wallet()) {
          <div class="wallet-balances">
            <div class="balance-item main">
              <span class="balance-label">Available (INR)</span>
              <span class="balance-value">₹{{ wallet()!.balance | number:'1.2-2' }}</span>
            </div>
            <div class="balance-item">
              <span class="balance-label">Pending (INR)</span>
              <span class="balance-value pending">₹{{ wallet()!.pendingBalance | number:'1.2-2' }}</span>
            </div>
            @if (userRole === 'advertiser') {
              <div class="balance-item">
                <span class="balance-label">Locked (INR)</span>
                <span class="balance-value locked">₹{{ wallet()!.lockedBalance | number:'1.2-2' }}</span>
              </div>
            }
          </div>
          <div class="wallet-total">
            Total Earned: <strong>₹{{ wallet()!.totalEarned | number:'1.2-2' }} INR</strong>
          </div>
          @if (!wallet()!.bankAccountVerified) {
            <div class="bank-alert">
              ⚠️ Link your bank account to receive monthly payouts
              <button class="link-btn" (click)="showBankForm.set(true)">Link Now</button>
            </div>
          }
        } @else {
          <div class="loading">Loading wallet...</div>
        }
      </div>

      <!-- Earnings Chart -->
      <div class="earnings-section">
        <div class="section-header">
          <h4>Earnings</h4>
          <select [(ngModel)]="earningsPeriod" (change)="loadEarnings()">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
        @if (earnings()) {
          <div class="earnings-kpis">
            <div class="ekpi">
              <span>₹{{ earnings()!.lifetime.totalEarnings | number:'1.2-2' }}</span>
              <small>Lifetime (INR)</small>
            </div>
            <div class="ekpi">
              <span>₹{{ getPeriodEarnings() | number:'1.2-2' }}</span>
              <small>This Period (INR)</small>
            </div>
          </div>
          <div class="mini-chart">
            @for (day of earnings()!.daily; track day._id) {
              <div class="mini-bar-wrap" [title]="day._id + ': ' + day.earnings + ' ⚡'">
                <div class="mini-bar" [style.height.%]="getMiniBarHeight(day.earnings)"></div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Recent Transactions -->
      <div class="transactions-section">
        <h4>Recent Transactions</h4>
        @if (transactions().length === 0) {
          <p class="no-data">No transactions yet</p>
        } @else {
          <div class="txn-list">
            @for (txn of transactions(); track txn._id) {
              <div class="txn-row">
                <div class="txn-type-icon" [class]="getTxnClass(txn.type)">
                  {{ getTxnIcon(txn.type) }}
                </div>
                <div class="txn-details">
                  <span class="txn-desc">{{ txn.description }}</span>
                  <span class="txn-date">{{ txn.createdAt | date:'MMM d, h:mm a' }}</span>
                </div>
                <div class="txn-amount" [class.credit]="isCredit(txn)" [class.debit]="!isCredit(txn)">
                  {{ isCredit(txn) ? '+' : '-' }}₹{{ txn.amount | number:'1.4-4' }}
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Settlements -->
      <div class="settlements-section">
        <h4>Monthly Settlements (via Razorpay)</h4>
        @for (s of settlements(); track s._id) {
          <div class="settlement-row">
            <div class="settlement-period">{{ getMonthName(s.month) }} {{ s.year }}</div>
            <div class="settlement-amount">₹{{ s.netAmount | number:'1.2-2' }}</div>
            <span class="settlement-status" [class]="'status-' + s.status">{{ s.status }}</span>
          </div>
        }
      </div>

      <!-- Bank Account Form -->
      @if (showBankForm()) {
        <div class="modal-overlay" (click)="showBankForm.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Link Bank Account</h3>
            <div class="form-group">
              <label>Account Holder Name</label>
              <input [(ngModel)]="bankForm.accountHolderName" placeholder="As per bank records">
            </div>
            <div class="form-group">
              <label>Account Number</label>
              <input [(ngModel)]="bankForm.accountNumber" placeholder="Enter account number">
            </div>
            <div class="form-group">
              <label>IFSC Code</label>
              <input [(ngModel)]="bankForm.ifscCode" placeholder="e.g. SBIN0001234">
            </div>
            <div class="form-divider">OR</div>
            <div class="form-group">
              <label>UPI ID</label>
              <input [(ngModel)]="bankForm.upiId" placeholder="yourname@upi">
            </div>
            <div class="modal-actions">
              <button class="btn-outline" (click)="showBankForm.set(false)">Cancel</button>
              <button class="btn-primary" (click)="linkBankAccount()">Save</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .neuron-wallet { display: flex; flex-direction: column; gap: 20px; }
    .wallet-card { background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; border-radius: 16px; padding: 24px; }
    .wallet-header { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; }
    .wallet-icon { font-size: 32px; }
    .wallet-header h3 { margin: 0; font-size: 20px; }
    .wallet-sub { margin: 0; font-size: 13px; opacity: 0.7; }
    .wallet-balances { display: flex; gap: 20px; margin-bottom: 12px; flex-wrap: wrap; }
    .balance-item { display: flex; flex-direction: column; }
    .balance-label { font-size: 12px; opacity: 0.7; }
    .balance-value { font-size: 22px; font-weight: 700; color: #ffd700; }
    .balance-value.pending { color: #60a5fa; }
    .balance-value.locked { color: #f472b6; }
    .wallet-total { font-size: 13px; opacity: 0.8; margin-top: 8px; }
    .bank-alert { background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.5); border-radius: 8px; padding: 10px 14px; margin-top: 12px; font-size: 13px; display: flex; justify-content: space-between; align-items: center; }
    .link-btn { background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 12px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .section-header h4, .transactions-section h4, .settlements-section h4 { margin: 0; font-size: 16px; font-weight: 600; }
    .section-header select { padding: 6px 10px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 13px; }
    .earnings-kpis { display: flex; gap: 16px; margin-bottom: 12px; }
    .ekpi { display: flex; flex-direction: column; }
    .ekpi span { font-size: 20px; font-weight: 700; color: #4f46e5; }
    .ekpi small { color: #9ca3af; font-size: 12px; }
    .mini-chart { display: flex; gap: 3px; height: 60px; align-items: flex-end; }
    .mini-bar-wrap { flex: 1; height: 100%; display: flex; align-items: flex-end; }
    .mini-bar { width: 100%; background: #4f46e5; border-radius: 2px 2px 0 0; min-height: 2px; transition: height 0.3s; }
    .txn-list { display: flex; flex-direction: column; gap: 8px; }
    .txn-row { display: flex; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .txn-type-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
    .txn-icon-credit { background: #d1fae5; }
    .txn-icon-debit { background: #fee2e2; }
    .txn-icon-neutral { background: #e0e7ff; }
    .txn-details { flex: 1; }
    .txn-desc { display: block; font-size: 14px; color: #374151; }
    .txn-date { font-size: 12px; color: #9ca3af; }
    .txn-amount { font-weight: 600; font-size: 14px; }
    .txn-amount.credit { color: #059669; }
    .txn-amount.debit { color: #dc2626; }
    .settlement-row { display: flex; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .settlement-period { flex: 1; font-size: 14px; color: #374151; }
    .settlement-amount { font-weight: 600; }
    .settlement-status { padding: 3px 10px; border-radius: 12px; font-size: 12px; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-failed { background: #fee2e2; color: #991b1b; }
    .no-data { color: #9ca3af; font-size: 14px; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 16px; padding: 28px; width: 420px; }
    .modal h3 { margin: 0 0 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
    .form-group input { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
    .form-divider { text-align: center; color: #9ca3af; margin: 8px 0; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
    .btn-primary { padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-outline { padding: 10px 20px; background: white; color: #4f46e5; border: 1px solid #4f46e5; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .earnings-section, .transactions-section, .settlements-section { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  `]
})
export class NeuronWalletComponent implements OnInit {
  @Input() userRole: 'teacher' | 'student' | 'advertiser' = 'student';

  private adService = inject(AdPlatformService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  wallet = signal<NeuronWallet | null>(null);
  earnings = signal<any>(null);
  transactions = signal<any[]>([]);
  settlements = signal<Settlement[]>([]);
  showBankForm = signal(false);
  earningsPeriod = '30d';

  bankForm = { accountHolderName: '', accountNumber: '', ifscCode: '', upiId: '' };

  ngOnInit() {
    if (!this.isBrowser || !this.authService.isLoggedIn()) return;
    this.loadWallet();
    this.loadEarnings();
    this.loadTransactions();
    this.loadSettlements();
  }

  loadWallet() {
    this.adService.getWallet().subscribe({ next: (res) => this.wallet.set(res.data) });
  }

  loadEarnings() {
    this.adService.getEarnings(this.earningsPeriod as any).subscribe({ next: (res) => this.earnings.set(res.data) });
  }

  loadTransactions() {
    this.adService.getTransactions({ limit: 10 }).subscribe({ next: (res) => this.transactions.set(res.data.transactions || []) });
  }

  loadSettlements() {
    this.adService.getSettlements().subscribe({ next: (res) => this.settlements.set(res.data.settlements || []) });
  }

  linkBankAccount() {
    this.adService.linkBankAccount(this.bankForm).subscribe({
      next: () => {
        this.showBankForm.set(false);
        this.loadWallet();
      }
    });
  }

  getPeriodEarnings(): number {
    return this.earnings()?.daily?.reduce((sum: number, d: any) => sum + d.earnings, 0) || 0;
  }

  getMiniBarHeight(earnings: number): number {
    const max = Math.max(...(this.earnings()?.daily || []).map((d: any) => d.earnings));
    return max > 0 ? (earnings / max) * 100 : 0;
  }

  isCredit(txn: any): boolean {
    return ['teacher_credit', 'student_credit', 'deposit', 'settlement_payout'].includes(txn.type);
  }

  getTxnIcon(type: string): string {
    const icons: Record<string, string> = {
      teacher_credit: '📈', student_credit: '💰',
      budget_deduct: '💸', settlement_payout: '🏦',
      deposit: '⬆️', withdrawal: '⬇️'
    };
    return icons[type] || '💱';
  }

  getTxnClass(type: string): string {
    if (['teacher_credit', 'student_credit', 'deposit', 'settlement_payout'].includes(type)) return 'txn-type-icon txn-icon-credit';
    if (['budget_deduct', 'withdrawal'].includes(type)) return 'txn-type-icon txn-icon-debit';
    return 'txn-type-icon txn-icon-neutral';
  }

  getMonthName(month: number): string {
    return ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month] || '';
  }
}
