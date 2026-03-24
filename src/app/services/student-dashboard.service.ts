import { Injectable, signal, computed, inject } from '@angular/core';
import { WorkshopService } from './workshop.service';

export interface EnrolledCourse {
    id: number;
    title: string;
    category: string;
    teacher: string;
    progress: number; // 0-100
    status: 'In Progress' | 'Completed' | 'Paused';
    pricing: 'Free' | 'Paid';
    mode: 'Online' | 'Offline' | 'Hybrid';
    lastAccessed: string;
    thumbnail: string; // emoji icon
}

export interface CatalogCourse {
    id: number;
    title: string;
    category: string;
    teacher: string;
    pricing: 'Free' | 'Paid';
    price?: number;
    mode: 'Online' | 'Offline' | 'Hybrid';
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    duration: string;
    enrolledCount: number;
    rating: number;
    thumbnail: string;
}

export interface SearchableTeacher {
    id: number;
    name: string;
    subjects: string[];
    specialization: string;
    mode: 'Online' | 'Offline' | 'Hybrid';
    distance: number;
    rating: number;
    verified: boolean;
    experience: string;
    studentsCount: number;
    availability: string;
}

export interface SearchableInfrastructure {
    id: number;
    name: string;
    type: 'School' | 'Research Lab' | 'College' | 'Skill Center' | 'Library' | 'Training Center';
    address: string;
    distance: number;
    facilities: string[];
    activePrograms: number;
    verified: boolean;
    rating: number;
    contact: string;
}

export interface StudentProfile {
    name: string;
    grade: string;
    location: string;
    city: string;
    interests: string[];
    email: string;
    phone: string;
    joinedDate: string;
    bio: string;
}

@Injectable({ providedIn: 'root' })
export class StudentDashboardService {
    private workshopService = inject(WorkshopService);

    constructor() {
        // Fetch public workshops and merge into catalogData
        this.workshopService.getPublicWorkshops({ limit: 50 }).subscribe(res => {
            if (res.status) {
                const workshops = res.data.workshops.map(w => ({
                    id: Math.floor(Math.random() * 1000000), // temp numeric ID for catalog compatibility
                    title: w.workshopTitle,
                    category: 'Workshop',
                    teacher: w.expertDescription,
                    pricing: 'Paid' as const,
                    price: w.sessions[0]?.fee || 0,
                    mode: (w.sessions[0]?.mode === 'hybrid' ? 'Hybrid' : 'Online') as any,
                    level: 'Beginner' as const,
                    duration: `${w.sessions.length} Sessions`,
                    enrolledCount: 0,
                    rating: 5.0,
                    thumbnail: '🎓'
                }));
                this.catalogData.update(list => [...list, ...workshops]);
            }
        });
    }

    // ─── Profile ────────────────────────────────────────────────────────────────
    private profileData = signal<StudentProfile>({
        name: 'Priya Sharma',
        grade: 'Class 12 (Science)',
        location: 'Sector 18, Noida',
        city: 'Noida, Uttar Pradesh',
        interests: ['Physics', 'Mathematics', 'Robotics', 'AI/ML'],
        email: 'priya.sharma@example.com',
        phone: '+91 98765 43210',
        joinedDate: '2025-08-15',
        bio: 'Passionate learner exploring science and technology to build a better future.'
    });
    profile = this.profileData.asReadonly();

    updateProfile(updated: StudentProfile) {
        this.profileData.set(updated);
    }

