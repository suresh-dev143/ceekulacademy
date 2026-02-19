import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-workshop-manager',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './workshop-manager.html',
    styleUrl: './workshop-manager.scss'
})
export class WorkshopManagerComponent implements OnInit {
    private fb = inject(FormBuilder);
    public authService = inject(AuthService);
    currentUser = this.authService.currentUserProfile;

    workshopForm!: FormGroup;
    isCreatingWorkshop = signal<boolean>(false);

    // Mock locations for hybrid mode
    registeredLocations = signal<string[]>(['Central Library', 'Innovation Hub', 'Community Center', 'Tech Park']);

    workshopsList = signal<any[]>([
        {
            id: 'ws-001',
            title: 'AI Product Design',
            description: 'Learn to design AI-driven products from scratch.',
            instructor: 'Amit Verma',
            date: '2026-03-15',
            duration: '4 Hours',
            type: 'Online',
            fee: 500
        },
        {
            id: 'ws-002',
            title: 'Industrial Robotics',
            description: 'Hands-on session with industrial automation tools.',
            instructor: 'Dr. Rajesh',
            date: '2026-03-20',
            duration: '6 Hours',
            type: 'Offline',
            fee: 1500
        }
    ]);

    ngOnInit() {
        this.initializeWorkshopForm();
    }

    initializeWorkshopForm() {
        this.workshopForm = this.fb.group({
            workshopTitle: ['', Validators.required],
            workshopDescription: ['', Validators.required],
            schedule: this.fb.array([]),
            workshopMode: ['online', Validators.required],
            instructorType: ['myself', Validators.required], // myself or open
        });

        // Initialize with one schedule row
        this.addScheduleRow();

        // Handle mode changes to toggle location validator
        this.workshopForm.get('workshopMode')?.valueChanges.subscribe(mode => {
            this.updateScheduleValidators(mode);
        });
    }

    get schedule(): FormArray {
        return this.workshopForm.get('schedule') as FormArray;
    }

    addScheduleRow() {
        const currentMode = this.workshopForm?.get('workshopMode')?.value || 'online';
        const isHybrid = currentMode === 'hybrid';

        const row = this.fb.group({
            date: ['', Validators.required],
            startTime: ['', Validators.required],
            endTime: ['', Validators.required],
            activity: ['', Validators.required],
            fee: [0, [Validators.required, Validators.min(0)]],
            location: ['', isHybrid ? Validators.required : []]
        });
        this.schedule.push(row);
    }

    removeScheduleRow(index: number) {
        if (this.schedule.length > 1) {
            this.schedule.removeAt(index);
        }
    }

    updateScheduleValidators(mode: string) {
        const controls = this.schedule.controls;
        controls.forEach(control => {
            const locControl = control.get('location');
            if (mode === 'hybrid') {
                locControl?.setValidators(Validators.required);
            } else {
                locControl?.clearValidators();
                locControl?.setValue('');
            }
            locControl?.updateValueAndValidity();
        });
    }

    toggleWorkshopCreation() {
        this.isCreatingWorkshop.set(!this.isCreatingWorkshop());
    }

    onSubmitWorkshopForm() {
        if (this.workshopForm.valid) {
            const formValue = this.workshopForm.getRawValue();
            console.log('Workshop Created:', formValue);
            alert('Workshop created successfully!');

            // Calculate duration from schedule (simple approximation for now)
            const duration = `${this.schedule.length} Sessions`;

            // Calculate total fee
            const totalFee = formValue.schedule.reduce((acc: number, curr: any) => acc + (curr.fee || 0), 0);

            // Get start date from first session
            const startDate = formValue.schedule.length > 0 ? formValue.schedule[0].date : new Date().toISOString().split('T')[0];

            // Add to list (mock)
            const newWorkshop = {
                id: `ws-00${this.workshopsList().length + 1}`,
                title: formValue.workshopTitle,
                description: formValue.workshopDescription,
                instructor: formValue.instructorType === 'myself' ? this.currentUser().name : 'Open to All',
                date: startDate,
                duration: duration,
                type: formValue.workshopMode === 'online' ? 'Online' : 'Hybrid',
                fee: totalFee
            };

            this.workshopsList.update(list => [newWorkshop, ...list]);
            this.isCreatingWorkshop.set(false);
            this.workshopForm.reset({
                workshopMode: 'online',
                instructorType: 'myself'
            });
            this.schedule.clear();
            this.addScheduleRow();
        } else {
            alert('Please fill in all required fields.');
            this.workshopForm.markAllAsTouched();
        }
    }
}
