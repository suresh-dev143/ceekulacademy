import { Component, signal, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NeuronService } from '../../services/neuron.service';
import { environment } from '../../../environments/environment';
import { LayoutComponent } from '../../components/layout/layout';

// Neuron valuation response shape
interface ValuationResponse {
  success:        boolean;
  neuronValueINR: number;
  simulationPhase: boolean;
  example: { inr1000ToNeurons: number; neurons100ToINR: number };
}

@Component({
  selector: 'app-contribute',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, LayoutComponent],
  templateUrl: './contribute.html',
  styleUrl: './contribute.scss',
})
export class Contribute implements OnInit {
  readonly neuronService = inject(NeuronService);
  private readonly fb         = inject(FormBuilder);
  private readonly http       = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  // Simulation mode: no external provider execution is active.
  readonly simulationMode = environment.simulationMode ?? true;

  contributionForm!: FormGroup;
  contributionLoading = signal(false);
  contributionError   = signal<string | null>(null);
  contributionSuccess = signal<string | null>(null);

  // Current neuron valuation — 1N = 1 INR in Phase 1 (Mission)
  neuronValueINR     = signal<number>(1.0);
  valuationPhase     = signal<'simulation' | 'civilizational'>('simulation');
  // Future: neuronValueINR = totalUniversalProduction / totalNeuronsInCirculation

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.neuronService.loadAll();
      this._loadValuation();
    }
    this.contributionForm = this.fb.group({
      entityType: ['', Validators.required],
      entityName: ['', [Validators.required, Validators.minLength(3)]],
      simulationUnits:  ['', [Validators.required, Validators.min(1)]],
      notes:      [''],
    });
  }

  onSubmitContribution(): void {
    if (this.contributionForm.invalid) { this.contributionForm.markAllAsTouched(); return; }
    this.contributionLoading.set(true);
    this.contributionError.set(null);
    this.contributionSuccess.set(null);

    // Call the internal simulation endpoint instead of any external provider layer.
    const formValue = this.contributionForm.value;
    const payload = {
      entityType: formValue.entityType,
      entityName: formValue.entityName,
      simulationUnits: Number(formValue.simulationUnits),
      notes: formValue.notes,
      simulationMode: true,
      transactionReference: `SIM-${Date.now()}`,
    };

    this.http.post<{ status: boolean; data: { neuronsIssued: number } }>(
      `${environment.apiUrl}/api/simulation/contribute`,
      payload,
    ).subscribe({
      next: (res) => {
        this.contributionLoading.set(false);
        const units = res.data?.neuronsIssued ?? payload.simulationUnits;
        this.contributionSuccess.set(
          `✓ ${units} simulation units credited to your FUN bucket. ` +
          `Ledger entry + UCRS commit generated.`,
        );
        this.contributionForm.reset();
        this.neuronService.loadAll();
      },
      error: (e) => {
        this.contributionLoading.set(false);
        this.contributionError.set(e?.error?.message ?? 'Simulation credit failed. Please try again.');
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

  /** INR amount typed in the form → neuron preview */
  inrToNeuronPreview(amountINR: number): number {
    return Math.floor(amountINR / this.neuronValueINR());
  }

  private _loadValuation(): void {
    this.http.get<ValuationResponse>(
      `${environment.apiUrl}/neurons/valuation`
    ).subscribe({
      next: (res) => {
        if (res?.success) {
          this.neuronValueINR.set(res.neuronValueINR);
          this.valuationPhase.set(res.simulationPhase ? 'simulation' : 'civilizational');
        }
      },
      error: () => { /* server not yet seeded — fallback to 1 INR */ },
    });
  }
}