    // ─── Enrolled Courses ────────────────────────────────────────────────────────
    private enrolledData = signal<EnrolledCourse[]>([
        { id: 1, title: 'Introduction to AI', category: 'Innovative Courses', teacher: 'Prof. Rajesh Khanna', progress: 72, status: 'In Progress', pricing: 'Free', mode: 'Online', lastAccessed: '2026-02-18', thumbnail: '🤖' },
        { id: 2, title: 'Advanced Physics', category: 'Science', teacher: 'Dr. Kavita Rao', progress: 100, status: 'Completed', pricing: 'Paid', mode: 'Offline', lastAccessed: '2026-02-10', thumbnail: '⚛️' },
        { id: 3, title: 'Applied Mathematics', category: 'Mathematics', teacher: 'Mr. John Miller', progress: 40, status: 'In Progress', pricing: 'Free', mode: 'Hybrid', lastAccessed: '2026-02-17', thumbnail: '📐' },
        { id: 4, title: 'Environmental Science', category: 'Science', teacher: 'Anjali Deshmukh', progress: 0, status: 'Paused', pricing: 'Free', mode: 'Offline', lastAccessed: '2026-01-20', thumbnail: '🌿' },
        { id: 5, title: 'Robotics Fundamentals', category: 'Technology', teacher: 'Dr. Sarah Chen', progress: 55, status: 'In Progress', pricing: 'Paid', mode: 'Hybrid', lastAccessed: '2026-02-15', thumbnail: '🦾' }
    ]);

    // ─── Search state for enrolled courses ──────────────────────────────────────
    enrolledSearchQuery = signal('');
    enrolledCategoryFilter = signal('All');
    enrolledPriceFilter = signal('All');

    enrolledCourses = computed(() => {
        const q = this.enrolledSearchQuery().toLowerCase();
        const cat = this.enrolledCategoryFilter();
        const price = this.enrolledPriceFilter();
        return this.enrolledData().filter(c => {
            const matchQ = !q || c.title.toLowerCase().includes(q) || c.teacher.toLowerCase().includes(q);
            const matchCat = cat === 'All' || c.category === cat;
            const matchPrice = price === 'All' || c.pricing === price;
            return matchQ && matchCat && matchPrice;
        });
    });

    enrolledCategories = computed(() => ['All', ...new Set(this.enrolledData().map(c => c.category))]);

    // ─── Course Catalog ──────────────────────────────────────────────────────────
    private catalogData = signal<CatalogCourse[]>([
        { id: 10, title: 'Introduction to AI', category: 'Technology', teacher: 'Prof. Rajesh Khanna', pricing: 'Free', mode: 'Online', level: 'Beginner', duration: '4 Weeks', enrolledCount: 320, rating: 4.8, thumbnail: '🤖' },
        { id: 11, title: 'Advanced Physics', category: 'Science', teacher: 'Dr. Kavita Rao', pricing: 'Paid', price: 499, mode: 'Offline', level: 'Advanced', duration: '8 Weeks', enrolledCount: 85, rating: 4.9, thumbnail: '⚛️' },
        { id: 12, title: 'Python for Beginners', category: 'Technology', teacher: 'Mr. John Miller', pricing: 'Free', mode: 'Online', level: 'Beginner', duration: '3 Weeks', enrolledCount: 510, rating: 4.7, thumbnail: '🐍' },
        { id: 13, title: 'Organic Chemistry', category: 'Science', teacher: 'Dr. Sarah Chen', pricing: 'Paid', price: 299, mode: 'Hybrid', level: 'Intermediate', duration: '6 Weeks', enrolledCount: 140, rating: 4.5, thumbnail: '🧪' },
        { id: 14, title: 'Calculus & Linear Algebra', category: 'Mathematics', teacher: 'Mr. John Miller', pricing: 'Free', mode: 'Online', level: 'Intermediate', duration: '5 Weeks', enrolledCount: 260, rating: 4.6, thumbnail: '📐' },
        { id: 15, title: 'Robotics & Automation', category: 'Technology', teacher: 'Dr. Sarah Chen', pricing: 'Paid', price: 799, mode: 'Offline', level: 'Advanced', duration: '10 Weeks', enrolledCount: 60, rating: 4.9, thumbnail: '🦾' },
        { id: 16, title: 'Environmental Science', category: 'Science', teacher: 'Anjali Deshmukh', pricing: 'Free', mode: 'Online', level: 'Beginner', duration: '4 Weeks', enrolledCount: 195, rating: 4.4, thumbnail: '🌿' },
        { id: 17, title: 'Data Structures & Algorithms', category: 'Technology', teacher: 'Prof. Rajesh Khanna', pricing: 'Paid', price: 599, mode: 'Online', level: 'Advanced', duration: '8 Weeks', enrolledCount: 210, rating: 4.8, thumbnail: '🗃️' },
        { id: 18, title: 'Statistics & Probability', category: 'Mathematics', teacher: 'Mr. John Miller', pricing: 'Free', mode: 'Hybrid', level: 'Intermediate', duration: '4 Weeks', enrolledCount: 155, rating: 4.5, thumbnail: '📊' }
    ]);

