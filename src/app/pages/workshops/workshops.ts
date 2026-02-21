import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LayoutComponent } from '../../components/layout/layout';

@Component({
    selector: 'app-public-workshops-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, LayoutComponent],
    templateUrl: './workshops.html',
    styleUrl: './workshops.scss',
})
export class PublicWorkshopsPageComponent {
    private fb = inject(FormBuilder);
    public authService = inject(AuthService);
    currentUser = this.authService.currentUserProfile;
    enrollWorkshopForm!: FormGroup;
    workshopForm!: FormGroup;
    selectedWorkshop = signal<any>(null);
    showWorkshopEnrollment = signal<boolean>(false);
    isCreatingWorkshop = signal<boolean>(false);

    // --- Filter options ---
    dateOptions = ['Any', 'Today', 'This Week', 'This Month'] as const;
    modeOptions = ['All', 'Online', 'Offline'] as const;
    availabilityOptions = ['All', 'Available', 'Not Available'] as const;

    // --- Filter signals ---
    searchQuery   = signal<string>('');
    modeFilter    = signal<'All' | 'Online' | 'Offline'>('All');
    dateFilter    = signal<'Any' | 'Today' | 'This Week' | 'This Month'>('Any');
    availabilityFilter = signal<'All' | 'Available' | 'Not Available'>('All');
    selectedDate  = signal<string>('');  // Specific date selection (YYYY-MM-DD)
    startTime     = signal<string>('');  // Start time (HH:mm)
    endTime       = signal<string>('');  // End time (HH:mm)
    locationQuery = signal<string>('');
    maxDistance   = signal<number>(0);   // 0 = any distance

    // Mock locations for hybrid mode
    registeredLocations = signal<string[]>(['Central Library', 'Innovation Hub', 'Community Center', 'Tech Park']);

    workshopsList = signal<any[]>([
        {
            id: 'ws-001',
            title: 'AI for Everyone',
            description: '',
            instructor: 'Dr. Rashmi Chandra & Keshan',
            date: '2026-03-15',
            startTime: '09:00',
            endTime: '12:00',
            duration: '3 Hours',
            type: 'Online',
            fee: 100,
            city: 'Online',
            distance: 0,
            instructorAvailable: true
        },
        {
            id: 'ws-002',
            title: 'AI for Healthcare',
            description: '',
           instructor: 'Dr. Rashmi Chandra & Keshan',
           date: '2026-03-20',
           startTime: '14:00',
           endTime: '17:00',
            duration: '3 Hours',
            type: 'Online',
            fee: 100,
            city: 'Online',
            distance: 0,
            instructorAvailable: true
        },
        {
            id: 'ws-003',
            title: 'AI for Film Education',
            description: '',
          instructor: 'Keshan',
           date: '2026-03-25',
           startTime: '10:00',
           endTime: '13:00',
            duration: '3 Hours',
            type: 'Online',
            fee: 100,
            city: 'Online',
            distance: 0,
            instructorAvailable: false
        },
        {
            id: 'ws-004',
            title: 'AI for Web Automation',
            description: '',
         instructor: 'Keshan',
           date: '2026-04-05',
           startTime: '15:30',
           endTime: '18:30',
            duration: '3 Hours',
            type: 'Online',
            fee: 100,
            city: 'Online',
            distance: 0,
            instructorAvailable: true
        },


    ]);

