import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivityService, Activity, ActivityType } from '../../../services/activity.service';

@Component({
  selector: 'app-my-activities',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './my-activities.html',
  styleUrl: './my-activities.scss',
})
export class MyActivities implements OnInit {
  readonly svc = inject(ActivityService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly types: { value: ActivityType; label: string; color: string }[] = [
    { value: 'health',   label: 'Health',   color: '#4ade80' },
    { value: 'learning', label: 'Learning', color: '#60a5fa' },
    { value: 'work',     label: 'Work',     color: '#f97316' },
    { value: 'personal', label: 'Personal', color: '#c084fc' },
  ];

  // UI state
  editingId: string | null  = null;
  addingNew = false;
  dragFromIndex: number | null = null;
  dragOverIndex: number | null = null;
  validationError: string | null = null;

  // New-slot form fields
  newStart       = '';
  newEnd         = '';
  newTitle       = '';
  newDescription = '';
  newType: ActivityType = 'work';

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) this.svc.load();
  }

  typeColor(type: ActivityType): string {
    return this.types.find(t => t.value === type)?.color ?? '#888';
  }

  typeLabel(type: ActivityType): string {
    return this.types.find(t => t.value === type)?.label ?? type;
  }

  formatTime(time: string): string {
    if (!time) return '--';
    const [h, m] = time.split(':').map(Number);
    const ampm   = h < 12 ? 'AM' : 'PM';
    const h12    = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  // ── Editing ─────────────────────────────────────────────────────
  startEdit(id: string): void { this.editingId = id; }
  stopEdit(): void             { this.editingId = null; }

  onFieldChange(id: string, field: keyof Omit<Activity, 'id'>, value: string): void {
    this.svc.update(id, { [field]: value } as Partial<Omit<Activity, 'id'>>);
  }

  remove(id: string): void {
    this.svc.remove(id);
    if (this.editingId === id) this.editingId = null;
  }

  // ── Add new slot ─────────────────────────────────────────────────
  openAdd(): void {
    this.addingNew      = true;
    this.newStart       = '';
    this.newEnd         = '';
    this.newTitle       = '';
    this.newDescription = '';
    this.newType        = 'work';
    this.validationError = null;
  }

  cancelAdd(): void {
    this.addingNew       = false;
    this.validationError = null;
  }

  confirmAdd(): void {
    const err = this._validate(this.newStart, this.newEnd, this.newTitle);
    if (err) { this.validationError = err; return; }
    this.svc.add({
      startTime:   this.newStart,
      endTime:     this.newEnd,
      title:       this.newTitle.trim(),
      description: this.newDescription.trim(),
      type:        this.newType,
    });
    this.addingNew       = false;
    this.validationError = null;
  }

  // ── Save ─────────────────────────────────────────────────────────
  save(): void {
    this.svc.save().subscribe({ error: () => {} });
  }

  // ── Drag & Drop ──────────────────────────────────────────────────
  onDragStart(index: number, event: DragEvent): void {
    this.dragFromIndex = index;
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(index: number, event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dragOverIndex = index;
  }

  onDragLeave(): void {
    this.dragOverIndex = null;
  }

  onDrop(toIndex: number, event: DragEvent): void {
    event.preventDefault();
    if (this.dragFromIndex !== null) this.svc.reorder(this.dragFromIndex, toIndex);
    this.dragFromIndex = null;
    this.dragOverIndex = null;
  }

  onDragEnd(): void {
    this.dragFromIndex = null;
    this.dragOverIndex = null;
  }

  // ── Validation ───────────────────────────────────────────────────
  private _validate(start: string, end: string, title: string): string | null {
    if (!start)        return 'Start time is required.';
    if (!end)          return 'End time is required.';
    if (!title.trim()) return 'Activity title is required.';
    return null;
  }
}
