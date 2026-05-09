import { Component, OnInit, OnDestroy, AfterViewInit, signal, computed, inject, PLATFORM_ID, Inject, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CeebrainIdService } from '../../services/ceebrain-id.service';
import { LifeOrchestratorService } from '../../services/life-orchestrator.service';
import { Navbar } from '../../components/landing-layout/landing-navbar/landing-navbar';

type Step =
  | 'entry'
  | 'otp-phone'
  | 'otp-verify'
  | 'otp-fallback'
  | 'alternative'
  | 'guidelines'
  | 'disagreement'
  | 'acknowledged'
  | 'creating'
  | 'complete';

type DisagreementCategory = 'confusion' | 'suggestion' | 'concern' | 'rejection' | 'distress' | 'unknown';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, Navbar],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('neuralCanvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  step = signal<Step>('entry');
  accessMethod = signal<'otp' | 'alternative' | null>(null);

  phoneForm!: FormGroup;
  otpForm!: FormGroup;

  otpCountdown    = signal(0);
  otpAttempts     = signal(0);
  autoReadSupported = signal(false);

  disagreementText     = signal('');
  disagreementCategory = signal<DisagreementCategory | null>(null);

  ceebrainId      = signal('');
  previewCbid     = signal('Fetching…');
  isLoading       = signal(false);
  errorMessage    = signal<string | null>(null);
  redirectCountdown = signal(0);

  activeTab   = signal<'email' | 'phone'>('phone');
  otpLoading  = signal(false);
  otpSent     = signal(false);
  showSuccess = signal(false);
  emailForm!: FormGroup;

  countryCode = signal('91');

  // ── Biometric ──────────────────────────────────────────────────────────────
  readonly BIOMETRIC_TOOLS = [
    { name: 'Voice & Breath Sample',        desc: 'Voiceprint + respiratory baseline via acoustic scan',      icon: '◎', color: '#00BCD4' },
    { name: 'Live Face & Vital Scan',        desc: 'Liveness detection + facial mapping + resting vitals',     icon: '⊙', color: '#FB923C' },
    { name: 'Eye Response & Attention',      desc: 'Pupillary reflex + gaze tracking + attention baseline',    icon: '◉', color: '#A78BFA' },
    { name: 'Movement & Response Test',      desc: 'Motor latency + gestural timing + micro-movement print',   icon: '⟳', color: '#22C55E' },
    { name: 'Touch Signature & Pulse',       desc: 'Dermal pressure + skin conductance + optical pulse',       icon: '⊕', color: '#EC4899' },
    { name: 'Device Posture & Gait',         desc: 'Accelerometer pattern + posture fingerprint',              icon: '⟵', color: '#60A5FA' },
    { name: 'Blood & Oxygen Inputs',         desc: 'SpO₂ saturation + haemodynamic baseline parameters',      icon: '♡', color: '#F87171' },
  ];

  // Stage: 'list' shows all tools to choose from; 'scan' shows active scanner for selected tool
  biometricOpen        = signal(false);
  biometricStage       = signal<'list' | 'scan'>('list');
  biometricSelectedIdx = signal<number | null>(null);
  biometricScanning    = signal(false);
  biometricCaptured    = signal(false);
  biometricScanned     = signal<number[]>([]);

  readonly biometricSelectedTool = computed(() => {
    const idx = this.biometricSelectedIdx();
    return idx !== null ? this.BIOMETRIC_TOOLS[idx] : null;
  });

  progressPercent = computed(() => {
    const map: Partial<Record<Step, number>> = {
      'entry': 5, 'otp-phone': 20, 'otp-verify': 45,
      'otp-fallback': 45, 'alternative': 45, 'guidelines': 72,
      'disagreement': 82, 'acknowledged': 88, 'creating': 95, 'complete': 100,
    };
    return map[this.step()] ?? 0;
  });

  private countdown?: ReturnType<typeof setInterval>;
  private redirectTimer?: ReturnType<typeof setInterval>;
  private otpAbortController?: AbortController;
  private cancelAnimation?: () => void;

  private readonly authService = inject(AuthService);
  private readonly cbidService = inject(CeebrainIdService);
  private readonly orc         = inject(LifeOrchestratorService);
  private readonly router      = inject(Router);

  readonly previewId = computed(() => this.previewCbid());

  constructor(private fb: FormBuilder, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.phoneForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      otp:   ['', [Validators.pattern('^[0-9]{6}$')]],
      consent: [false],
    });
    this.emailForm = this.fb.group({
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9]).*$/)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
    });
    if (isPlatformBrowser(this.platformId)) {
      this.autoReadSupported.set('OTPCredential' in window);
      this.restoreSession();
    }
    this.authService.generateCeebrainId().subscribe({
      next: id => this.previewCbid.set(id),
      error: () => this.previewCbid.set(this.cbidService.peek()),
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) this.initNeuralCanvas();
  }

  ngOnDestroy(): void {
    this.clearCountdown();
    this.clearRedirectTimer();
    this.otpAbortController?.abort();
    this.cancelAnimation?.();
  }

  // ── Entry ─────────────────────────────────────────────────────────────────

  selectOtpPath(): void {
    this.accessMethod.set('otp');
    this.step.set('otp-phone');
    this.saveSession();
  }

  selectAlternativePath(): void {
    this.accessMethod.set('alternative');
    this.step.set('alternative');
    this.saveSession();
  }

  switchTab(tab: 'email' | 'phone'): void {
    this.activeTab.set(tab);
  }

  onSubmit(): void {
    if (this.phoneForm.invalid || !this.otpSent()) {
      this.phoneForm.markAllAsTouched();
      return;
    }
    this.createIdentity();
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'passwordMismatch': true };
  }

  // ── OTP Phone ─────────────────────────────────────────────────────────────

  sendOtp(): void {
    if (this.phoneForm.get('phone')?.invalid) {
      this.phoneForm.get('phone')?.markAsTouched();
      return;
    }
    this.errorMessage.set(null);
    this.otpLoading.set(true);
    this.isLoading.set(true);
    // TODO: replace with authService.sendOtp(phone) when backend ready
    setTimeout(() => {
      this.isLoading.set(false);
      this.otpLoading.set(false);
      this.otpSent.set(true);
      this.otpAttempts.update(n => n + 1);
      this.step.set('otp-verify');
      this.startCountdown(30);
      this.tryAutoReadOtp();
      this.saveSession();
    }, 800);
  }

  // ── OTP Verify ────────────────────────────────────────────────────────────

  verifyOtp(): void {
    const otpVal = this.phoneForm.get('otp')?.value ?? '';
    if (otpVal.length < 6) {
      this.phoneForm.get('otp')?.markAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.otpAbortController?.abort();
    // TODO: replace with authService.verifyOtp(phone, otp)
    setTimeout(() => {
      this.isLoading.set(false);
      this.clearCountdown();
      this.step.set('guidelines');
      this.saveSession();
    }, 800);
  }

  resendOtp(): void {
    if (this.otpCountdown() > 0) return;
    if (this.otpAttempts() >= 3) {
      this.step.set('otp-fallback');
      return;
    }
    this.phoneForm.get('otp')?.reset();
    this.isLoading.set(true);
    // TODO: call authService.sendOtp(phone)
    setTimeout(() => {
      this.isLoading.set(false);
      this.otpAttempts.update(n => n + 1);
      this.startCountdown(this.otpAttempts() * 30);
      this.tryAutoReadOtp();
    }, 600);
  }

  // ── OTP Fallback ──────────────────────────────────────────────────────────

  useVoiceCall(): void {
    this.isLoading.set(true);
    // TODO: call authService.sendOtpVoice(phone)
    setTimeout(() => {
      this.isLoading.set(false);
      this.step.set('otp-verify');
      this.otpAttempts.set(0);
      this.phoneForm.get('otp')?.reset();
      this.startCountdown(60);
      this.tryAutoReadOtp();
    }, 800);
  }

  switchToAlternative(): void {
    this.clearCountdown();
    this.otpAbortController?.abort();
    this.accessMethod.set('alternative');
    this.step.set('alternative');
    this.saveSession();
  }

  // ── Alternative Access ────────────────────────────────────────────────────

  proceedFromAlternative(): void {
    this.step.set('guidelines');
    this.saveSession();
  }

  // ── Guidelines ────────────────────────────────────────────────────────────

  agreeGuidelines(): void {
    this.createIdentity();
  }

  disagreeGuidelines(): void {
    this.step.set('disagreement');
  }

  goBack(): void {
    const prev: Partial<Record<Step, Step>> = {
      'otp-verify':   'entry',
      'otp-fallback': 'otp-verify',
      'guidelines':   'otp-verify',
      'disagreement': 'guidelines',
      'acknowledged': 'guidelines',
    };
    const target = prev[this.step()];
    if (target) {
      this.clearCountdown();
      this.errorMessage.set(null);
      this.step.set(target);
      this.saveSession();
    }
  }

  readonly canGoBack = computed(() =>
    ['otp-verify', 'otp-fallback', 'guidelines', 'disagreement', 'acknowledged'].includes(this.step())
  );

  // ── Biometric ─────────────────────────────────────────────────────────────

  openBiometric(): void {
    this.biometricOpen.set(true);
    this.biometricStage.set('list');
    this.biometricSelectedIdx.set(null);
    this.biometricScanning.set(false);
    this.biometricScanned.set([]);
  }

  closeBiometric(): void {
    this.biometricOpen.set(false);
    this.biometricScanning.set(false);
  }

  selectBiometricTool(idx: number): void {
    this.biometricSelectedIdx.set(idx);
    this.biometricScanning.set(false);
    this.biometricStage.set('scan');
  }

  backToToolList(): void {
    this.biometricStage.set('list');
    this.biometricScanning.set(false);
    this.biometricSelectedIdx.set(null);
  }

  startBiometricScan(): void {
    this.biometricScanning.set(true);
    setTimeout(() => {
      const idx = this.biometricSelectedIdx()!;
      if (!this.biometricScanned().includes(idx)) {
        this.biometricScanned.update(s => [...s, idx]);
      }
      this.biometricScanning.set(false);
      this.biometricCaptured.set(true);
      setTimeout(() => {
        this.biometricCaptured.set(false);
        this.biometricStage.set('list');
        this.biometricSelectedIdx.set(null);
      }, 900);
    }, 2200);
  }

  // ── Disagreement Capture ──────────────────────────────────────────────────

  updateDisagreement(event: Event): void {
    this.disagreementText.set((event.target as HTMLTextAreaElement).value);
  }

  submitDisagreement(): void {
    const text = this.disagreementText().trim();
    if (!text) return;
    this.disagreementCategory.set(this.classifyDisagreement(text));
    // TODO: POST to manager-routing API with { phone, text, category, location }
    this.step.set('acknowledged');
    this.saveSession();
  }

  continueAfterDisagreement(): void {
    this.createIdentity();
  }

  // ── Identity Creation ─────────────────────────────────────────────────────

  private createIdentity(): void {
    this.step.set('creating');
    this.isLoading.set(true);
    this.authService.ceebrainRegister({
      mobileNo: this.phoneForm.value.phone || '0000000000',
      password: 'otp-verified',
      agreeToFramework: true,
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const cbid = res.user.ceebrainId ?? this.cbidService.allocate();
        this.ceebrainId.set(cbid);
        // Ensure CB ID is always persisted in the auth user profile
        if (!res.user.ceebrainId) {
          this.authService.setCeebrainId(cbid);
        }
        // Create the CB ID → personal page mapping in the database
        this.orc.initUserSchedule(cbid);
        this.step.set('complete');
        this.showSuccess.set(true);
        this.otpSent.set(false);
        sessionStorage.removeItem('reg_step');
        sessionStorage.removeItem('reg_phone');
        this.startRedirectCountdown();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Identity creation failed. Please try again.');
        this.step.set('guidelines');
      },
    });
  }

  // ── Countdown timer ───────────────────────────────────────────────────────

  private startCountdown(seconds: number): void {
    this.clearCountdown();
    this.otpCountdown.set(seconds);
    this.countdown = setInterval(() => {
      const next = this.otpCountdown() - 1;
      if (next <= 0) { this.clearCountdown(); this.otpCountdown.set(0); }
      else { this.otpCountdown.set(next); }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdown) { clearInterval(this.countdown); this.countdown = undefined; }
  }

  // ── Web OTP API auto-read ─────────────────────────────────────────────────

  private tryAutoReadOtp(): void {
    if (!this.autoReadSupported()) return;
    this.otpAbortController?.abort();
    this.otpAbortController = new AbortController();
    (navigator.credentials as any)
      .get({ otp: { transport: ['sms'] }, signal: this.otpAbortController.signal })
      .then((cred: any) => {
        if (cred?.code) {
          this.phoneForm.get('otp')?.setValue(cred.code);
          this.verifyOtp();
        }
      })
      .catch(() => {});
  }

  // ── Lightweight NLP classifier ────────────────────────────────────────────

  private classifyDisagreement(text: string): DisagreementCategory {
    const t = text.toLowerCase();
    if (/help\b|scared|threat|danger|force|fear/.test(t))            return 'distress';
    if (/\bno\b|refuse|won'?t|reject|against|disagree/.test(t))     return 'rejection';
    if (/worried|concern|afraid|safe|privacy|data/.test(t))         return 'concern';
    if (/suggest|idea|could|should|better|improve/.test(t))         return 'suggestion';
    if (/what|don'?t understand|confused|unclear|explain/.test(t))  return 'confusion';
    return 'unknown';
  }

  // ── Auto-redirect after registration ─────────────────────────────────────

  enterMySpace(): void {
    this.clearRedirectTimer();
    this.router.navigate(['/personal/my-activities']);
  }

  private startRedirectCountdown(): void {
    let secs = 4;
    this.redirectCountdown.set(secs);
    this.redirectTimer = setInterval(() => {
      secs--;
      this.redirectCountdown.set(secs);
      if (secs <= 0) {
        this.clearRedirectTimer();
        this.router.navigate(['/personal/my-activities']);
      }
    }, 1000);
  }

  private clearRedirectTimer(): void {
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
      this.redirectTimer = undefined;
    }
  }

  // ── Neural canvas background ──────────────────────────────────────────────

  private initNeuralCanvas(): void {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    type P = { x: number; y: number; vx: number; vy: number; a: number };
    const pts: P[] = Array.from({ length: 38 }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      a:  Math.random() * 0.45 + 0.1,
    }));

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of pts) {
        p.x = (p.x + p.vx + canvas.width)  % canvas.width;
        p.y = (p.y + p.vy + canvas.height) % canvas.height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,245,255,${p.a})`;
        ctx.fill();
      }

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(108,92,231,${(1 - d / 130) * 0.13})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(tick);
    };

    tick();

    this.cancelAnimation = () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }

  // ── Session continuity ────────────────────────────────────────────────────

  private saveSession(): void {
    try {
      sessionStorage.setItem('reg_step',  this.step());
      sessionStorage.setItem('reg_phone', this.phoneForm?.value?.phone ?? '');
    } catch {}
  }

  private restoreSession(): void {
    try {
      const savedStep  = sessionStorage.getItem('reg_step') as Step | null;
      const savedPhone = sessionStorage.getItem('reg_phone');
      if (!savedStep || savedStep === 'complete' || savedStep === 'creating') return;
      if (savedPhone) this.phoneForm.patchValue({ phone: savedPhone });
      const resumable: Step[] = ['otp-phone', 'otp-verify', 'guidelines', 'disagreement', 'acknowledged'];
      if (resumable.includes(savedStep)) {
        this.step.set(savedStep);
        if (savedStep === 'otp-verify') { this.otpAttempts.set(1); this.otpSent.set(true); }
      }
    } catch {}
  }
}