    filteredWorkshops = computed(() => {
        const q    = this.searchQuery().toLowerCase().trim();
        const mode = this.modeFilter();
        const date = this.dateFilter();
        const availability = this.availabilityFilter();
        const selectedDate = this.selectedDate();
        const startTimeFilter = this.startTime();
        const endTimeFilter = this.endTime();
        const loc  = this.locationQuery().toLowerCase().trim();
        const dist = this.maxDistance();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.workshopsList().filter(w => {
            // Text search
            if (q && ![w.title, w.description, w.instructor, w.type, w.city]
                .some(f => f?.toLowerCase().includes(q))) return false;

            // Mode filter
            if (mode !== 'All' && w.type !== mode) return false;

            // Date filter (preset options)
            if (date !== 'Any') {
                const wd = new Date(w.date);
                wd.setHours(0, 0, 0, 0);
                if (date === 'Today') {
                    if (wd.getTime() !== today.getTime()) return false;
                } else if (date === 'This Week') {
                    const week = new Date(today);
                    week.setDate(today.getDate() + 7);
                    if (wd < today || wd > week) return false;
                } else if (date === 'This Month') {
                    if (wd.getMonth() !== today.getMonth() ||
                        wd.getFullYear() !== today.getFullYear()) return false;
                }
            }

            // Specific date selection (calendar picker)
            if (selectedDate) {
                // Format workshop date to YYYY-MM-DD for comparison
                const workshopDateStr = w.date ? new Date(w.date).toISOString().split('T')[0] : '';
                if (workshopDateStr !== selectedDate) return false;
            }

            // Start time filter
            if (startTimeFilter && w.startTime) {
                if (w.startTime < startTimeFilter) return false;
            }

            // End time filter
            if (endTimeFilter && w.endTime) {
                if (w.endTime > endTimeFilter) return false;
            }

            // Instructor availability filter
            if (availability !== 'All') {
                const isAvailable = w.instructorAvailable === true;
                if (availability === 'Available' && !isAvailable) return false;
                if (availability === 'Not Available' && isAvailable) return false;
            }

            // Location text (city contains typed text)
            if (loc && !w.city?.toLowerCase().includes(loc)) return false;

            // Distance filter — only applies to Offline workshops
            if (dist > 0 && w.type === 'Offline' && w.distance > dist) return false;

            return true;
        });
    });

    activeFilterCount = computed(() => {
        let count = 0;
        if (this.modeFilter() !== 'All') count++;
        if (this.dateFilter() !== 'Any') count++;
        if (this.availabilityFilter() !== 'All') count++;
        if (this.selectedDate().trim()) count++;
        if (this.startTime().trim()) count++;
        if (this.endTime().trim()) count++;
        if (this.locationQuery().trim()) count++;
        if (this.maxDistance() > 0) count++;
        return count;
    });

    constructor() {
        this.initializeEnrollWorkshopForm();
        this.initializeWorkshopForm();
    }

    ngOnInit() {
        // Any additional initialization if needed
    }

    initializeEnrollWorkshopForm() {
        this.enrollWorkshopForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', Validators.required],
            organization: [''],
            enrollmentType: ['learning', Validators.required],
            acceptTerms: [false, Validators.requiredTrue]
        });
    }

    initializeWorkshopForm() {
        this.workshopForm = this.fb.group({
            workshopTitle: ['', Validators.required],
            workshopDescription: ['', Validators.required],
            expertDescription: ['', Validators.required],
            schedule: this.fb.array([]),
            workshopMode: ['online', Validators.required],
            instructorType: ['myself', Validators.required],
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
            mode: ['online', Validators.required],
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

            // Calculate duration from schedule
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
                expertDescription: formValue.expertDescription,
                instructor: formValue.instructorType === 'myself' ? this.currentUser().name : 'Open to All',
                date: startDate,
                duration: duration,
                type: formValue.workshopMode === 'online' ? 'Online' : 'Hybrid',
                fee: totalFee,
                city: formValue.workshopMode === 'online' ? 'Online' : 'In-person',
                distance: 0
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

    clearFilters() {
        this.searchQuery.set('');
        this.modeFilter.set('All');
        this.dateFilter.set('Any');
        this.availabilityFilter.set('All');
        this.selectedDate.set('');
        this.startTime.set('');
        this.endTime.set('');
        this.locationQuery.set('');
        this.maxDistance.set(0);
    }

    selectWorkshop(workshop: any) {
        this.selectedWorkshop.set(workshop);
        this.showWorkshopEnrollment.set(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    closeWorkshopEnrollment() {
        this.selectedWorkshop.set(null);
        this.showWorkshopEnrollment.set(false);
        this.enrollWorkshopForm.reset({ enrollmentType: 'learning' });
    }

    onSubmitWorkshopEnrollment() {
        if (this.enrollWorkshopForm.valid) {
            console.log('Workshop Enrollment:', {
                workshop: this.selectedWorkshop(),
                ...this.enrollWorkshopForm.value
            });
            alert('Enrollment submitted successfully!');
            this.closeWorkshopEnrollment();
        } else {
            this.enrollWorkshopForm.markAllAsTouched();
        }
    }
}
