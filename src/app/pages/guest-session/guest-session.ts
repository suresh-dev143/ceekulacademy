import { Component, inject, signal, computed, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GuestSessionService, GuestSessionData } from '../../services/guest-session.service';
import { AuthService } from '../../services/auth.service';

type GuestStep = 'typeSelect' | 'contactForm' | 'otp' | 'confirmation';
type SessionType = 'personal_unregistered' | 'guest_borrowed';

@Component({
  selector: 'app-guest-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="gs-root">
  <div class="gs-card">

    <!-- Header -->
    <div class="gs-header">
      <div class="gs-avatar-orb" [attr.data-sync]="syncState()">
        <div class="gs-orb-ring"></div>
        <div class="gs-orb-core">⬡</div>
      </div>
      <div style="flex:1">
        <h1 class="gs-title">Welcome to Ceekul</h1>
        <p class="gs-subtitle">GUEST ACCESS · NO ACCOUNT NEEDED</p>
      </div>
      <div class="gs-sync-label" [attr.data-sync]="syncState()">
        @if (syncState() === 'saving') { <span>Syncing…</span> }
        @if (syncState() === 'synced') { <span>✓ Saved</span> }
        @if (syncState() === 'error')  { <span>⚠ Error</span> }
      </div>
    </div>

    <!-- Progress bar -->
    <div class="gs-progress-track">
      <div class="gs-progress-fill" [style.width.%]="progressPct()"></div>
    </div>

    <!-- ── Step 1: Type Select ── -->
    @if (step() === 'typeSelect') {
      <div class="gs-section">
        <h2 class="gs-section-title">How are you joining today?</h2>
        <div class="gs-type-grid">
          <div class="gs-type-card" [class.selected]="selectedType() === 'personal_unregistered'"
               (click)="selectType('personal_unregistered')">
            <div class="gs-type-glyph violet">◈</div>
            <div class="gs-type-name">I am myself</div>
            <div class="gs-type-desc">Join as your real self with a phone number. Your data stays private.</div>
          </div>
          <div class="gs-type-card" [class.selected]="selectedType() === 'guest_borrowed'"
               (click)="selectType('guest_borrowed')">
            <div class="gs-type-glyph blue">⬢</div>
            <div class="gs-type-name">I'm using someone else's device</div>
            <div class="gs-type-desc">Borrow access temporarily. No personal data stored on this device.</div>
          </div>
        </div>
        <button class="gs-btn primary" [disabled]="!selectedType()" (click)="step.set('contactForm')">
          Continue →
        </button>
      </div>
    }

    <!-- ── Step 2: Contact Form ── -->
    @if (step() === 'contactForm') {
      <div class="gs-section">
        <h2 class="gs-section-title">
          {{ selectedType() === 'personal_unregistered' ? 'Tell us about you' : 'Guest details' }}
        </h2>

        <div class="gs-field-list">
          <div class="gs-field">
            <label>Display Name</label>
            <div class="gs-field-row">
              <input [(ngModel)]="name" placeholder="How should we call you?" class="gs-input" />
              <button class="gs-save-btn" [disabled]="!name.trim() || saving()" (click)="saveEntity('name', name)">
                {{ savedEntities().has('name') ? '✓' : 'SAVE' }}
              </button>
            </div>
          </div>

          @if (selectedType() === 'personal_unregistered') {
            <div class="gs-field">
              <label>Phone Number</label>
              <div class="gs-field-row">
                <input [(ngModel)]="phone" placeholder="+91 9XXXXXXXXX" type="tel" class="gs-input" />
                <button class="gs-save-btn" [disabled]="!phone.trim() || saving()" (click)="saveEntity('phone', phone)">
                  {{ savedEntities().has('phone') ? '✓' : 'SAVE' }}
                </button>
              </div>
            </div>
          }

          <div class="gs-field">
            <label>Message (optional)</label>
            <div class="gs-field-row">
              <input [(ngModel)]="message" placeholder="Why are you here today?" class="gs-input" />
              <button class="gs-save-btn" [disabled]="!message.trim() || saving()" (click)="saveEntity('message', message)">
                {{ savedEntities().has('message') ? '✓' : 'SAVE' }}
              </button>
            </div>
          </div>
        </div>

        @if (error()) {
          <div class="gs-error">{{ error() }}</div>
        }

        <div class="gs-btn-row">
          <button class="gs-btn ghost" (click)="step.set('typeSelect')">← Back</button>
          <button class="gs-btn primary"
            [disabled]="!canAdvance() || loading()"
            (click)="advance()">
            {{ loading() ? 'Please wait...' : selectedType() === 'personal_unregistered' ? 'Verify with OTP →' : 'Continue →' }}
          </button>
        </div>
      </div>
    }

    <!-- ── Step 3: OTP ── -->
    @if (step() === 'otp') {
      <div class="gs-section">
        <h2 class="gs-section-title">Enter verification code</h2>
        <p class="gs-desc-text">We sent a 4-digit code to {{ phone }}</p>

        <div class="gs-otp-row">
          @for (i of [0,1,2,3]; track i) {
            <input
              class="gs-otp-input"
              maxlength="1"
              [value]="otpDigits()[i]"
              (input)="onOtpInput($event, i)"
              (keydown)="onOtpKeydown($event, i)"
              type="number"
            />
          }
        </div>

        @if (error()) {
          <div class="gs-error">{{ error() }}</div>
        }

        <button class="gs-btn primary" [disabled]="otpValue().length < 4 || loading()" (click)="verifyOtp()">
          {{ loading() ? 'Verifying...' : 'Verify Code' }}
        </button>
        <button class="gs-btn ghost" style="margin-top:8px" (click)="resendOtp()">Resend code</button>
      </div>
    }

    <!-- ── Step 4: Confirmation ── -->
    @if (step() === 'confirmation') {
      <div class="gs-section gs-center">
        @if (isNewUser()) {
          <div class="gs-confirm-card cyan">
            <div class="gs-confirm-glyph">✦</div>
            <h3 class="gs-confirm-title">Welcome to Ceekul!</h3>
            <p class="gs-confirm-text">Your identity has been verified. Explore as a guest.</p>
          </div>
        } @else if (selectedType() === 'personal_unregistered') {
          <div class="gs-confirm-card green">
            <div class="gs-confirm-glyph">✓</div>
            <h3 class="gs-confirm-title">Identity verified</h3>
            <p class="gs-confirm-text">Welcome back. Your session is active.</p>
          </div>
        } @else {
          <div class="gs-confirm-card blue">
            <div class="gs-confirm-glyph">⬢</div>
            <h3 class="gs-confirm-title">Guest session started</h3>
            <p class="gs-confirm-text">Session ID: <code>{{ session()?.sessionId }}</code></p>
          </div>
        }

        <button class="gs-btn primary" style="margin-top:24px" (click)="goHome()">
          Enter Ceekul →
        </button>
      </div>
    }

  </div>
</div>
  `,
  styles: [`
    :host { display: block; }
    .gs-root {
      min-height: 100vh; background: #050810;
      display: flex; align-items: center; justify-content: center;
      padding: 24px; font-family: 'Inter', system-ui, sans-serif;
    }
    .gs-card {
      width: 100%; max-width: 480px;
      background: #0a0e1a;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px; overflow: hidden;
    }
    .gs-header {
      display: flex; align-items: center; gap: 14px;
      padding: 24px 28px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .gs-glyph { font-size: 28px; color: #64ffda; }
    .gs-title { font-size: 18px; font-weight: 300; color: #f0f4ff; margin: 0 0 2px; letter-spacing: 0.5px; }
    .gs-subtitle { font-size: 8px; color: #4a5568; letter-spacing: 2px; margin: 0; }

    .gs-progress-track { height: 2px; background: rgba(255,255,255,0.06); }
    .gs-progress-fill { height: 100%; background: #64ffda; transition: width 0.4s ease; }

    .gs-section { padding: 24px 28px; display: flex; flex-direction: column; gap: 16px; }
    .gs-section-title { font-size: 16px; font-weight: 300; color: #f0f4ff; margin: 0; }
    .gs-desc-text { font-size: 13px; color: #8892a8; margin: 0; }

    .gs-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .gs-type-card {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px; padding: 18px 14px; cursor: pointer; transition: all 0.2s;
      display: flex; flex-direction: column; gap: 8px;
    }
    .gs-type-card:hover { border-color: rgba(100,255,218,0.3); }
    .gs-type-card.selected { background: rgba(100,255,218,0.06); border-color: rgba(100,255,218,0.5); }
    .gs-type-glyph { font-size: 22px; }
    .gs-type-glyph.violet { color: #7c4dff; }
    .gs-type-glyph.blue { color: #4fc3f7; }
    .gs-type-name { font-size: 13px; font-weight: 500; color: #f0f4ff; }
    .gs-type-desc { font-size: 11px; color: #8892a8; line-height: 1.5; }

    .gs-field-list { display: flex; flex-direction: column; gap: 14px; }
    .gs-field { display: flex; flex-direction: column; gap: 6px; }
    .gs-field label { font-size: 10px; color: #4a5568; letter-spacing: 1.5px; text-transform: uppercase; }
    .gs-field-row { display: flex; gap: 8px; }
    .gs-input {
      flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; padding: 10px 12px; font-size: 13px; color: #f0f4ff; outline: none;
      transition: border-color 0.2s;
    }
    .gs-input:focus { border-color: rgba(100,255,218,0.4); }
    .gs-save-btn {
      background: rgba(100,255,218,0.1); border: 1px solid rgba(100,255,218,0.3);
      color: #64ffda; font-size: 9px; letter-spacing: 1.5px; padding: 0 12px;
      border-radius: 8px; cursor: pointer; white-space: nowrap; font-weight: 600;
      transition: all 0.2s;
    }
    .gs-save-btn:hover:not(:disabled) { background: rgba(100,255,218,0.2); }
    .gs-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .gs-otp-row { display: flex; justify-content: center; gap: 12px; }
    .gs-otp-input {
      width: 56px; height: 64px; text-align: center;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px; font-size: 24px; color: #64ffda; outline: none;
      transition: border-color 0.2s;
    }
    .gs-otp-input:focus { border-color: rgba(100,255,218,0.5); }

    .gs-error { font-size: 12px; color: #fc8181; padding: 8px 12px; background: rgba(252,129,129,0.08); border-radius: 8px; }

    .gs-btn-row { display: flex; gap: 10px; }
    .gs-btn {
      flex: 1; padding: 12px; border-radius: 10px; border: none; cursor: pointer;
      font-size: 12px; letter-spacing: 1px; font-weight: 500; transition: all 0.2s;
    }
    .gs-btn.primary { background: #64ffda; color: #000; }
    .gs-btn.primary:hover:not(:disabled) { background: #4de8c8; }
    .gs-btn.primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .gs-btn.ghost {
      background: transparent; color: #8892a8;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .gs-btn.ghost:hover { border-color: #64ffda; color: #64ffda; }

    .gs-center { align-items: center; }
    .gs-confirm-card {
      width: 100%; border-radius: 14px; padding: 28px; text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
    }
    .gs-confirm-card.green { background: rgba(100,255,218,0.06); border: 1px solid rgba(100,255,218,0.25); }
    .gs-confirm-card.cyan  { background: rgba(0,229,255,0.06);   border: 1px solid rgba(0,229,255,0.25); }
    .gs-confirm-card.blue  { background: rgba(79,195,247,0.06);  border: 1px solid rgba(79,195,247,0.25); }
    .gs-confirm-glyph { font-size: 36px; color: #64ffda; }
    .gs-confirm-title { font-size: 16px; color: #f0f4ff; margin: 0; font-weight: 400; }
    .gs-confirm-text  { font-size: 13px; color: #8892a8; margin: 0; }
    code { font-family: monospace; color: #64ffda; font-size: 11px; }

    /* Avatar orb sync indicator */
    .gs-avatar-orb {
      position: relative; width: 44px; height: 44px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .gs-orb-ring {
      position: absolute; inset: 0; border-radius: 50%;
      border: 1.5px solid rgba(100,255,218,0.25);
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .gs-orb-core {
      font-size: 20px; color: #64ffda; position: relative; z-index: 1;
      transition: color 0.3s;
    }

    [data-sync="saving"] .gs-orb-ring {
      border-color: rgba(100,255,218,0.7);
      animation: gs-orbit-spin 1s linear infinite;
    }
    [data-sync="synced"] .gs-orb-ring {
      border-color: #64ffda;
      box-shadow: 0 0 12px rgba(100,255,218,0.5);
      animation: gs-synced-pulse 0.6s ease-out;
    }
    [data-sync="error"] .gs-orb-ring {
      border-color: rgba(252,129,129,0.7);
      box-shadow: 0 0 10px rgba(252,129,129,0.3);
    }
    [data-sync="error"] .gs-orb-core { color: #fc8181; }

    @keyframes gs-orbit-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes gs-synced-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(100,255,218,0.6); }
      60%  { box-shadow: 0 0 0 10px rgba(100,255,218,0); }
      100% { box-shadow: 0 0 12px rgba(100,255,218,0.5); }
    }

    .gs-sync-label {
      font-size: 9px; letter-spacing: 1.5px; font-weight: 600; min-width: 52px;
      text-align: right; transition: color 0.2s; color: transparent;
    }
    [data-sync="saving"] .gs-sync-label, .gs-sync-label[data-sync="saving"] { color: #8892a8; }
    [data-sync="synced"] .gs-sync-label, .gs-sync-label[data-sync="synced"] { color: #64ffda; }
    [data-sync="error"]  .gs-sync-label, .gs-sync-label[data-sync="error"]  { color: #fc8181; }
  `]
})
export class GuestSessionComponent implements OnInit, OnDestroy {
  private readonly svc = inject(GuestSessionService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  step = signal<GuestStep>('typeSelect');
  selectedType = signal<SessionType | null>(null);
  session = signal<GuestSessionData | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  savedEntities = signal<Set<string>>(new Set());
  isNewUser = signal(false);
  otpDigits = signal<string[]>(['', '', '', '']);
  syncState = signal<'idle' | 'saving' | 'synced' | 'error'>('idle');

  private _syncTimer: ReturnType<typeof setTimeout> | null = null;

  name = '';
  phone = '';
  message = '';

  progressPct = computed(() => {
    const map: Record<GuestStep, number> = {
      typeSelect: 25, contactForm: 50, otp: 75, confirmation: 100
    };
    return map[this.step()];
  });

  otpValue = computed(() => this.otpDigits().join(''));

  canAdvance = computed(() => {
    if (this.selectedType() === 'personal_unregistered') {
      return this.savedEntities().has('name') && this.savedEntities().has('phone');
    }
    return this.savedEntities().has('name');
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.createSession();
  }

  private async createSession(): Promise<void> {
    if (!this.selectedType()) return;
    this.loading.set(true);
    try {
      const s = await this.svc.createSession(this.selectedType()!);
      this.session.set(s);
    } catch { }
    this.loading.set(false);
  }

  selectType(type: SessionType): void {
    this.selectedType.set(type);
    this.svc.createSession(type).then(s => this.session.set(s)).catch(() => { });
  }

  async saveEntity(entity: string, value: string): Promise<void> {
    const sessionId = this.session()?.sessionId;
    if (!sessionId || !value.trim()) return;
    this.saving.set(true);
    this._setSyncState('saving');
    try {
      await this.svc.fillEntity(sessionId, entity, value.trim());
      const updated = new Set(this.savedEntities());
      updated.add(entity);
      this.savedEntities.set(updated);
      this._setSyncState('synced');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to save.');
      this._setSyncState('error');
    }
    this.saving.set(false);
  }

  private _setSyncState(state: 'idle' | 'saving' | 'synced' | 'error'): void {
    if (this._syncTimer !== null) { clearTimeout(this._syncTimer); this._syncTimer = null; }
    this.syncState.set(state);
    if (state === 'synced' || state === 'error') {
      this._syncTimer = setTimeout(() => this.syncState.set('idle'), 2500);
    }
  }

  ngOnDestroy(): void {
    if (this._syncTimer !== null) clearTimeout(this._syncTimer);
  }

  async advance(): Promise<void> {
    if (this.selectedType() === 'personal_unregistered') {
      await this.sendOtp();
    } else {
      this.step.set('confirmation');
    }
  }

  async sendOtp(): Promise<void> {
    const sessionId = this.session()?.sessionId;
    if (!sessionId) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.svc.requestOtp(sessionId);
      this.step.set('otp');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Failed to send OTP.');
    }
    this.loading.set(false);
  }

  async resendOtp(): Promise<void> {
    await this.sendOtp();
  }

  async verifyOtp(): Promise<void> {
    const sessionId = this.session()?.sessionId;
    if (!sessionId) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.svc.verifyOtp(sessionId, this.otpValue());
      if (result.verified) {
        this.isNewUser.set(result.isNewUser);
        this.step.set('confirmation');
      } else {
        this.error.set('Invalid code. Please try again.');
      }
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Verification failed.');
    }
    this.loading.set(false);
  }

  onOtpInput(event: Event, index: number): void {
    const val = (event.target as HTMLInputElement).value.slice(-1);
    const digits = [...this.otpDigits()];
    digits[index] = val;
    this.otpDigits.set(digits);
    if (val && index < 3) {
      const inputs = document.querySelectorAll<HTMLInputElement>('.gs-otp-input');
      inputs[index + 1]?.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits()[index] && index > 0) {
      const inputs = document.querySelectorAll<HTMLInputElement>('.gs-otp-input');
      inputs[index - 1]?.focus();
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
