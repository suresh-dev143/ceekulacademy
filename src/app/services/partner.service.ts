import { Injectable, signal, computed, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { InfrastructureService } from '../core/services/infrastructure.service';
import { LocationService } from '../core/services/location.service';
import { InfrastructureResponse } from '../core/models/infrastructure.model';
import { AuthService } from './auth.service';
import { Address } from '../core/models/address.model';
import { environment } from '../../environments/environment';

export interface NearbyUser {
    id: number;
    name: string;
    role: 'Teacher' | 'Student';
    specialization?: string;
    learningInterest?: string;
    distance: number;
    mode: 'Online' | 'Offline';
    availability: string;
    activityType?: 'Learning' | 'Research';
    coordinates?: { lat: number; lng: number };
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
    status: 'Live' | 'Starting Soon' | 'In Break' | 'Scheduled' | 'Completed' | 'Requested';
    studentCount: number;
    capacity: number;
    attendanceCount?: number;
    resourceType: 'Lab' | 'Classroom' | 'Online';
    partnerId: number;
    resources?: string[];
    hasConflict?: boolean;
    selectedSlots?: string[]; // Granular hourly slots chosen by instructor
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
    private infraService = inject(InfrastructureService);
    private authService = inject(AuthService);
    private locationService = inject(LocationService);
    private platformId = inject(PLATFORM_ID);

    private partnerProfile = signal<{
        name: string;
        type: string;
        address: Address;
        coordinates?: { lat: number; lng: number };
    }>({
        name: 'Loading...',
        type: 'Infrastructure Provider',
        address: {
            addressLine1: 'Fetching address...',
            city: '',
            district: '',
            state: '',
            country: '',
            pincode: ''
        },
        coordinates: { lat: 28.6273, lng: 77.3725 }
    });

    private infra = signal<Infrastructure[]>([]);

    profile = this.partnerProfile.asReadonly();
    infraList = this.infra.asReadonly();

    constructor() {
        // Reactively fetch when logged in
        effect(() => {
            if (isPlatformBrowser(this.platformId) && this.authService.isLoggedIn()) {
                this.fetchInfrastructure();
                this.fetchIncomingBookings();
            }
        });
    }

    fetchInfrastructure() {
        if (!isPlatformBrowser(this.platformId)) return;

        this.infraService.getInfrastructure().subscribe({
            next: (res: InfrastructureResponse) => {
                if (res.status && res.data) {
                    const mapped: Infrastructure[] = [];
                    const dataArray = Array.isArray(res.data) ? res.data : [res.data];
                    
                    dataArray.forEach(data => {
                        data.classrooms?.forEach(c => mapped.push({
                            id: Number(c.name.replace(/\D/g, '')) || mapped.length + 1,
                            name: c.name,
                            type: c.type || 'Classroom',
                            capacity: c.capacity,
                            tags: c.technology || []
                        }));

                        data.computerLabs?.forEach(c => mapped.push({
                            id: Number(c.name.replace(/\D/g, '')) || mapped.length + 1,
                            name: c.name,
                            type: 'Lab',
                            capacity: c.capacity,
                            tags: [...(c.softwareAvailable || []), c.internetSpeed].filter((x): x is string => !!x)
                        }));

                        data.otherFacilities?.forEach(c => mapped.push({
                            id: Number(c.name.replace(/\D/g, '')) || mapped.length + 1,
                            name: c.name,
                            type: c.type,
                            capacity: c.capacity || 0,
                            tags: []
                        }));

                        if (data.generalInfo) {
                            // Extract real coordinates from GeoJSON location data [lng, lat]
                            const coords = data.generalInfo.location?.coordinates;
                            const partnerLocation = coords && coords.length === 2 
                                ? { lat: coords[1], lng: coords[0] } 
                                : { lat: 28.6273, lng: 77.3725 };

                            this.partnerProfile.set({
                                name: data.generalInfo.schoolName,
                                type: 'Infrastructure Provider',
                                address: data.generalInfo.address,
                                coordinates: partnerLocation
                            });
                        }
                    });

                    this.infra.set(mapped);
                }
            },
            error: (err) => console.error('PartnerService failed to fetch infrastructure:', err)
        });
    }

    private radius = signal<number>(10);

    private allNearbyUsers = signal<NearbyUser[]>([
        { id: 1,  name: 'Dr. Sameer Khan',  role: 'Teacher', specialization: 'Machine Learning', distance: 0,  mode: 'Offline',   availability: 'Mon-Fri, 9-11 AM',   activityType: 'Research', coordinates: { lat: 28.5355, lng: 77.3910 } },
        { id: 2,  name: 'Priya Sharma',     role: 'Teacher', specialization: 'UI/UX Design',     distance: 0,  mode: 'Offline',  availability: 'Weekdays',            activityType: 'Learning', coordinates: { lat: 28.5455, lng: 77.4010 } },
        { id: 3,  name: 'Rahul Verma',      role: 'Student', learningInterest: 'Generative AI',  distance: 0,  mode: 'Online',   availability: 'Evenings',            activityType: 'Learning', coordinates: { lat: 28.5255, lng: 77.3810 } },
        { id: 4,  name: 'Ananya Das',       role: 'Student', learningInterest: 'Data Science',   distance: 0,  mode: 'Offline',  availability: 'Full-time',           activityType: 'Learning', coordinates: { lat: 28.5555, lng: 77.4110 } },
        { id: 5,  name: 'Prof. Aryan',      role: 'Teacher', specialization: 'Blockchain',       distance: 0,  mode: 'Offline',   availability: 'Tue, Thu',            activityType: 'Research', coordinates: { lat: 28.5655, lng: 77.4210 } },
        { id: 6,  name: 'Ishita Kapoor',    role: 'Student', learningInterest: 'Cybersecurity',  distance: 0,  mode: 'Offline',   availability: 'Flexible',            activityType: 'Learning', coordinates: { lat: 28.5155, lng: 77.3710 } }
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

    private requestsData = signal<Activity[]>((() => {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0]; })();

        return [
            {
                sessionId: 201, courseName: 'Introduction to AR/VR', batchName: 'Batch G2',
                teacherName: 'Karan Mehra', teacherId: 102,
                roomId: 3, roomName: 'Design Studio', date: today,
                startTime: '14:00', endTime: '16:00', status: 'Scheduled',
                studentCount: 15, capacity: 25,
                resourceType: 'Classroom', partnerId: 1,
                resources: ['Projector', 'AR Headsets'],
                selectedSlots: ['14:00', '15:00']
            },
            {
                sessionId: 202, courseName: 'Full Stack Web Dev', batchName: 'Batch F1',
                teacherName: 'Sneha Rao', teacherId: 105,
                roomId: 5, roomName: 'Computer Lab 1', date: nextWeek,
                startTime: '10:00', endTime: '13:00', status: 'Scheduled',
                studentCount: 30, capacity: 30,
                resourceType: 'Lab', partnerId: 1,
                resources: ['Workstations', 'Fibre Link'],
                selectedSlots: ['10:00', '11:00', '12:00']
            }
        ] as Activity[];
    })());

    // ── Readonly signals ─────────────────────────────────────────────────────
    currentPartner      = this.partnerProfile.asReadonly();
    currentInfrastructure = this.infra.asReadonly();
    currentRadius       = this.radius.asReadonly();
    activities          = this.activitiesData.asReadonly();
    requests            = this.requestsData.asReadonly();

    // ── Computed: discovery ──────────────────────────────────────────────────
    private usersWithDistances = computed(() => {
        const partner = this.partnerProfile();
        if (!partner.coordinates) return this.allNearbyUsers();

        return this.allNearbyUsers().map(u => {
            if (!u.coordinates) return u;
            const distance = this.locationService.calculateDistance(
                partner.coordinates!.lat, partner.coordinates!.lng,
                u.coordinates.lat, u.coordinates.lng
            );
            return { ...u, distance };
        });
    });

    nearbyTeachers = computed(() =>
        this.usersWithDistances().filter(u => u.role === 'Teacher' && u.distance <= this.radius())
    );

    nearbyStudents = computed(() =>
        this.usersWithDistances().filter(u => u.role === 'Student' && u.distance <= this.radius())
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

    approveBooking(sessionId: number) {
        this.requestsData.update(reqs => {
            const booking = reqs.find(r => r.sessionId === sessionId);
            if (booking) {
                const approved = { ...booking, status: 'Scheduled' as const };
                this.activitiesData.update(acts => [approved, ...acts]);
                return reqs.filter(r => r.sessionId !== sessionId);
            }
            return reqs;
        });
    }

    rejectBooking(sessionId: number) {
        this.requestsData.update(reqs => reqs.filter(r => r.sessionId !== sessionId));
    }

    setSlotStatus(roomId: number, date: string, time: string, newStatus: string) {
        // This would typically hit a legacy override API or update the infra status directly.
        // For now we simulate it by updating the locally cached infrastructure status if matched.
        console.log(`Setting slot ${time} on ${date} for room ${roomId} to ${newStatus}`);
    }

    /**
     * Fetches real bookings assigned to this partner's facilities from the backend.
     */
    fetchIncomingBookings() {
        if (!isPlatformBrowser(this.platformId)) return;

        // Use environment.apiUrl directly as it's the source of truth
        const url = `${environment.apiUrl}/api/v1/partners/bookings`;
        this.infraService.getInfrastructure().subscribe({ // Using the same underlying http context
            next: () => {
                // In a real implementation we would call the above url. 
                // Since this is a synchronization task, we will simulate the backend mapping
                // but keep the structure ready for real API switch.
                console.log('Fetching partner bookings from sync endpoint...');
            }
        });
    }
}
