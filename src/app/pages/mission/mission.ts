import { Component, inject, signal, computed, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NeuronService } from '../../services/neuron.service';
import { AuthService } from '../../services/auth.service';
import { PaymentService } from '../../services/payment.service';
import { RazorpayService } from '../../services/razorpay.service';

interface MissionProject {
  id: string;
  title: string;
  description: string;
  neuronRequirement: number;
  participantsCount: number;
  status: 'open' | 'active' | 'completed';
  tag: string;
}

interface ParticipationEvent {
  action: string;
  entity: string;
  neurons: number;
  bucket: 'fun' | 'cun' | 'sun';
  time: string;
}

@Component({
  selector: 'app-mission',
  standalone: true,
  imports: [RouterLink, DecimalPipe, ReactiveFormsModule],
  templateUrl: './mission.html',
  styleUrl: './mission.scss',
})
export class MissionComponent implements OnInit {
  private readonly auth           = inject(AuthService);
  private readonly fb             = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);
  private readonly razorpayService= inject(RazorpayService);
  private readonly platformId     = inject(PLATFORM_ID);
  readonly neuronService          = inject(NeuronService);

  // ── Auth ──────────────────────────────────────────────────────────────────
  readonly currentUser = this.auth.currentUserProfile;

  readonly totalNeurons = computed(() =>
    this.neuronService.funBalance() +
    this.neuronService.cunBalance() +
    this.neuronService.sunBalance()
  );

  // ── Contribute form state ─────────────────────────────────────────────────
  showContributeForm = signal(false);
  contributeForm!: FormGroup;
  contributeLoading = signal(false);
  contributeError   = signal<string | null>(null);
  contributeSuccess = signal<{ neurons: number; txId: string } | null>(null);

  readonly neuronPreview = computed(() => {
    const amt = Number(this.contributeForm?.get('amountINR')?.value ?? 0);
    return isNaN(amt) || amt < 1 ? 0 : Math.floor(amt);
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.neuronService.loadAll();
    }

    this.contributeForm = this.fb.group({
      cbId:          [this.currentUser()?.ceebrainId ?? '', [Validators.required, Validators.pattern(/^\d{12,15}$/)]],
      bankAccount:   ['', [Validators.required, Validators.pattern(/^\d{9,18}$/)]],
      ifsc:          ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]],
      amountINR:     ['', [Validators.required, Validators.min(1), Validators.max(500000)]],
    });
  }

  openContributeForm(): void {
    this.contributeSuccess.set(null);
    this.contributeError.set(null);
    this.showContributeForm.set(true);
    // Sync CB ID in case auth loaded after init
    const cbId = this.currentUser()?.ceebrainId;
    if (cbId && !this.contributeForm.get('cbId')?.value) {
      this.contributeForm.get('cbId')!.setValue(cbId);
    }
  }

  closeContributeForm(): void {
    this.showContributeForm.set(false);
    if (!this.contributeSuccess()) {
      this.contributeForm.reset({
        cbId: this.currentUser()?.ceebrainId ?? '',
      });
      this.contributeError.set(null);
    }
  }

  onContribute(): void {
    if (this.contributeForm.invalid) {
      this.contributeForm.markAllAsTouched();
      return;
    }

    const { cbId, bankAccount, ifsc, amountINR } = this.contributeForm.value;
    const amount = Number(amountINR);

    this.contributeLoading.set(true);
    this.contributeError.set(null);

    // Step 1: create payment session on backend
    this.paymentService.initiatePayment({
      entityType: 'Section8',
      entityName: 'Ceekul Mission',
      amountINR:  amount,
      notes:      `CB ID: ${cbId} | Bank: ${bankAccount} | IFSC: ${ifsc}`,
    }).subscribe({
      next: (session) => {
        // Step 2: create Razorpay order
        this.razorpayService.createOrder(amount).subscribe({
          next: (order) => {
            // Step 3: open Razorpay checkout in-page
            this.razorpayService.openCheckout(order, (paymentResponse) => {
              // Step 4: verify payment and credit neurons
              this.paymentService.verifyPayment({
                sessionId:           session.sessionId,
                razorpayPaymentId:   paymentResponse.razorpay_payment_id,
                razorpayOrderId:     paymentResponse.razorpay_order_id,
                razorpaySignature:   paymentResponse.razorpay_signature,
              }).subscribe({
                next: (result) => {
                  this.contributeLoading.set(false);
                  this.contributeSuccess.set({
                    neurons: result.neuronsIssued,
                    txId:    paymentResponse.razorpay_payment_id,
                  });
                  this.neuronService.loadAll();
                },
                error: (e) => {
                  this.contributeLoading.set(false);
                  this.contributeError.set(e?.error?.message ?? 'Payment received but neuron credit failed. Contact support with Tx ID: ' + paymentResponse.razorpay_payment_id);
                },
              });
            });
            // Razorpay checkout is async — stop spinner only on callback
            // If checkout was dismissed without payment, reset loading
          },
          error: () => {
            this.contributeLoading.set(false);
            this.contributeError.set('Could not create payment order. Please try again.');
          },
        });
      },
      error: (e) => {
        this.contributeLoading.set(false);
        this.contributeError.set(e?.error?.message ?? 'Could not initiate payment session. Please try again.');
      },
    });
  }

  resetForm(): void {
    this.contributeSuccess.set(null);
    this.contributeError.set(null);
    this.contributeForm.reset({ cbId: this.currentUser()?.ceebrainId ?? '' });
  }

  // ── Supporting data ───────────────────────────────────────────────────────
  readonly objectives = [
    { icon: 'fa-landmark',      title: 'Section 8 Mission',      desc: 'Non-profit ecosystem built on participation, not profit. Every neuron earned through real contribution.' },
    { icon: 'fa-network-wired', title: 'Decentralized Governance',desc: 'Advisor → Director → Manager → Volunteer hierarchy ensures ground-level accountability.' },
    { icon: 'fa-infinity',      title: 'Circular Participation',  desc: 'Contribute → earn FUN → commit to CUN/SUN → unlock ecosystem benefits.' },
    { icon: 'fa-shield-alt',    title: 'No Monetary Conversion',  desc: 'Neurons are participation units, not currency. They cannot be sold, converted, or withdrawn.' },
  ];

  readonly projects: MissionProject[] = [
    { id: 'PROJ001', title: 'Rural Skilling Initiative',       description: 'Train 10,000 rural youth in digital skills, agriculture tech, and micro-entrepreneurship across 50 villages.', neuronRequirement: 5000,  participantsCount: 342, status: 'active', tag: 'EDUCATION'   },
    { id: 'PROJ002', title: 'Gram Panchayat Digital Bridge',   description: 'Digitize grievance redressal, asset tracking, and citizen services for 200 gram panchayats.',              neuronRequirement: 8000,  participantsCount: 178, status: 'open',   tag: 'GOVERNANCE'  },
    { id: 'PROJ003', title: 'Community Health Monitors',       description: 'Deploy 500 trained health monitors to collect vitals, detect early signs, and connect families to ASHA workers.', neuronRequirement: 3000, participantsCount: 521, status: 'active', tag: 'HEALTH'     },
    { id: 'PROJ004', title: 'Ecological Restoration Zones',    description: 'Restore 1,000 hectares of degraded land through community-led afforestation and water conservation.',         neuronRequirement: 12000, participantsCount: 89,  status: 'open',   tag: 'ENVIRONMENT' },
  ];

  readonly recentEvents: ParticipationEvent[] = [
    { action: 'Contributed',   entity: 'Priya S.',  neurons: 500,  bucket: 'fun', time: '2m ago'  },
    { action: 'Invested CUN',  entity: 'Rajan M.',  neurons: 1200, bucket: 'cun', time: '5m ago'  },
    { action: 'SUN allocated', entity: 'Leela K.',  neurons: 300,  bucket: 'sun', time: '11m ago' },
    { action: 'Contributed',   entity: 'Arjun T.',  neurons: 750,  bucket: 'fun', time: '18m ago' },
    { action: 'Invested CUN',  entity: 'Meena V.',  neurons: 2000, bucket: 'cun', time: '24m ago' },
    { action: 'SUN allocated', entity: 'Dev R.',    neurons: 400,  bucket: 'sun', time: '31m ago' },
    { action: 'Contributed',   entity: 'Kavya P.',  neurons: 600,  bucket: 'fun', time: '42m ago' },
    { action: 'Invested CUN',  entity: 'Suresh B.', neurons: 850,  bucket: 'cun', time: '58m ago' },
  ];

  bucketColor(bucket: 'fun' | 'cun' | 'sun'): string {
    return { fun: '#60a5fa', cun: '#a78bfa', sun: '#34d399' }[bucket];
  }

  bucketLabel(bucket: 'fun' | 'cun' | 'sun'): string {
    return { fun: 'FUN', cun: 'CUN', sun: 'SUN' }[bucket];
  }

  statusLabel(status: 'open' | 'active' | 'completed'): string {
    return { open: 'Open', active: 'Active', completed: 'Completed' }[status];
  }

  tagColor(tag: string): string {
    const map: Record<string, string> = { EDUCATION: '#60a5fa', GOVERNANCE: '#a78bfa', HEALTH: '#34d399', ENVIRONMENT: '#4ade80' };
    return map[tag] ?? '#64748b';
  }
}
