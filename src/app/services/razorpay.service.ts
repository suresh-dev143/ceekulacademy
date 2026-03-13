import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RazorpayOrder {
    id: string;
    amount: number;
    currency: string;
}

@Injectable({
    providedIn: 'root'
})
export class RazorpayService {
    private http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    createOrder(amount: number): Observable<RazorpayOrder> {
        // Mock order creation
        const mockOrder: RazorpayOrder = {
            id: 'order_' + Math.random().toString(36).substring(7),
            amount: amount * 100, // Razorpay expects paise
            currency: 'INR'
        };
        console.log('Mock Order Created:', mockOrder);
        return of(mockOrder).pipe(delay(500));
    }

    verifyPayment(paymentData: any): Observable<any> {
        // Mock payment verification
        console.log('Mock Payment Verification for:', paymentData);
        return of({ status: 'success', message: 'Payment verified (Mocked)' }).pipe(delay(500));
    }

    openCheckout(order: RazorpayOrder, callback: (res: any) => void) {
        console.log('Mock Checkout Opened for order:', order.id);
        
        // Simulate user interaction with a small delay
        setTimeout(() => {
            const mockResponse = {
                razorpay_payment_id: 'pay_' + Math.random().toString(36).substring(7),
                razorpay_order_id: order.id,
                razorpay_signature: 'mock_signature'
            };
            callback(mockResponse);
        }, 1000);
    }
}
