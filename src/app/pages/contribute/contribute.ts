import { Component, signal, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NeuronService } from '../../services/neuron.service';
import { PaymentService } from '../../services/payment.service';
import { environment } from '../../../environments/environment';
import { HomeSidebarLeftComponent } from '../home/home-sidebar-left/home-sidebar-left';
import { LayoutComponent } from '../../components/layout/layout';

@Component({
  selector: 'app-contribute',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule,LayoutComponent, HomeSidebarLeftComponent],
  templateUrl: './contribute.html',
  styleUrl: './contribute.scss',
})
export class Contribute implements OnInit {
  readonly neuronService      = inject(NeuronService);
  private readonly fb         = inject(FormBuilder);
  private readonly paymentSvc = inject(PaymentService);
  private readonly platformId = inject(PLATFORM_ID);

  contributionForm!: FormGroup;
  contributionLoading = signal(false);
  contributionError   = signal<string | null>(null);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.neuronService.loadAll();
    }
    this.contributionForm = this.fb.group({
      entityType: ['', Validators.required],
      entityName: ['', [Validators.required, Validators.minLength(3)]],
      amountINR:  ['', [Validators.required, Validators.min(1)]],
      notes:      [''],
    });
  }

  onSubmitContribution(): void {
    if (this.contributionForm.invalid) { this.contributionForm.markAllAsTouched(); return; }
    this.contributionLoading.set(true);
    this.contributionError.set(null);

    this.paymentSvc.initiatePayment(this.contributionForm.value).subscribe({
      next: (session) => {
        this.contributionLoading.set(false);
        const returnUrl = `${environment.appUrl}/payment/return`;
        const params = new URLSearchParams({ sess: session.sessionId, returnUrl });
        window.location.href = `${environment.crasmibUrl}/pay?${params.toString()}`;
      },
      error: (e) => {
        this.contributionLoading.set(false);
        this.contributionError.set(e?.error?.message ?? 'Failed to initiate payment. Please try again.');
      },
    });
  }

  statusClass(status: string): string {
    return ({
      pending:   'status--pending',
      confirmed: 'status--confirmed',
      rejected:  'status--rejected',
    } as Record<string, string>)[status] ?? '';
  }
}
