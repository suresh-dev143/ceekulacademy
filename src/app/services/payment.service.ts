import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

export interface InitiatePaymentPayload {
  entityType: 'Trust' | 'Section8' | 'PvtLtd';
  entityName: string;
  simulationUnits: number;
  notes?: string;
}

export interface InitiatePaymentResponse {
  sessionId: string;
  simulationUnits: number;
  entityName: string;
  entityType: string;
}

export interface VerifyPaymentPayload {
  sessionId: string;
  providerReference?: string;
  providerReturnParams?: Record<string, string>;
}

export interface VerifyPaymentResponse {
  neuronsIssued: number;
  alreadyProcessed: boolean;
}

export interface PaymentSessionStatus {
  sessionId: string;
  status: 'disabled' | 'simulation_only';
  simulationUnits: number;
  neuronsIssued: number;
  entityName: string;
  entityType: string;
  completedAt?: string;
  failureReason?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly disabledMessage = 'Real-economy provider operations are disabled during Experimental Internal Simulation.';

  initiatePayment(_payload: InitiatePaymentPayload): Observable<InitiatePaymentResponse> {
    return this._disabled<InitiatePaymentResponse>();
  }

  verifyPayment(_payload: VerifyPaymentPayload): Observable<VerifyPaymentResponse> {
    return this._disabled<VerifyPaymentResponse>();
  }

  getSession(_sessionId: string): Observable<{ session: PaymentSessionStatus }> {
    return this._disabled<{ session: PaymentSessionStatus }>();
  }

  private _disabled<T>(): Observable<T> {
    return throwError(() => new Error(this.disabledMessage));
  }
}