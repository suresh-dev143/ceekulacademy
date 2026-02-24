import { Injectable, signal, computed } from '@angular/core';

export interface NearbyUser {
    id: number;
    name: string;
    role: 'Teacher' | 'Student';
    specialization?: string;
    learningInterest?: string;
    distance: number;
    mode: 'Online' | 'Offline' | 'Hybrid';
    availability: string;
    activityType?: 'Learning' | 'Research';
}

export interface Infrastructure {
    id: number;
    name: string;
    type: string;
    capacity: number;
    tags: string[];
}

export interface Activity {
    sessionId: number;
    courseName: string;
    batchName: string;
    teacherName: string;
    teacherId: number;
    roomId: number;
    roomName: string;
    date: string;           // YYYY-MM-DD
    startTime: string;      // HH:MM
    endTime: string;        // HH:MM
    status: 'Live' | 'Starting Soon' | 'In Break' | 'Scheduled' | 'Completed';
    studentCount: number;
    capacity: number;
    attendanceCount?: number;
    resourceType: 'Lab' | 'Classroom' | 'Online';
    partnerId: number;
    resources?: string[];
    hasConflict?: boolean;
}

export interface ResourceStats {
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    activeTeachers: number;
    studentsOnCampus: number;
}

@Injectable({
    providedIn: 'root'
})
export class PartnerService {
    private partnerProfile = signal({
        name: 'Innovation Hub Noida',
        type: 'Infrastructure Provider',
        address: 'Sector 62, Noida, UP',
        coordinates: { lat: 28.6273, lng: 77.3725 }
    });

    private infra = signal<Infrastructure[]>([
        { id: 1, name: 'Seminar Hall 1',  type: 'Auditorium',    capacity: 40,  tags: ['Workshops', 'Webinars'] },
        { id: 2, name: 'AI Lab 1',        type: 'Lab',           capacity: 20,  tags: ['Research', 'Learning'] },
        { id: 3, name: 'Design Studio',   type: 'Classroom',     capacity: 25,  tags: ['Design', 'Creative'] },
        { id: 4, name: 'Computer Lab 2',  type: 'Lab',           capacity: 20,  tags: ['Programming', 'Research'] },
        { id: 5, name: 'Computer Lab 1',  type: 'Lab',           capacity: 30,  tags: ['Programming', 'Cloud'] },
        { id: 6, name: 'Smart Lab',       type: 'Lab',           capacity: 15,  tags: ['Cybersecurity', 'IoT'] }
    ]);

    private radius = signal<number>(10);

    private allNearbyUsers = signal<NearbyUser[]>([
        { id: 1,  name: 'Dr. Sameer Khan',  role: 'Teacher', specialization: 'Machine Learning', distance: 2.5,  mode: 'Hybrid',   availability: 'Mon-Fri, 9-11 AM',   activityType: 'Research' },
        { id: 2,  name: 'Priya Sharma',     role: 'Teacher', specialization: 'UI/UX Design',     distance: 8.2,  mode: 'Offline',  availability: 'Weekdays',            activityType: 'Learning' },
        { id: 3,  name: 'Rahul Verma',      role: 'Student', learningInterest: 'Generative AI',  distance: 1.2,  mode: 'Online',   availability: 'Evenings',            activityType: 'Learning' },
        { id: 4,  name: 'Ananya Das',       role: 'Student', learningInterest: 'Data Science',   distance: 12.5, mode: 'Offline',  availability: 'Full-time',           activityType: 'Learning' },
        { id: 5,  name: 'Prof. Aryan',      role: 'Teacher', specialization: 'Blockchain',       distance: 17.8, mode: 'Hybrid',   availability: 'Tue, Thu',            activityType: 'Research' },
        { id: 6,  name: 'Ishita Kapoor',    role: 'Student', learningInterest: 'Cybersecurity',  distance: 14.2, mode: 'Hybrid',   availability: 'Flexible',            activityType: 'Learning' }
    ]);