    catalogSearchQuery = signal('');
    catalogCategoryFilter = signal('All');
    catalogPriceFilter = signal('All');
    catalogLevelFilter = signal('All');

    catalogCourses = computed(() => {
        const q = this.catalogSearchQuery().toLowerCase();
        const cat = this.catalogCategoryFilter();
        const price = this.catalogPriceFilter();
        const level = this.catalogLevelFilter();
        return this.catalogData().filter(c => {
            const matchQ = !q || c.title.toLowerCase().includes(q) || c.teacher.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
            const matchCat = cat === 'All' || c.category === cat;
            const matchPrice = price === 'All' || c.pricing === price;
            const matchLevel = level === 'All' || c.level === level;
            return matchQ && matchCat && matchPrice && matchLevel;
        });
    });

    catalogCategories = computed(() => ['All', ...new Set(this.catalogData().map(c => c.category))]);

    // ─── Teachers ────────────────────────────────────────────────────────────────
    private teachersData = signal<SearchableTeacher[]>([
        { id: 1, name: 'Dr. Kavita Rao', subjects: ['Physics', 'Quantum Mechanics'], specialization: 'Advanced Physics', mode: 'Offline', distance: 2.1, rating: 4.9, verified: true, experience: '12 Years', studentsCount: 340, availability: 'Mon, Wed, Fri (5–7 PM)' },
        { id: 2, name: 'Mr. John Miller', subjects: ['Mathematics', 'Statistics', 'Calculus'], specialization: 'Applied Mathematics', mode: 'Hybrid', distance: 8.5, rating: 4.7, verified: true, experience: '8 Years', studentsCount: 210, availability: 'Weekends (10 AM–1 PM)' },
        { id: 3, name: 'Dr. Sarah Chen', subjects: ['Biotechnology', 'Chemistry'], specialization: 'Biotechnology Research', mode: 'Offline', distance: 12.4, rating: 4.6, verified: false, experience: '15 Years', studentsCount: 120, availability: 'Tue, Thu (4–6 PM)' },
        { id: 4, name: 'Prof. Rajesh Khanna', subjects: ['Computer Science', 'AI', 'Python'], specialization: 'Computer Science & Robotics', mode: 'Online', distance: 5.2, rating: 4.8, verified: true, experience: '10 Years', studentsCount: 580, availability: 'Daily (7–9 PM)' },
        { id: 5, name: 'Anjali Deshmukh', subjects: ['Environmental Science', 'Ecology'], specialization: 'Environmental Science', mode: 'Offline', distance: 18.2, rating: 4.5, verified: true, experience: '6 Years', studentsCount: 95, availability: 'Saturdays' },
        { id: 6, name: 'Dr. Arjun Mehta', subjects: ['History', 'Social Studies'], specialization: 'Social Sciences', mode: 'Online', distance: 3.8, rating: 4.4, verified: true, experience: '9 Years', studentsCount: 175, availability: 'Mon–Fri (6–8 PM)' },
        { id: 7, name: 'Ms. Neha Gupta', subjects: ['English', 'Creative Writing'], specialization: 'Language & Literature', mode: 'Hybrid', distance: 6.7, rating: 4.6, verified: false, experience: '5 Years', studentsCount: 140, availability: 'Weekends' }
    ]);

