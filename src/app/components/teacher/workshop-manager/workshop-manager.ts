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
            dateTime: ['', Validators.required],
            duration: [1, [Validators.required, Validators.min(1)]],
            schedule: this.fb.array([]),
            workshopType: ['online', Validators.required],
            onlineFee: [0, Validators.required],
            offlineFee: [0, Validators.required]
        });

        this.workshopForm.get('duration')?.valueChanges.subscribe(val => {
            if (val > 0) {
                this.generateScheduleRows(val);
            }
        });
    }

    get schedule(): FormArray {
        return this.workshopForm.get('schedule') as FormArray;
    }

    generateScheduleRows(duration: number) {
        const currentLength = this.schedule.length;
        if (duration > currentLength) {
            for (let i = currentLength + 1; i <= duration; i++) {
                this.schedule.push(this.fb.group({
                    hour: [i],
                    activity: ['', Validators.required]
                }));
            }
        } else if (duration < currentLength) {
            for (let i = currentLength; i > duration; i--) {
                this.schedule.removeAt(i - 1);
            }
        }
    }

    toggleWorkshopCreation() {
        this.isCreatingWorkshop.set(!this.isCreatingWorkshop());
    }

    onSubmitWorkshopForm() {
        if (this.workshopForm.valid) {
            const formValue = this.workshopForm.getRawValue();
            console.log('Workshop Created:', formValue);
            alert('Workshop created successfully!');

            // Add to list (mock)
            const newWorkshop = {
                id: `ws-00${this.workshopsList().length + 1}`,
                title: formValue.workshopTitle,
                description: formValue.workshopDescription,
                instructor: this.currentUser().name,
                date: formValue.dateTime.split('T')[0],
                duration: `${formValue.duration} Hours`,
                type: formValue.workshopType === 'online' ? 'Online' : 'Offline',
                fee: formValue.workshopType === 'online' ? formValue.onlineFee : formValue.offlineFee
            };

            this.workshopsList.update(list => [newWorkshop, ...list]);
            this.isCreatingWorkshop.set(false);
            this.workshopForm.reset({
                workshopType: 'online',
                onlineFee: 0,
                offlineFee: 0
            });
            this.schedule.clear();
        } else {
            alert('Please fill in all required fields.');
        }
    }
}
