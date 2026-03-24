import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { ScheduleService } from './schedule.service';
import { ProfileService, StudentInfo, TeacherInfo, PartnerInfo } from './profile.service';
import { WorkshopService, WorkshopListItem } from './workshop.service';

// ── Core types ─────────────────────────────────────────────────────────────────
export type SearchCategory =
    | 'Course' | 'Schedule' | 'Person' | 'Page' | 'Facility'
    | 'Program' | 'Session' | 'Institution' | 'Document' | 'Report' | 'Workshop';

export type FilterCategory =
    | 'all' | 'programs' | 'courses' | 'sessions'
    | 'users' | 'institutions' | 'documents' | 'reports';

export type SearchStatus =
    | 'active' | 'completed' | 'pending' | 'cancelled' | 'verified' | 'unverified'
    | 'draft' | 'published';

export type DateRange = 'today' | 'this-week' | 'this-month' | '';
export type WorkshopMode = 'online' | 'hybrid' | 'all';
export type SearchScope = 'global' | 'local';

export interface SearchFilters {
    category: FilterCategory;
    status: SearchStatus[];
    dateRange: DateRange;
    scope: SearchScope;
}

export interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    category: SearchCategory;
    icon: string;
    route: string;
    status?: SearchStatus;
}

// ── Static page index ──────────────────────────────────────────────────────────
const PAGES: SearchResult[] = [
    { id: 'p-home', title: 'Home', subtitle: 'Go to home page', category: 'Page', icon: 'fa-home', route: '/home' },
    { id: 'p-about', title: 'About', subtitle: 'Learn about Ceekul Mission', category: 'Page', icon: 'fa-info-circle', route: '/about' },
    { id: 'p-centers', title: 'Centers', subtitle: 'Find learning centers near you', category: 'Page', icon: 'fa-map-marker-alt', route: '/centers' },
    { id: 'p-programs', title: 'Programs', subtitle: 'Browse all educational programs', category: 'Page', icon: 'fa-graduation-cap', route: '/programs' },
    { id: 'p-workshops', title: 'Workshops', subtitle: 'Public workshops and events', category: 'Page', icon: 'fa-chalkboard-teacher', route: '/workshops' },
    { id: 'p-donate', title: 'Donate', subtitle: 'Support Ceekul Mission', category: 'Page', icon: 'fa-heart', route: '/donate' },
    { id: 'p-invest', title: 'Invest', subtitle: 'Investment opportunities', category: 'Page', icon: 'fa-chart-line', route: '/invest' },
    { id: 'p-contact', title: 'Contact', subtitle: 'Get in touch with us', category: 'Page', icon: 'fa-envelope', route: '/contact' },
    { id: 'p-transform', title: 'Transformation', subtitle: 'Socio-economic transformation', category: 'Page', icon: 'fa-exchange-alt', route: '/transformation' },
    { id: 'p-health', title: 'Health Connect', subtitle: 'Health services and resources', category: 'Page', icon: 'fa-heartbeat', route: '/health-connect' },
    { id: 'p-profile', title: 'My Profile', subtitle: 'Your identity and account governance', category: 'Page', icon: 'fa-user-circle', route: '/my-profile' },
    { id: 'p-schedule', title: 'My Schedule', subtitle: 'Your daily operational schedule', category: 'Page', icon: 'fa-calendar-alt', route: '/my-schedule' },
    { id: 'p-innovative', title: 'Innovative Courses', subtitle: 'Explore the innovative curriculum', category: 'Page', icon: 'fa-lightbulb', route: '/innovative' },
    { id: 'p-register', title: 'Register', subtitle: 'Join Ceekul Mission', category: 'Page', icon: 'fa-user-plus', route: '/register' },
    { id: 'p-district', title: 'District', subtitle: 'District-level information', category: 'Page', icon: 'fa-map', route: '/district' },
    { id: 'p-issues', title: 'Issues', subtitle: 'Community issues tracker', category: 'Page', icon: 'fa-exclamation-circle', route: '/issues' },
];

// ── Mapping: FilterCategory → SearchCategory[] ─────────────────────────────────
const FILTER_MAP: Record<FilterCategory, SearchCategory[]> = {
    all: [],
    programs: ['Program'],
    courses: ['Course', 'Workshop'],
    sessions: ['Schedule', 'Session', 'Workshop'],
    users: ['Person'],
    institutions: ['Facility', 'Institution'],
    documents: ['Document'],
    reports: ['Report'],
};

@Injectable({ providedIn: 'root' })
export class SearchService {
    private authService = inject(AuthService);
    private scheduleService = inject(ScheduleService);
    private profileService = inject(ProfileService);
    private workshopService = inject(WorkshopService);

    private _publicWorkshops = signal<WorkshopListItem[]>([]);

    private _recent = signal<string[]>([]);
    readonly recentSearches = this._recent.asReadonly();

