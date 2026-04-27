import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { PaymentService } from '../../services/payment.service';
import { NeuronService } from '../../services/neuron.service';

type PageState = 'processing' | 'success' | 'error';

@Component({
  selector: 'app-payment-return',
  standalone: true,
  imports: [DecimalPipe, RouterModule],
  templateUrl: './payment-return.html',
})
export class PaymentReturn implements OnInit {
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly paymentService = inject(PaymentService);
  private readonly neuronService  = inject(NeuronService);

  readonly state         = signal<PageState>('processing');
  readonly neuronsIssued = signal<number>(0);
  readonly errorMessage  = signal<string>('');

  ngOnInit(): void {
    const p = this.route.snapshot.queryParamMap;

    const sessionId         = p.get('sessionId')         ?? '';
    const razorpayPaymentId = p.get('razorpay_payment_id') ?? '';
    const razorpayOrderId   = p.get('razorpay_order_id')   ?? '';
    const razorpaySignature = p.get('razorpay_signature')   ?? '';

    if (!sessionId || !razorpayPaymentId || !razorpayOrderId) {
      this.errorMessage.set('Invalid payment return URL. Required parameters are missing.');
      this.state.set('error');
      return;
    }

    this.paymentService.verifyPayment({
      sessionId, razorpayPaymentId, razorpayOrderId, razorpaySignature,
    }).subscribe({
      next: (res) => {
        this.neuronsIssued.set(res.neuronsIssued);
        this.state.set('success');
        // Refresh neuron account so the new balance reflects immediately
        this.neuronService.loadAccount();
      },
      error: (e) => {
        this.errorMessage.set(e?.error?.message ?? 'Payment verification failed. Please contact support.');
        this.state.set('error');
      },
    });
  }

  goToNeurons(): void {
    this.router.navigate(['/personal/neurons'], { queryParams: { tab: 'contribute' } });
  }
}
