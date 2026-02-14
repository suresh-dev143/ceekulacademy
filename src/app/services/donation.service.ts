import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // In case we need it later, though mocking for now
import { Observable, of, delay } from 'rxjs';

export type DonationArea =
    | 'Health'
    | 'Study / Education'
    | 'Infrastructure'
    | 'Research'
    | 'Community Development'
    | 'Emergency Relief'
    | 'Other';

export type DonationStatus = 'Initiated' | 'Pending' | 'Success' | 'Failed' | 'Allocated' | 'Utilized';

export type PaymentMethod = 'UPI' | 'Card' | 'NetBanking' | 'Wallet' | 'International';

export interface Donation {
    id?: string;
    donorName?: string;
    isAnonymous: boolean;
    donationArea: DonationArea;
    locationScope: 'Global' | 'Local';
    location?: {
        area?: string;
        city?: string;
        district?: string;
        state?: string;
        country?: string;
    };
    currency: string;
    amount: number;
    paymentMethod: PaymentMethod;
    status: DonationStatus;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class DonationService {

    // Mock submission
    submitDonation(donation: Donation): Observable<{ success: boolean, transactionId: string }> {
        // Simulate network delay
        return of({
            success: true,
            transactionId: 'TXN-' + Math.floor(Math.random() * 1000000)
        }).pipe(delay(2000));
    }
}
