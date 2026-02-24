import { Injectable, signal, computed } from '@angular/core';

export type ScheduleType = 'class' | 'meeting' | 'personal' | 'exam';
export type ScheduleStatus = 'upcoming' | 'live' | 'completed';

export interface ScheduleItem {
    scheduleId: string;
    userId: string;
    title: string;
    type: ScheduleType;
    date: string;        // YYYY-MM-DD
    startTime: string;   // HH:MM (24h)
    endTime: string;     // HH:MM
    location: string;
    relatedCourseId?: string;
    status: ScheduleStatus;
    notes?: string;
    isEditable: boolean;
    teacher?: string;
    batch?: string;
}

function today(): string {
    return new Date().toISOString().split('T')[0];
}

function tomorrow(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
}

const SAMPLE: ScheduleItem[] = [
    {
        scheduleId: 's1', userId: 'u1', title: 'Vedic Mathematics',
        type: 'class', date: today(), startTime: '08:00', endTime: '09:30',
        location: 'Room 101', status: 'completed', isEditable: false,
        teacher: 'Dr. Sharma', relatedCourseId: 'c1'
    },
    {
        scheduleId: 's2', userId: 'u1', title: 'Research Sync',
        type: 'meeting', date: today(), startTime: '09:30', endTime: '10:00',
        location: 'Conference Hall A', status: 'completed', isEditable: false,
        teacher: 'Prof. Mehta'
    },
    {
        scheduleId: 's3', userId: 'u1', title: 'Quantum Physics',
        type: 'class', date: today(), startTime: '10:00', endTime: '11:30',
        location: 'Lab 3 – Online', status: 'live', isEditable: false,
        teacher: 'Dr. Kapoor', relatedCourseId: 'c2'
    },
    {
        scheduleId: 's4', userId: 'u1', title: 'Lunch Break',
        type: 'personal', date: today(), startTime: '12:00', endTime: '13:00',
        location: 'Cafeteria', status: 'upcoming', isEditable: true,
        notes: 'Team lunch with batch mates'
    },
    {
        scheduleId: 's5', userId: 'u1', title: 'Innovation Lab',
        type: 'class', date: today(), startTime: '13:30', endTime: '15:00',
        location: 'Innovation Hub B', status: 'upcoming', isEditable: false,
        teacher: 'Mr. Gupta', relatedCourseId: 'c3'
    },
    {
        scheduleId: 's6', userId: 'u1', title: 'Study Block',
        type: 'personal', date: today(), startTime: '15:30', endTime: '17:00',
        location: 'Library', status: 'upcoming', isEditable: true,
        notes: 'Prepare for Digital Systems exam'
    },
    {
        scheduleId: 's7', userId: 'u1', title: 'Digital Systems Lecture',
        type: 'class', date: today(), startTime: '17:00', endTime: '18:30',
        location: 'Room 204', status: 'upcoming', isEditable: false,
        teacher: 'Dr. Singh', relatedCourseId: 'c4'
    },
    {
        scheduleId: 's8', userId: 'u1', title: 'Evening Review',
        type: 'personal', date: today(), startTime: '19:00', endTime: '20:00',
        location: 'Home / Remote', status: 'upcoming', isEditable: true,
        notes: 'Review day notes and prepare tomorrow plan'
    },
    // Tomorrow sample
    {
        scheduleId: 't1', userId: 'u1', title: 'Advanced Research Methods',
        type: 'class', date: tomorrow(), startTime: '09:00', endTime: '10:30',
        location: 'Room 305', status: 'upcoming', isEditable: false,
        teacher: 'Prof. Mehta', relatedCourseId: 'c5'
    },
    {
        scheduleId: 't2', userId: 'u1', title: 'Team Project Meeting',
        type: 'meeting', date: tomorrow(), startTime: '11:00', endTime: '12:00',
        location: 'Online – Meet', status: 'upcoming', isEditable: false
    },
    {
        scheduleId: 't3', userId: 'u1', title: 'Civilization Studies Exam',
        type: 'exam', date: tomorrow(), startTime: '14:00', endTime: '16:00',
        location: 'Examination Hall 1', status: 'upcoming', isEditable: false,
        teacher: 'Dr. Rao', relatedCourseId: 'c6'
    },
];

function timesOverlap(
    aStart: string, aEnd: string,
    bStart: string, bEnd: string
): boolean {
    return aStart < bEnd && aEnd > bStart;
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
    private _items = signal<ScheduleItem[]>([...SAMPLE]);

    readonly items = this._items.asReadonly();

    /** Returns a computed that filters items to a specific date. */
    getByDate(date: string) {
        return computed(() =>
            this._items()
                .filter(i => i.date === date)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
        );
    }

    /** Adds a new item. Returns conflict item if overlap detected on same date. */
    addItem(item: ScheduleItem): ScheduleItem | null {
        const conflict = this._items().find(existing =>
            existing.date === item.date &&
            existing.scheduleId !== item.scheduleId &&
            timesOverlap(item.startTime, item.endTime, existing.startTime, existing.endTime)
        );
        if (conflict) return conflict;
        this._items.update(list => [...list, item]);
        return null;
    }

    /** Force-adds even if there's a conflict. */
    forceAddItem(item: ScheduleItem): void {
        this._items.update(list => {
            const idx = list.findIndex(i => i.scheduleId === item.scheduleId);
            if (idx >= 0) {
                const updated = [...list];
                updated[idx] = item;
                return updated;
            }
            return [...list, item];
        });
    }

    updateItem(id: string, patch: Partial<ScheduleItem>): ScheduleItem | null {
        const existing = this._items().find(i => i.scheduleId === id);
        if (!existing) return null;
        const updated = { ...existing, ...patch };
        const conflict = this._items().find(i =>
            i.scheduleId !== id &&
            i.date === updated.date &&
            timesOverlap(updated.startTime, updated.endTime, i.startTime, i.endTime)
        );
        if (conflict) return conflict;
        this._items.update(list => list.map(i => i.scheduleId === id ? updated : i));
        return null;
    }

    forceUpdateItem(id: string, patch: Partial<ScheduleItem>): void {
        this._items.update(list =>
            list.map(i => i.scheduleId === id ? { ...i, ...patch } : i)
        );
    }

    deleteItem(id: string): void {
        this._items.update(list => list.filter(i => i.scheduleId !== id));
    }

    markCompleted(id: string): void {
        this._items.update(list =>
            list.map(i => i.scheduleId === id ? { ...i, status: 'completed' } : i)
        );
    }
}