    constructor() {
        // Fetch public workshops initially to have them in global search
        this.workshopService.getPublicWorkshops({ limit: 100 }).subscribe(res => {
            if (res.status) this._publicWorkshops.set(res.data.workshops);
        });
    }

    // ── Global Search State (for shared reactive usage) ───────────────────
    globalQuery = signal<string>('');
    globalFilters = signal<SearchFilters>({
        category: 'all',
        status: [],
        dateRange: '',
        scope: 'global'
    });

    // ── Full text search (returns ALL matching, before filter narrowing) ────────
    search(query: string): SearchResult[] {
        const q = query.trim().toLowerCase();
        if (!q) return [];

        const role = this.authService.currentUserRole();
        const all: SearchResult[] = [...PAGES];

        // ── Workshops ──────────────────────────────────────────────────────────
        // If we have no workshops yet, trigger a background refresh for next time
        if (this._publicWorkshops().length === 0) {
             this.workshopService.getPublicWorkshops({ limit: 100 }).subscribe(res => {
                if (res.status) this._publicWorkshops.set(res.data.workshops);
            });
        }

        for (const w of this._publicWorkshops()) {
            all.push({
                id: 'ws-' + w._id,
                title: w.workshopTitle,
                subtitle: `Workshop · ${w.expertDescription}`,
                category: 'Workshop',
                icon: 'fa-chalkboard-teacher',
                route: `/workshops`, 
                status: w.status as any,
            });
        }

        // ── Schedule items (today) ─────────────────────────────────────────────
        const todayStr = new Date().toISOString().split('T')[0];
        const todayItems = this.scheduleService.items().filter(i => i.date === todayStr);

        for (const item of todayItems) {
            const typeIcon =
                item.type === 'class' ? 'fa-chalkboard' :
                    item.type === 'exam' ? 'fa-pen-square' :
                        item.type === 'meeting' ? 'fa-users' : 'fa-clock';
            all.push({
                id: 'sch-' + item.scheduleId,
                title: item.title,
                subtitle: item.teacher
                    ? `${item.startTime}–${item.endTime} · ${item.teacher}`
                    : `${item.startTime}–${item.endTime} · ${item.location}`,
                category: 'Schedule',
                icon: typeIcon,
                route: '/my-schedule',
                status: 'active',
            });

            if (item.teacher) {
                const tid = 'person-t-' + item.teacher.replace(/\s+/g, '-');
                if (!all.find(r => r.id === tid)) {
                    all.push({
                        id: tid,
                        title: item.teacher,
                        subtitle: `Teacher · ${item.title}`,
                        category: 'Person',
                        icon: 'fa-user-tie',
                        route: '/my-schedule',
                    });
                }
            }
        }

        // ── Role-specific data ─────────────────────────────────────────────────
        const roleInfo = this.profileService.profile().roleInfo;

        if (roleInfo.type === 'Student') {
            const si = roleInfo as StudentInfo;
            for (const course of si.enrolledCourses) {
                all.push({
                    id: 'course-' + course.replace(/\s+/g, '-'),
                    title: course,
                    subtitle: `Enrolled · ${si.institution}`,
                    category: 'Course',
                    icon: 'fa-book',
                    route: '/dashboard/courses',
                    status: 'active',
                });
            }
        }

        if (roleInfo.type === 'Teacher') {
            const ti = roleInfo as TeacherInfo;
            for (const subject of ti.subjects) {
                all.push({
                    id: 'subj-' + subject.replace(/\s+/g, '-'),
                    title: subject,
                    subtitle: `Subject · ${ti.qualification}`,
                    category: 'Course',
                    icon: 'fa-book-open',
                    route: '/dashboard/teacher',
                    status: 'active',
                });
            }
            const sampleStudents = ['Arjun Verma', 'Priya Singh', 'Rohan Das', 'Meena Patel', 'Suresh Kumar'];
            for (const name of sampleStudents) {
                all.push({
                    id: 'stu-' + name.replace(/\s+/g, '-'),
                    title: name,
                    subtitle: 'Student · Batch A',
                    category: 'Person',
                    icon: 'fa-user-graduate',
                    route: '/dashboard/teacher',
                });
            }
        }

        if (roleInfo.type === 'Partner') {
            const pi = roleInfo as PartnerInfo;
            for (const facility of pi.approvedFacilities) {
                all.push({
                    id: 'fac-' + facility.replace(/\s+/g, '-'),
                    title: facility,
                    subtitle: `Facility · ${pi.institutionName}`,
                    category: 'Facility',
                    icon: 'fa-building',
                    route: '/dashboard/partner',
                    status: 'active',
                });
            }
            for (const teacher of pi.assignedTeachers) {
                all.push({
                    id: 'pteacher-' + teacher.replace(/\s+/g, '-'),
                    title: teacher,
                    subtitle: `Assigned Teacher · ${pi.institutionName}`,
                    category: 'Person',
                    icon: 'fa-user-tie',
                    route: '/dashboard/partner',
                });
            }
        }

        // ── Director-specific data ─────────────────────────────────────────────
        if (role === 'Director') {
            const dirPrograms: SearchResult[] = [
                { id: 'dprog-youth', title: 'Youth Leadership Program', subtitle: 'District Program · Raebareli', category: 'Program', icon: 'fa-project-diagram', route: '/dashboard/director', status: 'active' },
                { id: 'dprog-women', title: 'Women Empowerment Initiative', subtitle: 'District Program · Raebareli', category: 'Program', icon: 'fa-venus', route: '/dashboard/director', status: 'active' },
                { id: 'dprog-digital', title: 'Digital Literacy Drive', subtitle: 'District Program · Raebareli', category: 'Program', icon: 'fa-laptop', route: '/dashboard/director', status: 'pending' },
                { id: 'dprog-rural', title: 'Rural Education Outreach', subtitle: 'District Program · Raebareli', category: 'Program', icon: 'fa-school', route: '/dashboard/director', status: 'completed' },
            ];
            const dirInstitutions: SearchResult[] = [
                { id: 'inst-mary', title: "St. Mary's College", subtitle: 'Partner Institution · Raebareli', category: 'Institution', icon: 'fa-university', route: '/district', status: 'verified' },
                { id: 'inst-poly', title: 'Raebareli Polytechnic', subtitle: 'Partner Institution · Raebareli', category: 'Institution', icon: 'fa-university', route: '/district', status: 'active' },
                { id: 'inst-govt', title: 'Govt. Inter College', subtitle: 'Partner Institution · Raebareli', category: 'Institution', icon: 'fa-school', route: '/district', status: 'verified' },
            ];
            const dirReports: SearchResult[] = [
                { id: 'rep-q1', title: 'Q1 Progress Report', subtitle: 'Compliance Report · Raebareli', category: 'Report', icon: 'fa-file-alt', route: '/dashboard/director', status: 'completed' },
                { id: 'rep-enr', title: 'Enrollment Summary', subtitle: 'District Report · Raebareli', category: 'Report', icon: 'fa-chart-pie', route: '/dashboard/director', status: 'active' },
                { id: 'rep-com', title: 'Compliance Audit Log', subtitle: 'Audit Document · Raebareli', category: 'Document', icon: 'fa-clipboard-list', route: '/dashboard/director', status: 'pending' },
            ];
            all.push(...dirPrograms, ...dirInstitutions, ...dirReports);
        }

        // ── Text filter ────────────────────────────────────────────────────────
        const filtered = all.filter(r =>
            r.title.toLowerCase().includes(q) ||
            r.subtitle.toLowerCase().includes(q)
        );

        filtered.sort((a, b) => {
            const aStart = a.title.toLowerCase().startsWith(q) ? 0 : 1;
            const bStart = b.title.toLowerCase().startsWith(q) ? 0 : 1;
            return aStart - bStart;
        });

        return filtered.slice(0, 20);
    }

