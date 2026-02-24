import { Component, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LayoutComponent } from '../../components/layout/layout';
import { ScheduleService, ScheduleItem, ScheduleType } from '../../services/schedule.service';

@Component({
    selector: 'app-my-schedule',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, LayoutComponent, DatePipe],
    templateUrl: './my-schedule.html',
    styleUrl: './my-schedule.scss'
})
export class MyScheduleComponent {

    private scheduleService = inject(ScheduleService);
    private fb = inject(FormBuilder);
    private destroyRef = inject(DestroyRef);

    // ── Date navigation ──────────────────────────────────────────────
    dateFilter = signal<'today' | 'tomorrow' | 'custom'>('today');
    selectedDate = signal<string>(this.getDateString(0));
    customDate = signal<string>('');

    // ── Live clock ───────────────────────────────────────────────────
    currentTime = signal<Date>(new Date());

    // ── Modal state ──────────────────────────────────────────────────
    showAddModal = signal<boolean>(false);
    editingItem = signal<ScheduleItem | null>(null);
    conflictItem = signal<ScheduleItem | null>(null);
    forceOverride = signal<boolean>(false);

    // ── Form ─────────────────────────────────────────────────────────
    taskForm: FormGroup = this.fb.group({
        title:     ['', [Validators.required, Validators.minLength(2)]],
        type:      ['personal', Validators.required],
        date:      [this.getDateString(0), Validators.required],
        startTime: ['', Validators.required],
        endTime:   ['', Validators.required],
        location:  ['', Validators.required],
        notes:     ['']
    });

    // ── Timeline constants ───────────────────────────────────────────
    readonly HOUR_HEIGHT = 80;         // px per hour
    readonly GRID_START  = 6;          // 06:00
    readonly GRID_END    = 23;         // 23:00
    readonly timeSlots: number[] = Array.from(
        { length: this.GRID_END - this.GRID_START + 1 },
        (_, i) => i
    );
    readonly totalCanvasHeight = (this.GRID_END - this.GRID_START) * this.HOUR_HEIGHT;

    // ── Computed ─────────────────────────────────────────────────────
    todayItems = computed(() =>
        this.scheduleService.items()
            .filter(i => i.date === this.selectedDate())
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
    );

    liveItem = computed(() => {
        const now = this.currentTime();
        const nowStr = this.toHHMM(now);
        return this.todayItems().find(i =>
            i.status === 'live' ||
            (i.status === 'upcoming' && i.startTime <= nowStr && nowStr < i.endTime)
        ) ?? null;
    });

    upcomingItems = computed(() =>
        this.todayItems().filter(i => i.status === 'upcoming')
    );

    completedItems = computed(() =>
        this.todayItems().filter(i => i.status === 'completed')
    );

    selectedDateObj = computed(() => {
        const [y, m, d] = this.selectedDate().split('-').map(Number);
        return new Date(y, m - 1, d);
    });

    constructor() {
        const timer = setInterval(() => this.currentTime.set(new Date()), 1000);
        this.destroyRef.onDestroy(() => clearInterval(timer));

        const refresher = setInterval(() => this.autoRefreshStatuses(), 60000);
        this.destroyRef.onDestroy(() => clearInterval(refresher));
    }

    // ── Date Navigation ───────────────────────────────────────────────
    setDateFilter(filter: 'today' | 'tomorrow' | 'custom') {
        this.dateFilter.set(filter);
        if (filter === 'today')    this.selectedDate.set(this.getDateString(0));
        if (filter === 'tomorrow') this.selectedDate.set(this.getDateString(1));
    }

    onCustomDateChange(value: string) {
        this.customDate.set(value);
        this.selectedDate.set(value);
        this.dateFilter.set('custom');
    }

    // ── Modal ─────────────────────────────────────────────────────────
    openAddModal() {
        this.editingItem.set(null);
        this.conflictItem.set(null);
        this.forceOverride.set(false);
        this.taskForm.reset({
            type: 'personal',
            date: this.selectedDate()
        });
        this.showAddModal.set(true);
    }

    openEditModal(item: ScheduleItem) {
        this.editingItem.set(item);
        this.conflictItem.set(null);
        this.forceOverride.set(false);
        this.taskForm.patchValue({
            title:     item.title,
            type:      item.type,
            date:      item.date,
            startTime: item.startTime,
            endTime:   item.endTime,
            location:  item.location,
            notes:     item.notes ?? ''
        });
        this.showAddModal.set(true);
    }

    closeModal() {
        this.showAddModal.set(false);
        this.editingItem.set(null);
        this.conflictItem.set(null);
        this.forceOverride.set(false);
    }

