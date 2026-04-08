import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { DonationService, Donation, DonationArea, PaymentMethod } from '../../services/donation.service';

@Component({
    selector: 'app-donate-page',
    standalone: true,
    imports: [FormsModule, LayoutComponent],
    templateUrl: './donate.html',
    styleUrl: './donate.scss'
})
export class DonatePageComponent {
    private donationService = inject(DonationService);
    private router = inject(Router);

    // Form State
    // Form State
    isSubmitting = signal<boolean>(false);
    submissionSuccess = signal<boolean>(false);
    transactionId = signal<string>('');
    hasConsented = false;

    // Data Model
    donation: Donation = {
        isAnonymous: false,
        donationArea: 'Health', // Default
        locationScope: 'Global',
        currency: 'INR',
        amount: 1000,
        paymentMethod: 'UPI',
        status: 'Initiated',
        createdAt: new Date().toISOString()
    };

    // Dropdown Options
    areas: DonationArea[] = [
        'Health',
        'Study / Education',
        'Infrastructure',
        'Research',
        'Community Development',
        'Emergency Relief',
        'Other'
    ];

    currencies = ['INR', 'USD', 'EUR', 'GBP'];
    paymentMethods: PaymentMethod[] = ['UPI', 'Card', 'NetBanking', 'Wallet', 'International'];

    // Presets
    amountPresets = [500, 1000, 2500, 5000, 10000];



    setAmount(amount: number) {
        this.donation.amount = amount;
    }

    submitDonation() {
        this.isSubmitting.set(true);
        this.donation.status = 'Pending';

        this.donationService.submitDonation(this.donation).subscribe({
            next: (res) => {
                this.isSubmitting.set(false);
                this.submissionSuccess.set(true);
                this.transactionId.set(res.transactionId);
                this.donation.status = 'Success';
            },
            error: (err) => {
                this.isSubmitting.set(false);
                // Handle error (show toast/alert)
                console.error('Donation failed', err);
                this.donation.status = 'Failed';
            }
        });
    }

    resetForm() {
        this.submissionSuccess.set(false);
        this.hasConsented = false;
        this.donation = {
            isAnonymous: false,
            donationArea: 'Health',
            locationScope: 'Global',
            currency: 'INR',
            amount: 1000,
            paymentMethod: 'UPI',
            status: 'Initiated',
            createdAt: new Date().toISOString()
        };
    }
}