    // ── Apply structured filters on top of text search results ────────────────
    applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
        let out = [...results];

        // Category filter
        if (filters.category !== 'all') {
            const allowedCats = FILTER_MAP[filters.category];
            out = out.filter(r => allowedCats.includes(r.category));
        }

        // Status filter (multi-select OR logic)
        if (filters.status.length > 0) {
            out = out.filter(r => r.status && filters.status.includes(r.status));
        }


        return out;
    }

    // ── Count results per FilterCategory (for badge display) ──────────────────
    countsByFilterCategory(results: SearchResult[]): Map<FilterCategory, number> {
        const map = new Map<FilterCategory, number>();
        for (const r of results) {
            for (const [filterCat, cats] of Object.entries(FILTER_MAP) as [FilterCategory, SearchCategory[]][]) {
                if (filterCat === 'all') continue;
                if (cats.includes(r.category)) {
                    map.set(filterCat, (map.get(filterCat) ?? 0) + 1);
                }
            }
        }
        return map;
    }

    // ── Recent searches ────────────────────────────────────────────────────────
    addRecentSearch(q: string): void {
        const trimmed = q.trim();
        if (!trimmed) return;
        this._recent.update(list => {
            const deduped = list.filter(r => r !== trimmed);
            return [trimmed, ...deduped].slice(0, 5);
        });
    }

    clearRecentSearches(): void {
        this._recent.set([]);
    }

    // ── Filter persistence (localStorage) ─────────────────────────────────────
    saveFilters(f: SearchFilters): void {
        try { localStorage.setItem('gs-filters', JSON.stringify(f)); } catch { /* noop */ }
    }

    loadSavedFilters(): Partial<SearchFilters> {
        try {
            const raw = localStorage.getItem('gs-filters');
            return raw ? JSON.parse(raw) : {};
        } catch { return {}; }
    }
}