    onSaveTask() {
        this.taskForm.markAllAsTouched();
        if (this.taskForm.invalid) return;

        const v = this.taskForm.value;
        if (v.startTime >= v.endTime) {
            this.taskForm.get('endTime')?.setErrors({ endBeforeStart: true });
            return;
        }

        const editing = this.editingItem();

        if (this.forceOverride()) {
            // Force save ignoring conflict
            if (editing) {
                this.scheduleService.forceUpdateItem(editing.scheduleId, {
                    ...v, status: editing.status, isEditable: true
                });
            } else {
                this.scheduleService.forceAddItem(this.buildItem(v));
            }
            this.closeModal();
            return;
        }

        if (editing) {
            const conflict = this.scheduleService.updateItem(editing.scheduleId, {
                ...v, status: editing.status, isEditable: true
            });
            if (conflict) { this.conflictItem.set(conflict); return; }
        } else {
            const conflict = this.scheduleService.addItem(this.buildItem(v));
            if (conflict) { this.conflictItem.set(conflict); return; }
        }

        this.closeModal();
    }

    private buildItem(v: any): ScheduleItem {
        return {
            scheduleId: 'u-' + Date.now(),
            userId: 'u1',
            title: v.title,
            type: v.type as ScheduleType,
            date: v.date,
            startTime: v.startTime,
            endTime: v.endTime,
            location: v.location,
            notes: v.notes,
            status: 'upcoming',
            isEditable: true
        };
    }

    // ── Actions ───────────────────────────────────────────────────────
    markCompleted(id: string) {
        this.scheduleService.markCompleted(id);
    }

    deleteTask(id: string) {
        this.scheduleService.deleteItem(id);
    }

    // ── Timeline helpers ──────────────────────────────────────────────
    timeToY(time: string): number {
        const [h, m] = time.split(':').map(Number);
        return ((h - this.GRID_START) * 60 + m) * (this.HOUR_HEIGHT / 60);
    }

    durationToHeight(start: string, end: string): number {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const mins = (eh * 60 + em) - (sh * 60 + sm);
        return Math.max(mins * (this.HOUR_HEIGHT / 60), 24);
    }

    hourLabel(index: number): string {
        const h = this.GRID_START + index;
        if (h === 0)  return '12 AM';
        if (h < 12)   return `${h} AM`;
        if (h === 12) return '12 PM';
        return `${h - 12} PM`;
    }

    formatTime(time: string): string {
        const [h, m] = time.split(':').map(Number);
        const suffix = h >= 12 ? 'PM' : 'AM';
        const hh = h % 12 === 0 ? 12 : h % 12;
        return `${hh}:${m.toString().padStart(2, '0')} ${suffix}`;
    }

    getTypeBadgeLabel(type: string): string {
        const map: Record<string, string> = {
            class: 'Class', meeting: 'Meeting', personal: 'Personal', exam: 'Exam'
        };
        return map[type] ?? type;
    }

    getLiveStatusLabel(item: ScheduleItem): string {
        const nowStr = this.toHHMM(this.currentTime());
        if (item.status === 'live') return 'LIVE';
        if (item.startTime > nowStr) {
            const [sh, sm] = item.startTime.split(':').map(Number);
            const [nh, nm] = nowStr.split(':').map(Number);
            const diff = (sh * 60 + sm) - (nh * 60 + nm);
            if (diff <= 10) return 'STARTING SOON';
        }
        return 'ACTIVE';
    }

    nowIndicatorTop = computed(() => {
        const now = this.currentTime();
        const h = now.getHours();
        const m = now.getMinutes();
        if (h < this.GRID_START || h >= this.GRID_END) return -1;
        return ((h - this.GRID_START) * 60 + m) * (this.HOUR_HEIGHT / 60);
    });

    // ── Utilities ─────────────────────────────────────────────────────
    private getDateString(daysOffset: number): string {
        const d = new Date();
        d.setDate(d.getDate() + daysOffset);
        return d.toISOString().split('T')[0];
    }

    private toHHMM(date: Date): string {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    private autoRefreshStatuses() {
        const nowStr = this.toHHMM(new Date());
        const todayStr = this.getDateString(0);
        this.scheduleService.items().forEach(item => {
            if (item.date !== todayStr) return;
            if (item.status === 'completed') return;
            if (item.endTime <= nowStr) {
                this.scheduleService.markCompleted(item.scheduleId);
            }
        });
    }

    trackById(_: number, item: ScheduleItem) { return item.scheduleId; }

    readonly typeOptions: { value: ScheduleType; label: string }[] = [
        { value: 'class',    label: 'Academic Session' },
        { value: 'meeting',  label: 'Meeting' },
        { value: 'personal', label: 'Personal Task' },
        { value: 'exam',     label: 'Exam' }
    ];
}