    // ── Activity mock data (dates computed dynamically) ──────────────────────
    private activitiesData = signal<Activity[]>((() => {
        const today    = new Date().toISOString().split('T')[0];
        const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();

        return [
            // ═══ TODAY – LIVE / ACTIVE ═══════════════════════════════════════
            {
                sessionId: 101, courseName: 'Machine Learning Fundamentals', batchName: 'Batch A3',
                teacherName: 'Dr. Sameer Khan', teacherId: 1,
                roomId: 2, roomName: 'AI Lab 1', date: today,
                startTime: '09:00', endTime: '10:30', status: 'Live',
                studentCount: 20, capacity: 20, attendanceCount: 18,
                resourceType: 'Lab', partnerId: 1,
                resources: ['Workstations', 'Projector']
            },
            {
                sessionId: 102, courseName: 'UI/UX Design Workshop', batchName: 'Batch B1',
                teacherName: 'Priya Sharma', teacherId: 2,
                roomId: 3, roomName: 'Design Studio', date: today,
                startTime: '10:00', endTime: '11:30', status: 'Live',
                studentCount: 25, capacity: 25, attendanceCount: 22,
                resourceType: 'Classroom', partnerId: 1,
                resources: ['Smart Board', 'Projector']
            },
            {
                sessionId: 103, courseName: 'Blockchain Basics', batchName: 'Batch C2',
                teacherName: 'Prof. Aryan', teacherId: 5,
                roomId: 1, roomName: 'Seminar Hall 1', date: today,
                startTime: '11:00', endTime: '12:30', status: 'Starting Soon',
                studentCount: 40, capacity: 40, attendanceCount: 35,
                resourceType: 'Classroom', partnerId: 1,
                resources: ['Projector', 'Smart Board']
            },
            {
                sessionId: 104, courseName: 'Data Science Lab', batchName: 'Batch A1',
                teacherName: 'Dr. Rajan Mehta', teacherId: 7,
                roomId: 4, roomName: 'Computer Lab 2', date: today,
                startTime: '09:00', endTime: '10:30', status: 'In Break',
                studentCount: 20, capacity: 20, attendanceCount: 15,
                resourceType: 'Lab', partnerId: 1,
                resources: ['Workstations', 'Internet']
            },
            // ═══ TODAY – UPCOMING ════════════════════════════════════════════
            {
                sessionId: 105, courseName: 'Cloud Computing', batchName: 'Batch D1',
                teacherName: 'Anita Singh', teacherId: 8,
                roomId: 5, roomName: 'Computer Lab 1', date: today,
                startTime: '13:00', endTime: '14:30', status: 'Scheduled',
                studentCount: 22, capacity: 30,
                resourceType: 'Lab', partnerId: 1,
                resources: ['Workstations']
            },
            {
                sessionId: 106, courseName: 'Python Programming', batchName: 'Batch E2',
                teacherName: 'Vikram Nair', teacherId: 9,
                roomId: 2, roomName: 'AI Lab 1', date: today,
                startTime: '14:30', endTime: '16:00', status: 'Scheduled',
                studentCount: 19, capacity: 20,
                resourceType: 'Lab', partnerId: 1,
                resources: ['Workstations', 'Projector']
            },
            {
                sessionId: 107, courseName: 'Cybersecurity Essentials', batchName: 'Batch F3',
                teacherName: 'Ishita Kapoor', teacherId: 6,
                roomId: 6, roomName: 'Smart Lab', date: today,
                startTime: '15:00', endTime: '16:30', status: 'Scheduled',
                studentCount: 12, capacity: 15,
                resourceType: 'Lab', partnerId: 1,
                resources: ['Workstations', 'Internet', 'Projector']
            },
            {
                sessionId: 108, courseName: 'Digital Marketing', batchName: 'Batch B2',
                teacherName: 'Priya Sharma', teacherId: 2,
                roomId: 1, roomName: 'Seminar Hall 1', date: today,
                startTime: '16:30', endTime: '18:00', status: 'Scheduled',
                studentCount: 28, capacity: 40,
                resourceType: 'Classroom', partnerId: 1,
                resources: ['Projector', 'Smart Board']
            },
            // ═══ TOMORROW ════════════════════════════════════════════════════
            {
                sessionId: 109, courseName: 'React.js Workshop', batchName: 'Batch G1',
                teacherName: 'Rahul Dev', teacherId: 10,
                roomId: 5, roomName: 'Computer Lab 1', date: tomorrow,
                startTime: '09:00', endTime: '10:30', status: 'Scheduled',
                studentCount: 18, capacity: 25,
                resourceType: 'Lab', partnerId: 1,
                resources: ['Workstations']
            },
            {
                sessionId: 110, courseName: 'Mobile App Development', batchName: 'Batch H1',
                teacherName: 'Sonia Gupta', teacherId: 11,
                roomId: 2, roomName: 'AI Lab 1', date: tomorrow,
                startTime: '11:00', endTime: '12:30', status: 'Scheduled',
                studentCount: 16, capacity: 20,
                resourceType: 'Lab', partnerId: 1,
                resources: ['Workstations', 'Projector']
            },
            {
                sessionId: 111, courseName: 'Advanced Machine Learning', batchName: 'Batch A4',
                teacherName: 'Dr. Sameer Khan', teacherId: 1,
                roomId: 2, roomName: 'AI Lab 1', date: tomorrow,
                startTime: '14:00', endTime: '15:30', status: 'Scheduled',
                studentCount: 14, capacity: 20,
                resourceType: 'Lab', partnerId: 1,
                resources: ['Workstations', 'Projector']
            }
        ] as Activity[];
    })());

