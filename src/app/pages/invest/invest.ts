import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { AssetInvestmentService, AssetInvestment, InvestmentArea, AssetType, ScopeType } from '../../services/asset-investment.service';

@Component({
    selector: 'app-invest-page',
    standalone: true,
    imports: [FormsModule, LayoutComponent],
    templateUrl: './invest.html',
    styleUrl: './invest.scss'
})
export class InvestPageComponent {
    private investmentService = inject(AssetInvestmentService);
    private router = inject(Router);

    // Form State
    isSubmitting = signal<boolean>(false);
    submissionSuccess = signal<boolean>(false);
    refId = signal<string>('');
    hasConsented = false;

    // Data Model
    investment: AssetInvestment = {
        investorName: '',
        contact: { phone: '', email: '' },
        area: 'Health', // Default
        scopeType: 'Location',
        location: { area: '', city: '', district: '', state: '', country: '', pincode: '' },
        projectRef: { projectId: '', projectName: '' },
        assetType: 'Money', // Default
        assetDetails: {
            currency: 'INR',
            amount: 0,
            paymentMode: 'UPI'
        },
        status: 'Submitted',
        createdAt: new Date().toISOString(),
        projectAnalysis: {
            projectId: '',
            discussionMode: '',
            monitoringParticipate: false
        }
    };

    // Dropdown Options
    areas: InvestmentArea[] = [
        'Health',
        'Study / Education',
        'Infrastructure',
        'Research',
        'Community Development',
        'Emergency / Relief',
        'Other'
    ];

    assetTypes: AssetType[] = [
        'Money',
        'Land',
        'Services / Human Resources',
        'Equipment / Material',
        'Technology / IP',
        'Other'
    ];

    currencies = ['INR', 'USD', 'EUR', 'GBP'];
    paymentModes = ['UPI', 'Bank Transfer', 'Card', 'International'];
    serviceModes = ['On-site', 'Remote', 'Offline'];



    // Project Analysis Data
    projects = [
        'Smart School Initiative (District A)',
        'Community Hospital Upgrade (District B)',
        'Rural Road Network (District C)',
        'Clean Water Project (District D)',
        'Women Empowerment Center (District E)'
    ];

    discussionModes = ['Online (Zoom/Meet)', 'In-Person Visit', 'Phone Call'];

    submitInvestment() {
        this.isSubmitting.set(true);

        // Ensure nested objects exist to avoid undefined errors in backend/mock
        // (though simplified here)

        this.investmentService.submitInvestment(this.investment).subscribe({
            next: (res) => {
                this.isSubmitting.set(false);
                this.submissionSuccess.set(true);
                this.refId.set(res.refId);
                this.investment.status = 'Submitted';
            },
            error: (err) => {
                this.isSubmitting.set(false);
                console.error('Investment failed', err);
            }
        });
    }

    resetForm() {
        this.submissionSuccess.set(false);
        this.hasConsented = false;
        this.investment = {
            investorName: '',
            contact: { phone: '', email: '' },
            area: 'Health',
            scopeType: 'Location',
            location: { area: '', city: '', district: '', state: '', country: '', pincode: '' },
            projectRef: { projectId: '', projectName: '' },
            assetType: 'Money',
            assetDetails: {
                currency: 'INR',
                amount: 0,
                paymentMode: 'UPI'
            },
            status: 'Submitted',
            createdAt: new Date().toISOString(),
            projectAnalysis: {
                projectId: '',
                discussionMode: '',
                monitoringParticipate: false
            }
        };
    }
}
