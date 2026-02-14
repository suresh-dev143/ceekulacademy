import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export type InvestmentArea =
    | 'Health'
    | 'Study / Education'
    | 'Infrastructure'
    | 'Research'
    | 'Community Development'
    | 'Emergency / Relief'
    | 'Other';

export type ScopeType = 'Location' | 'Project';

export type AssetType =
    | 'Money'
    | 'Land'
    | 'Services / Human Resources'
    | 'Equipment / Material'
    | 'Technology / IP'
    | 'Other';

export type InvestmentStatus = 'Submitted' | 'Under Review' | 'Verified' | 'Allocated' | 'In Use' | 'Completed';

export interface AssetInvestment {
    id?: string;
    investorName: string;
    contact?: {
        phone?: string;
        email?: string;
    };
    area: InvestmentArea;
    purposeStatement?: string;
    scopeType: ScopeType;
    location?: {
        area?: string;
        city?: string;
        district?: string;
        state?: string;
        country?: string;
        pincode?: string;
    };
    projectRef?: {
        projectId?: string;
        projectName?: string;
    };
    assetType: AssetType;
    assetDetails: {
        // Money
        currency?: string;
        amount?: number;
        paymentMode?: string;

        // Land
        landAddress?: string;
        landArea?: string;
        ownershipType?: string;
        usagePermission?: string;

        // Services / HR
        serviceType?: string;
        peopleCount?: number;
        availability?: {
            startDate?: string;
            endDate?: string;
            hoursPerWeek?: number;
        };
        mode?: 'On-site' | 'Remote' | 'Hybrid';

        // Equipment
        description?: string;
        quantity?: number;
        condition?: string;
    };
    projectAnalysis: {
        projectId?: string;
        discussionMode?: string;
        monitoringParticipate?: boolean;
    };
    status: InvestmentStatus;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class AssetInvestmentService {

    submitInvestment(investment: AssetInvestment): Observable<{ success: boolean, refId: string }> {
        // Mock submission
        return of({
            success: true,
            refId: 'INV-' + Math.floor(Math.random() * 1000000)
        }).pipe(delay(2000));
    }
}
