import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-return',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './payment-return.html',
})
export class PaymentReturn {
  private readonly router = inject(Router);

  goToSimulation(): void {
    this.router.navigate(['/contribute']);
  }
}