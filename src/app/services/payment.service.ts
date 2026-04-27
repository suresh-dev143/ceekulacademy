import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NeuronAccount } from '../core/models/neuron.model';
import { environment } from '../../environments/environment';

export interface InitiatePaymentPayload {
  currency?:   string;
  entityType:  'Trust' | 'Section8' | 'PvtLtd';
  entityName:  string;
  amountINR:   number;
  notes?:      string;
}

export interface InitiatePaymentResponse {
  sessionId:  string;
  amountINR:  number;
  currency:   string;
  entityName: string;
  entityType: string;
}

export interface VerifyPaymentPayload {
  sessionId:          string;
  razorpayPaymentId:  string;
  razorpayOrderId:    string;
  razorpaySignature:  string;
}

export interface VerifyPaymentResponse {
  neuronsIssued:    number;
  account:          NeuronAccount;
  alreadyProcessed: boolean;
}

export interface PaymentSessionStatus {
  sessionId:         string;
  status:            'pending' | 'completed' | 'failed' | 'expired';
  amountINR:         number;
  neuronsIssued:     number;
  entityName:        string;
  entityType:        string;
  completedAt?:      string;
  failureReason?:    string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http    = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/payment`;

  /** Create a payment session and get the Cramib redirect URL. */
  initiatePayment(payload: InitiatePaymentPayload): Observable<InitiatePaymentResponse> {
    return this.http.post<InitiatePaymentResponse>(`${this.apiBase}/initiate`, payload);
  }

  /**
   * Verify the Razorpay payment returned from Cramib.
   * Called by the /payment/return page with query params from Cramib's redirect.
   */
  verifyPayment(payload: VerifyPaymentPayload): Observable<VerifyPaymentResponse> {
    return this.http.post<VerifyPaymentResponse>(`${this.apiBase}/verify`, payload);
  }

  /** Poll the status of a session (optional — for status display). */
  getSession(sessionId: string): Observable<{ session: PaymentSessionStatus }> {
    return this.http.get<{ session: PaymentSessionStatus }>(`${this.apiBase}/session/${sessionId}`);
  }
}