    teacherSearchQuery = signal('');
    teacherSubjectFilter = signal('');
    teacherModeFilter = signal('All');
    teacherVerifiedOnly = signal(false);

    teachers = computed(() => {
        const q = this.teacherSearchQuery().toLowerCase();
        const subj = this.teacherSubjectFilter().toLowerCase();
        const mode = this.teacherModeFilter();
        const verifiedOnly = this.teacherVerifiedOnly();
        return this.teachersData().filter(t => {
            const matchQ = !q || t.name.toLowerCase().includes(q) || t.specialization.toLowerCase().includes(q);
            const matchSubj = !subj || t.subjects.some(s => s.toLowerCase().includes(subj));
            const matchMode = mode === 'All' || t.mode === mode;
            const matchVerified = !verifiedOnly || t.verified;
            return matchQ && matchSubj && matchMode && matchVerified;
        });
    });

    // ─── Infrastructure ──────────────────────────────────────────────────────────
    private infraData = signal<SearchableInfrastructure[]>([
        { id: 101, name: 'Noida Community Science Lab', type: 'Research Lab', address: 'Sector 62, Noida', distance: 3.4, facilities: ['Physics Lab', 'Chemistry Lab', 'Microscopy'], activePrograms: 5, verified: true, rating: 4.7, contact: '011-2345-6789' },
        { id: 102, name: 'Global Excellence School', type: 'School', address: 'Sector 29, Noida', distance: 7.2, facilities: ['Smart Classrooms', 'Library', 'Sports Ground'], activePrograms: 12, verified: true, rating: 4.5, contact: '011-9876-5432' },
        { id: 103, name: 'TechHub Training Center', type: 'Training Center', address: 'Sector 18, Noida', distance: 1.8, facilities: ['Computer Lab', 'Seminar Hall', 'Wi-Fi'], activePrograms: 3, verified: true, rating: 4.8, contact: '011-1122-3344' },
        { id: 104, name: 'Green Valley College', type: 'College', address: 'Greater Noida West', distance: 19.1, facilities: ['Auditorium', 'Sports Ground', 'Cafeteria'], activePrograms: 8, verified: false, rating: 4.2, contact: '011-5566-7788' },
        { id: 105, name: 'Digital Skill Center', type: 'Skill Center', address: 'Sector 15A, Noida', distance: 4.5, facilities: ['Computer Lab', '3D Printer', 'Recording Studio'], activePrograms: 6, verified: true, rating: 4.6, contact: '011-9988-7766' },
        { id: 106, name: 'City Public Library', type: 'Library', address: 'Sector 5, Noida', distance: 2.9, facilities: ['Reading Halls', 'Digital Resources', 'Study Rooms'], activePrograms: 2, verified: true, rating: 4.3, contact: '011-2233-4455' }
    ]);

    infraSearchQuery = signal('');
    infraTypeFilter = signal('All');
    infraMaxDistance = signal(25);
    infraVerifiedOnly = signal(false);

    infrastructure = computed(() => {
        const q = this.infraSearchQuery().toLowerCase();
        const type = this.infraTypeFilter();
        const maxDist = this.infraMaxDistance();
        const verifiedOnly = this.infraVerifiedOnly();
        return this.infraData().filter(i => {
            const matchQ = !q || i.name.toLowerCase().includes(q) || i.address.toLowerCase().includes(q);
            const matchType = type === 'All' || i.type === type;
            const matchDist = i.distance <= maxDist;
            const matchVerified = !verifiedOnly || i.verified;
            return matchQ && matchType && matchDist && matchVerified;
        });
    });

    // ─── Overview Stats ──────────────────────────────────────────────────────────
    stats = computed(() => ({
        enrolled: this.enrolledData().length,
        inProgress: this.enrolledData().filter(c => c.status === 'In Progress').length,
        completed: this.enrolledData().filter(c => c.status === 'Completed').length,
        avgProgress: Math.round(this.enrolledData().reduce((sum, c) => sum + c.progress, 0) / this.enrolledData().length)
    }));
}
