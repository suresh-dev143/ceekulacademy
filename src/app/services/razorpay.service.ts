import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
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
        return this.http.post<RazorpayOrder>(`${this.apiUrl}/api/v1/payments/create-order`, { amount });
    }

    verifyPayment(paymentData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/api/v1/payments/verify`, paymentData);
    }

    openCheckout(order: RazorpayOrder, callback: (res: any) => void) {
        const options = {
            key: 'rzp_test_YOUR_KEY', // Should be in environment
            amount: order.amount,
            currency: order.currency,
            name: 'Ceekul Mission',
            description: 'Workshop Enrollment',
            order_id: order.id,
            handler: (response: any) => {
                callback(response);
            },
            prefill: {
                name: '',
                email: '',
                contact: ''
            },
            theme: {
                color: '#FF6B00'
            }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
    }
}
