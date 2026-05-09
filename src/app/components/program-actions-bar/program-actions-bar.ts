import { Component, signal, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type Panel = 'schedule' | 'enrol' | null;

@Component({
  selector: 'app-program-actions-bar',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: ``,
  styles: ``,
})
export class ProgramActionsBarComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  activePanel = signal<Panel>(null);
  schedulePhase = signal<1 | 2>(1);
  enrolPhase = signal<1 | 2>(1);
  scheduleSubmitted = signal(false);
  enrolSubmitted = signal(false);

  readonly categories = [
    'Innovative Courses',
    'Futuristic Research',
    'Project Development',
    'Webinars',
    'Workshops',
    'Community Services',
    'Harmony & Peace',
  ];

  scheduleForm = this.fb.group({
    category: ['', Validators.required],
    title: ['', Validators.required],
    subtitle: ['', Validators.required],
    dateTime: ['', Validators.required],
    duration: ['', Validators.required],
    description: ['', Validators.required],
    format: ['online', Validators.required],
    audience: [''],
    maxParticipants: [null as number | null],
  });

  enrolForm = this.fb.group({
    category: ['', Validators.required],
    title: ['', Validators.required],
    subtitle: ['', Validators.required],
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    background: ['', Validators.required],
    whyEnrol: ['', Validators.required],
    startDate: [''],
  });

  openCreate(): void {
    this.router.navigate(['/personal/programs/create']);
  }

  togglePanel(panel: 'schedule' | 'enrol'): void {
    if (this.activePanel() === panel) {
      this.activePanel.set(null);
    } else {
      this.activePanel.set(panel);
      if (panel === 'schedule') {
        this.schedulePhase.set(1);
        this.scheduleSubmitted.set(false);
      } else {
        this.enrolPhase.set(1);
        this.enrolSubmitted.set(false);
      }
    }
  }

  get schedulePhase1Valid(): boolean {
    const { category, title, subtitle } = this.scheduleForm.controls;
    return category.valid && title.valid && subtitle.valid;
  }

  get enrolPhase1Valid(): boolean {
    const { category, title, subtitle } = this.enrolForm.controls;
    return category.valid && title.valid && subtitle.valid;
  }

  continueSchedule(): void { this.schedulePhase.set(2); }
  continueEnrol(): void { this.enrolPhase.set(2); }

  submitSchedule(): void {
    if (this.scheduleForm.valid) {
      console.log('Schedule:', this.scheduleForm.value);
      this.scheduleSubmitted.set(true);
      this.scheduleForm.reset({ format: 'online' });
      this.schedulePhase.set(1);
    } else {
      this.scheduleForm.markAllAsTouched();
    }
  }

  submitEnrol(): void {
    if (this.enrolForm.valid) {
      console.log('Enrol:', this.enrolForm.value);
      this.enrolSubmitted.set(true);
      this.enrolForm.reset();
      this.enrolPhase.set(1);
    } else {
      this.enrolForm.markAllAsTouched();
    }
  }
}
