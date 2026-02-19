import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LayoutComponent } from '../../components/layout/layout';

@Component({
    selector: 'app-public-workshops-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LayoutComponent],
    templateUrl: './workshops.html',
    styles: [`
        .workshops-container {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .view-header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .page-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
        }

        .section-subtitle {
            color: var(--text-secondary);
            font-size: 1.1rem;
        }

        .course-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }

        .course-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 1.5rem;
            transition: all 0.3s ease;
            cursor: pointer;
            backdrop-filter: blur(10px);

            &:hover {
                transform: translateY(-5px);
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(255, 255, 255, 0.2);
            }

            .course-icon {
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #FF6B00 0%, #FF8800 100%);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 1rem;
                font-size: 1.2rem;
                color: white;
            }

            .course-title {
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 0.5rem;
            }

            .course-desc {
                color: var(--text-secondary);
                font-size: 0.9rem;
                line-height: 1.5;
                margin-bottom: 1rem;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .course-meta {
                display: flex;
                gap: 1rem;
                margin-bottom: 1rem;
                font-size: 0.85rem;
                color: var(--text-secondary);
                
                span {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }
            }

            .course-action {
                color: #FF6B00;
                font-weight: 600;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
        }

        .btn-back {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0;
            
            &:hover {
                color: var(--text-primary);
            }
        }

        .workshop-preview-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;

            .workshop-title {
                font-size: 2rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 1rem;
            }

            .workshop-desc {
                color: var(--text-secondary);
                font-size: 1.1rem;
                line-height: 1.6;
                margin-bottom: 1.5rem;
            }

            .workshop-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 2rem;
                
                span {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-primary);
                    font-size: 0.95rem;
                    
                    i {
                        color: #FF6B00;
                    }
                }
            }
        }

        .research-form-container {
            background: rgba(20, 20, 20, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 2.5rem;
            max-width: 800px;
            margin: 0 auto;
        }

        .form-section {
            margin-bottom: 2.5rem;
            
            h3 {
                font-size: 1.25rem;
                color: var(--text-primary);
                margin-bottom: 1.5rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-row {
            display: flex;
            gap: 1.5rem;
            margin-bottom: 1.5rem;
            
            .flex-1 {
                flex: 1;
            }
        }

        .form-label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-secondary);
            font-size: 0.9rem;
            font-weight: 500;
        }

        .form-control {
            width: 100%;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 0.75rem 1rem;
            color: var(--text-primary);
            font-size: 1rem;
            transition: all 0.2s ease;

            &:focus {
                outline: none;
                border-color: #FF6B00;
                background: rgba(255, 255, 255, 0.08);
            }
        }

        .btn-submit {
            width: 100%;
            background: linear-gradient(135deg, #FF6B00 0%, #FF8800 100%);
            color: white;
            border: none;
            padding: 1rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
            }
            
            &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
        }

        .radio-group {
            display: flex;
            gap: 2rem;
        }

        .radio-option, .checkbox-option {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-primary);
            cursor: pointer;
            
            input {
                accent-color: #FF6B00;
                width: 18px;
                height: 18px;
            }
        }

        .animate-fade-in {
            animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
            .form-row {
                flex-direction: column;
                gap: 1.5rem;
            }
            
            .workshop-meta {
                gap: 1rem;
                flex-direction: column;
                align-items: flex-start;
            }

            .radio-group {
                flex-direction: column;
                gap: 1rem;
            }
        }
    `]
})
export class PublicWorkshopsPageComponent {
    private fb = inject(FormBuilder);
    public authService = inject(AuthService);

    currentUser = this.authService.currentUserProfile;

    enrollWorkshopForm!: FormGroup;
    selectedWorkshop = signal<any>(null);
    showWorkshopEnrollment = signal<boolean>(false);

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

    constructor() {
        this.initializeEnrollWorkshopForm();
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

    selectWorkshop(workshop: any) {
        this.selectedWorkshop.set(workshop);
        this.showWorkshopEnrollment.set(true);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    closeWorkshopEnrollment() {
        this.selectedWorkshop.set(null);
        this.showWorkshopEnrollment.set(false);
        this.enrollWorkshopForm.reset({
            enrollmentType: 'learning'
        });
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
