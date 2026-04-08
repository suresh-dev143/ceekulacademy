import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Course } from '../../../services/course.service';

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

    constructor(private fb: FormBuilder) { }

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
