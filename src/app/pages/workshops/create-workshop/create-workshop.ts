import { Component, inject, output, signal, input, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormArray, FormBuilder, FormGroup,
    ReactiveFormsModule, Validators
} from '@angular/forms';
import { WorkshopService, CreateWorkshopRequest, CreatedWorkshopData, WorkshopListItem } from '../../../services/workshop.service';
import { ClaudeService, WorkshopGenResult } from '../../../services/claude.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { RazorpayService } from '../../../services/razorpay.service';

@Component({
    selector: 'app-create-workshop',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './create-workshop.html',
    styleUrl: './create-workshop.scss',
})
export class CreateWorkshop implements OnInit {

    private fb = inject(FormBuilder);
    private ws = inject(WorkshopService);
    private claude = inject(ClaudeService);
    private auth = inject(AuthService);
    private toast = inject(ToastService);
    private razorpay = inject(RazorpayService);

    workshopForm!: FormGroup;
    isSubmitting = signal(false);
    workshopCreated = output<CreatedWorkshopData>();
    cancel = output<void>();

    // ── AI Generator ──────────────────────────────────────────────────────────
    showAiPanel  = signal(false);
    isGenerating = signal(false);
    aiGenerated  = signal(false);
    aiTopic      = signal('');
    aiAudience   = signal<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
    aiLanguage   = signal('English');
    aiMode       = signal<'ONLINE' | 'OFFLINE'>('ONLINE');

    get totalCommission(): number {
        return 0; // Handled at schedule creation step instead
    }

    // ── Symbol Picker ─────────────────────────────────────────────────────────
    readonly symbolCategories = [
        { label: 'Greek',   symbols: ['α','β','γ','δ','ε','ζ','η','θ','κ','λ','μ','ν','ξ','π','ρ','σ','τ','υ','φ','χ','ψ','ω','Γ','Δ','Θ','Λ','Ξ','Π','Σ','Υ','Φ','Ψ','Ω'] },
        { label: 'Math',    symbols: ['±','∓','×','÷','≠','≤','≥','≈','≡','∝','∞','√','∛','∑','∏','∫','∂','∇','∈','∉','⊂','⊃','∪','∩','∅','∀','∃','¬','∧','∨','⟨','⟩'] },
        { label: 'Physics', symbols: ['ħ','ℏ','ℓ','Å','°','′','″','→','←','↑','↓','↔','⇒','⇔','⊕','⊗','⊙','∇²','~'] },
        { label: 'Powers',  symbols: ['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹','₀','₁','₂','₃','₄','₅','₆','₇','₈','₉'] },
    ];

    showSymbols      = signal(false);
    activeSymbolTab  = signal(0);
    private lastFocusedEl: HTMLTextAreaElement | HTMLInputElement | null = null;

    onFieldFocus(el: HTMLTextAreaElement | HTMLInputElement) {
        this.lastFocusedEl = el;
    }

    toggleSymbols() { this.showSymbols.update(v => !v); }

    insertSymbol(sym: string) {
        const el = this.lastFocusedEl;
        if (!el) return;
        const start = el.selectionStart ?? el.value.length;
        const end   = el.selectionEnd   ?? el.value.length;
        el.value = el.value.slice(0, start) + sym + el.value.slice(end);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.focus();
        el.setSelectionRange(start + sym.length, start + sym.length);
    }

    // ── Edit Mode Support ──────────────────────────────────────────────────
    workshopToEdit = input<WorkshopListItem | null>(null);
    isEditMode = computed(() => !!this.workshopToEdit());

