import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Course } from '../../../services/course.service';
import { CreatorService, DraftSummary, CreatorBlock } from '../../../services/creator.service';

@Component({
    selector: 'app-course-form',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './course-form.html',
    styleUrl: './course-form.scss'
})
export class CourseFormComponent implements OnInit {
    @Input() course?: Course;
    @Output() save = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();

    courseForm!: FormGroup;

    categories = ['Innovative Courses', 'Futuristic Research', 'Project Development', 'Online Services', 'Socio-Economic Transformation'];
    levels = ['Beginner', 'Intermediate', 'Advanced'];
    modes = ['Online', 'On-site', 'Offline'];
    pricingOptions = ['Free', 'Paid'];

    // ── Content Picker ─────────────────────────────────────────────────────────
    private _draftsCache     = signal<DraftSummary[] | null>(null);
    contentPickerOpen        = signal(false);
    contentPickerLoading     = signal(false);
    contentPickerQuery       = signal('');
    contentPickerError       = signal('');

    filteredPickerDrafts = computed(() => {
        const all = this._draftsCache() ?? [];
        const q   = this.contentPickerQuery().toLowerCase().trim();
        if (!q) return all;
        return all.filter(d =>
            d.title.toLowerCase().includes(q) ||
            d.domain?.toLowerCase().includes(q) ||
            d.contentTitle?.toLowerCase().includes(q)
        );
    });

    openContentPicker() {
        this.contentPickerOpen.set(true);
        this.contentPickerQuery.set('');
        this.contentPickerError.set('');
        if (this._draftsCache() !== null) return;
        this.contentPickerLoading.set(true);
        this.creatorSvc.listDrafts().subscribe({
            next:  res => { this._draftsCache.set(res.data); this.contentPickerLoading.set(false); },
            error: ()  => { this.contentPickerError.set('Failed to load your content'); this.contentPickerLoading.set(false); },
        });
    }

    closeContentPicker() { this.contentPickerOpen.set(false); }

    applyDraftContent(draft: DraftSummary) {
        this.contentPickerLoading.set(true);
        this.creatorSvc.getDraft(draft.baseId).subscribe({
            next: res => {
                const blocks = ((res as any).data?.blocks as CreatorBlock[]) || [];
                const text   = this._blocksToText(blocks);
                this.courseForm.get('description')?.setValue(text);
                this.contentPickerLoading.set(false);
                this.closeContentPicker();
            },
            error: () => {
                this.contentPickerLoading.set(false);
                this.contentPickerError.set('Failed to load draft content');
            },
        });
    }

    private _blocksToText(blocks: CreatorBlock[]): string {
        return blocks
            .filter(b => b.type === 'text')
            .map(b => ((b.content['html'] as string) || '').replace(/<[^>]+>/g, ' ').trim())
            .join('\n\n')
            .replace(/[ \t]+/g, ' ')
            .trim()
            .slice(0, 2000);
    }

    constructor(private fb: FormBuilder, private creatorSvc: CreatorService) { }

    ngOnInit() {
        this.initForm();
    }

    initForm() {
        this.courseForm = this.fb.group({
            title: [this.course?.title || '', [Validators.required, Validators.minLength(5)]],
            category: [this.course?.category || this.categories[0], Validators.required],
            description: [this.course?.description || '', Validators.required],
            level: [this.course?.level || 'Beginner', Validators.required],
            mode: [this.course?.mode || 'Online', Validators.required],
            duration: [this.course?.duration || '', Validators.required],
            pricing: [this.course?.pricing || 'Free', Validators.required],
            status: [this.course?.status || 'Draft', Validators.required]
        });
    }

    onSubmit() {
        if (this.courseForm.valid) {
            this.save.emit({
                ...(this.course || {}),
                ...this.courseForm.value
            });
        } else {
            this.courseForm.markAllAsTouched();
        }
    }
}
