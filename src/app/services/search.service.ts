import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { ScheduleService } from './schedule.service';
import { ProfileService, StudentInfo, TeacherInfo, PartnerInfo } from './profile.service';

export type SearchCategory = 'Course' | 'Schedule' | 'Person' | 'Page' | 'Facility';

export interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    category: SearchCategory;
    icon: string;   // Font Awesome class e.g. 'fa-book'
    route: string;  // Angular route path
}

const PAGES: SearchResult[] = [
    { id: 'p-home',       title: 'Home',               subtitle: 'Go to home page',                    category: 'Page', icon: 'fa-home',              route: '/home' },
    { id: 'p-about',      title: 'About',              subtitle: 'Learn about Ceekul Mission',          category: 'Page', icon: 'fa-info-circle',        route: '/about' },
    { id: 'p-centers',    title: 'Centers',            subtitle: 'Find learning centers near you',      category: 'Page', icon: 'fa-map-marker-alt',     route: '/centers' },
    { id: 'p-programs',   title: 'Programs',           subtitle: 'Browse all educational programs',     category: 'Page', icon: 'fa-graduation-cap',     route: '/programs' },
    { id: 'p-workshops',  title: 'Workshops',          subtitle: 'Public workshops and events',         category: 'Page', icon: 'fa-chalkboard-teacher', route: '/workshops' },
    { id: 'p-donate',     title: 'Donate',             subtitle: 'Support Ceekul Mission',              category: 'Page', icon: 'fa-heart',              route: '/donate' },
    { id: 'p-invest',     title: 'Invest',             subtitle: 'Investment opportunities',            category: 'Page', icon: 'fa-chart-line',         route: '/invest' },
    { id: 'p-contact',    title: 'Contact',            subtitle: 'Get in touch with us',                category: 'Page', icon: 'fa-envelope',           route: '/contact' },
    { id: 'p-transform',  title: 'Transformation',     subtitle: 'Socio-economic transformation',       category: 'Page', icon: 'fa-exchange-alt',       route: '/transformation' },
    { id: 'p-health',     title: 'Health Connect',     subtitle: 'Health services and resources',       category: 'Page', icon: 'fa-heartbeat',          route: '/health-connect' },
    { id: 'p-profile',    title: 'My Profile',         subtitle: 'Your identity and account governance',category: 'Page', icon: 'fa-user-circle',        route: '/my-profile' },
    { id: 'p-schedule',   title: 'My Schedule',        subtitle: 'Your daily operational schedule',     category: 'Page', icon: 'fa-calendar-alt',       route: '/my-schedule' },
    { id: 'p-innovative', title: 'Innovative Courses', subtitle: 'Explore the innovative curriculum',   category: 'Page', icon: 'fa-lightbulb',          route: '/innovative' },
    { id: 'p-register',   title: 'Register',           subtitle: 'Join Ceekul Mission',                 category: 'Page', icon: 'fa-user-plus',          route: '/register' },
    { id: 'p-district',   title: 'District',           subtitle: 'District-level information',          category: 'Page', icon: 'fa-map',                route: '/district' },
    { id: 'p-issues',     title: 'Issues',             subtitle: 'Community issues tracker',            category: 'Page', icon: 'fa-exclamation-circle', route: '/issues' },
];

@Injectable({ providedIn: 'root' })
export class SearchService {
    private authService    = inject(AuthService);
    private scheduleService = inject(ScheduleService);
    private profileService  = inject(ProfileService);

    private _recent = signal<string[]>([]);
    readonly recentSearches = this._recent.asReadonly();

    search(query: string): SearchResult[] {
        const q = query.trim().toLowerCase();
        if (!q) return [];

        const role    = this.authService.currentUserRole();
        const all: SearchResult[] = [...PAGES];

        // ── Schedule items (today) ─────────────────────────────────────
        const todayStr = new Date().toISOString().split('T')[0];
        const todayItems = this.scheduleService.items().filter(i => i.date === todayStr);

        for (const item of todayItems) {
            const typeIcon =
                item.type === 'class'   ? 'fa-chalkboard'  :
                item.type === 'exam'    ? 'fa-pen-square'   :
                item.type === 'meeting' ? 'fa-users'        : 'fa-clock';
            all.push({
                id: 'sch-' + item.scheduleId,
                title: item.title,
                subtitle: item.teacher
                    ? `${item.startTime}–${item.endTime} · ${item.teacher}`
                    : `${item.startTime}–${item.endTime} · ${item.location}`,
                category: 'Schedule',
                icon: typeIcon,
                route: '/my-schedule'
            });

            // Deduplicated teacher person entries
            if (item.teacher) {
                const tid = 'person-t-' + item.teacher.replace(/\s+/g, '-');
                if (!all.find(r => r.id === tid)) {
                    all.push({
                        id: tid,
                        title: item.teacher,
                        subtitle: `Teacher · ${item.title}`,
                        category: 'Person',
                        icon: 'fa-user-tie',
                        route: '/my-schedule'
                    });
                }
            }
        }

        // ── Role-specific data ─────────────────────────────────────────
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
                    route: '/dashboard/courses'
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
                    route: '/dashboard/teacher'
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
                    route: '/dashboard/teacher'
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
                    route: '/dashboard/partner'
                });
            }
            for (const teacher of pi.assignedTeachers) {
                all.push({
                    id: 'pteacher-' + teacher.replace(/\s+/g, '-'),
                    title: teacher,
                    subtitle: `Assigned Teacher · ${pi.institutionName}`,
                    category: 'Person',
                    icon: 'fa-user-tie',
                    route: '/dashboard/partner'
                });
            }
        }

        // ── Filter ─────────────────────────────────────────────────────
        const filtered = all.filter(r =>
            r.title.toLowerCase().includes(q) ||
            r.subtitle.toLowerCase().includes(q)
        );

        // Sort: exact title-start matches first
        filtered.sort((a, b) => {
            const aStart = a.title.toLowerCase().startsWith(q) ? 0 : 1;
            const bStart = b.title.toLowerCase().startsWith(q) ? 0 : 1;
            return aStart - bStart;
        });

        return filtered.slice(0, 12);
    }

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
}
