import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
    ResearchService,
    ResearchCategory,
    ResearchStatus,
    ResearchLevel,
} from '../../services/research.service';
import { LayoutComponent } from '../../components/layout/layout';
import { RouterLink } from '@angular/router';

type CategoryFilter = 'All' | ResearchCategory;
type StatusFilter   = 'All' | ResearchStatus;
type LevelFilter    = 'All' | ResearchLevel;
type MentorFilter   = 'All' | 'Yes' | 'No';

@Component({
    selector: 'app-research-page',
    standalone: true,
    imports: [CommonModule, FormsModule, LayoutComponent, RouterLink],
    templateUrl: './research.html',
    styleUrl: './research.scss',
})
export class ResearchPageComponent {

    private router      = inject(Router);
    private authService = inject(AuthService);
    private researchSvc = inject(ResearchService);

    currentUser  = this.authService.currentUserProfile;
    isResearcher = computed(() => this.currentUser().role === 'Researcher');

    // ── Filter state ───────────────────────────────────────────────────
    searchQuery    = signal('');
    categoryFilter = signal<CategoryFilter>('All');
    statusFilter   = signal<StatusFilter>('All');
    levelFilter    = signal<LevelFilter>('All');
    mentorFilter   = signal<MentorFilter>('All');

    categoryOptions: CategoryFilter[] = ['All', 'AI', 'Machine Learning', 'Physics', 'Social Science', 'Biotechnology', 'Custom'];
    statusOptions:   StatusFilter[]   = ['All', 'Open', 'In Progress', 'Completed'];
    levelOptions:    LevelFilter[]    = ['All', 'Beginner', 'Intermediate', 'Advanced'];
    mentorOptions:   MentorFilter[]   = ['All', 'Yes', 'No'];

    // ── Computed filtered list ─────────────────────────────────────────
    filteredResearch = computed(() => {
        const q    = this.searchQuery().toLowerCase().trim();
        const cat  = this.categoryFilter();
        const stat = this.statusFilter();
        const lvl  = this.levelFilter();
        const men  = this.mentorFilter();

        return this.researchSvc.researches().filter(r => {
            if (q && !r.title.toLowerCase().includes(q)
                  && !r.description.toLowerCase().includes(q)
                  && !r.createdBy.toLowerCase().includes(q)) return false;
            if (cat  !== 'All' && r.category !== cat)  return false;
            if (stat !== 'All' && r.status   !== stat) return false;
            if (lvl  !== 'All' && r.level    !== lvl)  return false;
            if (men === 'Yes'  && !r.mentorAvailable)  return false;
            if (men === 'No'   &&  r.mentorAvailable)  return false;
            return true;
        });
    });

    activeFilterCount = computed(() => {
        let n = 0;
        if (this.searchQuery())              n++;
        if (this.categoryFilter() !== 'All') n++;
        if (this.statusFilter()   !== 'All') n++;
        if (this.levelFilter()    !== 'All') n++;
        if (this.mentorFilter()   !== 'All') n++;
        return n;
    });

    clearFilters() {
        this.searchQuery.set('');
        this.categoryFilter.set('All');
        this.statusFilter.set('All');
        this.levelFilter.set('All');
        this.mentorFilter.set('All');
    }

    // ── Right panel — Researcher ───────────────────────────────────────
    interestedStudents = this.researchSvc.interestedStudents;
    pendingRequests    = this.researchSvc.pendingRequests;
    mentorshipSessions = this.researchSvc.mentorshipSessions;

    // ── Right panel — Student ─────────────────────────────────────────
    myActiveResearch = signal([
        { title: 'Predictive Crop Yield using Ensemble ML', status: 'In Progress', progress: 42 },
    ]);
    assignedMentor = signal({ name: 'Dr. Arjun Mehta', nextSession: 'Mar 4, 2026 · 02:00 PM' });
    deadlines = signal([
        { task: 'Submit Literature Review', due: 'Mar 10, 2026' },
        { task: 'Data Collection Phase',    due: 'Mar 25, 2026' },
        { task: 'Final Report Submission',  due: 'Apr 15, 2026' },
    ]);

    // ── Create modal ──────────────────────────────────────────────────
    showCreateModal = signal(false);

    newTitle           = signal('');
    newCategory        = signal<ResearchCategory>('AI');
    newDescription     = signal('');
    newSkills          = signal('');
    newLevel           = signal<ResearchLevel>('Beginner');
    newDuration        = signal('');
    newMentorAvailable = signal(false);

    openCreateModal()  { this.showCreateModal.set(true); }
    closeCreateModal() { this.showCreateModal.set(false); }

    submitResearch() {
        if (!this.newTitle().trim() || !this.newDescription().trim()) return;
        this.researchSvc.addResearch({
            title:           this.newTitle(),
            category:        this.newCategory(),
            description:     this.newDescription(),
            level:           this.newLevel(),
            status:          'Open',
            createdBy:       this.currentUser().name,
            mentorAvailable: this.newMentorAvailable(),
            skills:          this.newSkills().split(',').map(s => s.trim()).filter(Boolean),
            duration:        this.newDuration(),
        });
        this.closeCreateModal();
        this.newTitle.set('');
        this.newCategory.set('AI');
        this.newDescription.set('');
        this.newSkills.set('');
        this.newLevel.set('Beginner');
        this.newDuration.set('');
        this.newMentorAvailable.set(false);
    }
}