    constructor() {
        this.workshopForm = this.fb.group({
            workshopTitle: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
            workshopDescription: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
            expertDescription: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
            threeHourPlan: this.fb.group({
                hour1: this.fb.group({
                    title: ['', Validators.required],
                    description: ['', Validators.required],
                    expertAllowed: [true],
                    instructorAllowed: [false],
                    videos: this.fb.array([]),
                    images: this.fb.array([])
                }),
                hour2: this.fb.group({
                    title: [{ value: 'Hands On', disabled: true }, Validators.required],
                    description: ['', Validators.required],
                    expertAllowed: [true],
                    instructorAllowed: [false],
                    videos: this.fb.array([]),
                    images: this.fb.array([])
                }),
                hour3: this.fb.group({
                    title: ['Project Discussion', Validators.required],
                    description: ['', Validators.required],
                    expertAllowed: [true],
                    instructorAllowed: [false],
                    videos: this.fb.array([]),
                    images: this.fb.array([])
                })
            })
        });
    }

    ngOnInit() {
        const editData = this.workshopToEdit();
        if (editData) {
            this.workshopForm.patchValue({
                workshopTitle: editData.workshopTitle,
                workshopDescription: editData.workshopDescription,
                expertDescription: editData.expertDescription,
            });

            if (editData.threeHourPlan) {
                this.workshopForm.patchValue({
                    threeHourPlan: editData.threeHourPlan
                });
                // Populate media FormArrays from edit data
                (['hour1', 'hour2', 'hour3'] as const).forEach(hour => {
                    const hourData = editData.threeHourPlan![hour] as any;
                    (hourData?.videos || []).forEach((url: string) =>
                        this.getHourVideos(hour).push(this.fb.control(url)));
                    (hourData?.images || []).forEach((url: string) =>
                        this.getHourImages(hour).push(this.fb.control(url)));
                });
            }
        }
    }

    // ── AI Generation ─────────────────────────────────────────────────────────

    generateWithAI() {
        const topic = this.aiTopic().trim();
        if (!topic) { this.toast.error('Please enter a workshop topic.'); return; }

        this.isGenerating.set(true);
        this.claude.generateWorkshop({
            topic,
            audience: this.aiAudience(),
            language: this.aiLanguage(),
            mode:     this.aiMode()
        }).subscribe({
            next: (res) => {
                this.isGenerating.set(false);
                this.applyGeneratedWorkshop(res.data);
            },
            error: () => {
                this.isGenerating.set(false);
                this.toast.error('AI generation failed. Please try again.');
            }
        });
    }