    // ── Readonly signals ─────────────────────────────────────────────────────
    currentPartner      = this.partnerProfile.asReadonly();
    currentInfrastructure = this.infra.asReadonly();
    currentRadius       = this.radius.asReadonly();
    activities          = this.activitiesData.asReadonly();

    // ── Computed: discovery ──────────────────────────────────────────────────
    nearbyTeachers = computed(() =>
        this.allNearbyUsers().filter(u => u.role === 'Teacher' && u.distance <= this.radius())
    );

    nearbyStudents = computed(() =>
        this.allNearbyUsers().filter(u => u.role === 'Student' && u.distance <= this.radius())
    );

    stats = computed(() => ({
        teachersCount:   this.nearbyTeachers().length,
        studentsCount:   this.nearbyStudents().length,
        activeActivities: this.activitiesData().filter(a =>
            ['Live', 'Starting Soon', 'In Break'].includes(a.status)).length,
        infraCapacity:   this.infra().reduce((acc, curr) => acc + curr.capacity, 0)
    }));

    // ── Computed: resource utilisation ───────────────────────────────────────
    resourceStats = computed<ResourceStats>(() => {
        const today   = new Date().toISOString().split('T')[0];
        const live    = ['Live', 'Starting Soon', 'In Break'];
        const ongoing = this.activitiesData().filter(a => a.date === today && live.includes(a.status));

        const occupiedRooms    = new Set(ongoing.map(a => a.roomId)).size;
        const activeTeachers   = new Set(ongoing.map(a => a.teacherId)).size;
        const studentsOnCampus = ongoing
            .filter(a => a.resourceType !== 'Online')
            .reduce((sum, a) => sum + (a.attendanceCount ?? a.studentCount), 0);

        return {
            totalRooms:      this.infra().length,
            occupiedRooms,
            availableRooms:  this.infra().length - occupiedRooms,
            activeTeachers,
            studentsOnCampus
        };
    });

    // ── Computed: filter option lists ────────────────────────────────────────
    uniqueTeachers = computed(() =>
        [...new Set(this.activitiesData().map(a => a.teacherName))].sort()
    );

    uniqueRooms = computed(() =>
        [...new Set(this.activitiesData().map(a => a.roomName))].sort()
    );

    uniqueCourses = computed(() =>
        [...new Set(this.activitiesData().map(a => a.courseName))].sort()
    );

    // ── Actions ──────────────────────────────────────────────────────────────
    setRadius(r: number) {
        this.radius.set(r);
    }

    addInfrastructure(item: Omit<Infrastructure, 'id'>) {
        this.infra.update(items => [...items, { ...item, id: Date.now() }]);
    }

    inviteUser(userId: number) {
        console.log(`Sending invitation to user ID: ${userId}`);
    }
}
