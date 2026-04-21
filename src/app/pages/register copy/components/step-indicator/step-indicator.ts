import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-indicator',
  imports: [CommonModule],
  templateUrl: './step-indicator.html',
  styleUrl: './step-indicator.scss'
})
export class StepIndicator {
  currentStep = input.required<number>();
  totalSteps = input.required<number>();

  readonly stepLabel = computed(() =>
    `Step ${this.currentStep()} of ${this.totalSteps()}`
  );

  readonly progressPercentage = computed(() =>
    (this.currentStep() / this.totalSteps()) * 100
  );

  readonly steps = computed(() => {
    const current = this.currentStep();
    const total = this.totalSteps();
    return Array.from({ length: total }, (_, i) => ({
      number: i + 1,
      isActive: i + 1 === current,
      isCompleted: i + 1 < current
    }));
  });
}