    private applyGeneratedWorkshop(data: WorkshopGenResult) {
        const fmt = (arr: string[], prefix = '') =>
            arr?.length ? `${prefix}${arr.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : '';

        const hour1Desc = [
            data.hour1.explanation || '',
            data.hour1.keyConcepts?.length  ? `\n\nKey Concepts: ${data.hour1.keyConcepts.join(', ')}` : '',
            data.hour1.examples?.length     ? `\n\nExamples:\n${fmt(data.hour1.examples)}` : ''
        ].join('').trim().slice(0, 1000);

        const hour2Desc = [
            fmt(data.hour2.practicalExercises, 'Exercises:\n'),
            data.hour2.stepByStepTasks?.length ? `\n\nStep-by-Step:\n${fmt(data.hour2.stepByStepTasks)}` : '',
            data.hour2.realWorldUseCase        ? `\n\nReal-World Use Case: ${data.hour2.realWorldUseCase}` : ''
        ].join('').trim().slice(0, 1000);

        const hour3Desc = [
            fmt(data.hour3.discussionQuestions, 'Discussion Questions:\n'),
            data.hour3.caseStudies?.length ? `\n\nCase Studies:\n${fmt(data.hour3.caseStudies)}` : '',
            data.hour3.qaPrompts?.length   ? `\n\nQ&A Prompts:\n${fmt(data.hour3.qaPrompts)}` : ''
        ].join('').trim().slice(0, 1000);

        this.workshopForm.patchValue({
            workshopTitle:       (data.workshopTitle  || '').slice(0, 100),
            workshopDescription: (data.longDescription || '').slice(0, 1000),
        });

        this.workshopForm.get('threeHourPlan.hour1.title')?.setValue((data.hour1.title || '').slice(0, 100));
        this.workshopForm.get('threeHourPlan.hour1.description')?.setValue(hour1Desc);
        this.workshopForm.get('threeHourPlan.hour2.description')?.setValue(hour2Desc);
        this.workshopForm.get('threeHourPlan.hour3.title')?.setValue((data.hour3.title || 'Open Discussion').slice(0, 100));
        this.workshopForm.get('threeHourPlan.hour3.description')?.setValue(hour3Desc);

        this.aiGenerated.set(true);
        this.showAiPanel.set(false);
        this.toast.success('Workshop content generated and filled in!');
    }

    // ── Media helpers ─────────────────────────────────────────────────────────

    getHourVideos(hour: 'hour1' | 'hour2' | 'hour3'): FormArray {
        return this.workshopForm.get(`threeHourPlan.${hour}.videos`) as FormArray;
    }

    getHourImages(hour: 'hour1' | 'hour2' | 'hour3'): FormArray {
        return this.workshopForm.get(`threeHourPlan.${hour}.images`) as FormArray;
    }

    addHourVideo(hour: 'hour1' | 'hour2' | 'hour3') {
        this.getHourVideos(hour).push(this.fb.control(''));
    }

    removeHourVideo(hour: 'hour1' | 'hour2' | 'hour3', index: number) {
        this.getHourVideos(hour).removeAt(index);
    }

    addHourImage(hour: 'hour1' | 'hour2' | 'hour3') {
        this.getHourImages(hour).push(this.fb.control(''));
    }

    removeHourImage(hour: 'hour1' | 'hour2' | 'hour3', index: number) {
        this.getHourImages(hour).removeAt(index);
    }

    // ── Error helpers (called from template) ─────────────────────────────────

    fieldError(path: string): boolean {
        const c = this.workshopForm.get(path);
        return !!(c?.invalid && c.touched);
    }

    fieldHasError(path: string, key: string): boolean {
        const c = this.workshopForm.get(path);
        return !!(c?.hasError(key) && c.touched);
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    onSubmit() {
        this.workshopForm.markAllAsTouched();
        if (this.workshopForm.invalid || this.isSubmitting()) return;
        console.log(this.workshopForm.value);
        const userId = this.auth.currentUserProfile()?.id;
        if (!userId && !this.isEditMode()) {
            this.toast.error('You must be logged in to create a workshop.');
            return;
        }

        const v = this.workshopForm.getRawValue();
        const editData = this.workshopToEdit();

        if (this.isEditMode() && editData) {
            this.proceedWithSave(v, editData);
        } else {
            // New workshop
            this.proceedWithSave(v);
        }
    }

    private proceedWithSave(v: any, editData?: WorkshopListItem) {
        this.isSubmitting.set(true);

        if (editData) {
            // Update Basic Info
            const updatePayload = {
                workshopTitle: v.workshopTitle.trim(),
                workshopDescription: v.workshopDescription.trim(),
                expertDescription: v.expertDescription.trim(),
                threeHourPlan: v.threeHourPlan,
                schedules: []
            };

            this.ws.updateWorkshop(editData._id, updatePayload).subscribe({
                next: (res: any) => {
                    this.isSubmitting.set(false);
                    this.toast.success('Workshop updated successfully!');
                    this.workshopCreated.emit(res.data as unknown as CreatedWorkshopData);
                },
                error: () => this.isSubmitting.set(false),
            });
        } else {
            // Create New
            const payload: CreateWorkshopRequest = {
                workshopTitle: v.workshopTitle.trim(),
                workshopDescription: v.workshopDescription.trim(),
                expertDescription: v.expertDescription.trim(),
                threeHourPlan: v.threeHourPlan,
                schedules: []
            };

            this.ws.create(payload).subscribe({
                next: (res: any) => {
                    this.isSubmitting.set(false);
                    this.workshopCreated.emit(res.data);
                },
                error: () => this.isSubmitting.set(false),
            });
        }
    }

    onCancel() { this.cancel.emit(); }
}
