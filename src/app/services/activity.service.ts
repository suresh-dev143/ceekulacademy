import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type ActivityType = 'health' | 'learning' | 'work' | 'personal';

export interface Activity {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  type: ActivityType;
}

interface ActivitiesDoc {
  _id?: string;
  activities: Activity[];
}

export const DEFAULT_ACTIVITIES: Activity[] = [
  { id: '1',  startTime: '05:00', endTime: '06:00', title: 'Cleansing, Detox & Regenerative Drinks', description: '', type: 'health' },
  { id: '2',  startTime: '06:00', endTime: '07:00', title: 'Exercise & Meditation',                  description: '', type: 'health' },
  { id: '3',  startTime: '07:00', endTime: '08:00', title: 'Nature Care',                            description: '', type: 'health' },
  { id: '4',  startTime: '08:00', endTime: '09:00', title: 'Breakfast & Family Time',                description: '', type: 'personal' },
  { id: '5',  startTime: '09:00', endTime: '12:00', title: 'Deep Work',                              description: '', type: 'work' },
  { id: '6',  startTime: '12:00', endTime: '13:00', title: 'Lunch Break',                            description: '', type: 'health' },
  { id: '7',  startTime: '13:00', endTime: '15:00', title: 'Creative Projects',                      description: '', type: 'work' },
  { id: '8',  startTime: '15:00', endTime: '16:00', title: 'Community & Social',                     description: '', type: 'personal' },
  { id: '9',  startTime: '16:00', endTime: '17:00', title: 'Physical Activity',                      description: '', type: 'health' },
  { id: '10', startTime: '17:00', endTime: '18:00', title: 'Reading & Research',                     description: '', type: 'learning' },
  { id: '11', startTime: '18:00', endTime: '19:00', title: 'Dinner & Rest',                          description: '', type: 'health' },
  { id: '12', startTime: '19:00', endTime: '21:00', title: 'Learning & Innovation',                  description: '', type: 'learning' },
  { id: '13', startTime: '21:00', endTime: '22:00', title: 'Reflection & Planning',                  description: '', type: 'personal' },
  { id: '14', startTime: '22:00', endTime: '05:00', title: 'Sleep & Recovery',                       description: '', type: 'health' },
];

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/my-activities`;

  private readonly _activities  = signal<Activity[]>([]);
  private readonly _loading     = signal(false);
  private readonly _saving      = signal(false);
  private readonly _saveSuccess = signal(false);
  private readonly _saveError   = signal<string | null>(null);
  private readonly _docId       = signal<string | null>(null);

  readonly activities  = this._activities.asReadonly();
  readonly loading     = this._loading.asReadonly();
  readonly saving      = this._saving.asReadonly();
  readonly saveSuccess = this._saveSuccess.asReadonly();
  readonly saveError   = this._saveError.asReadonly();

  load(): void {
    this._loading.set(true);
    this.http.get<{ status: boolean; data: ActivitiesDoc }>(this.base).subscribe({
      next: (res) => {
        if (res.status && res.data?.activities?.length) {
          this._activities.set(res.data.activities);
          this._docId.set(res.data._id ?? null);
        } else {
          this._activities.set(structuredClone(DEFAULT_ACTIVITIES));
        }
        this._loading.set(false);
      },
      error: () => {
        this._activities.set(structuredClone(DEFAULT_ACTIVITIES));
        this._loading.set(false);
      },
    });
  }

  save(): Observable<{ status: boolean; data: ActivitiesDoc }> {
    this._saving.set(true);
    this._saveSuccess.set(false);
    this._saveError.set(null);

    const docId   = this._docId();
    const payload = { activities: this._activities() };
    const req$    = docId
      ? this.http.put<{ status: boolean; data: ActivitiesDoc }>(`${this.base}/${docId}`, payload)
      : this.http.post<{ status: boolean; data: ActivitiesDoc }>(this.base, payload);

    return req$.pipe(
      tap({
        next: (res) => {
          if (res.data?._id) this._docId.set(res.data._id);
          this._saving.set(false);
          this._saveSuccess.set(true);
          setTimeout(() => this._saveSuccess.set(false), 3000);
        },
        error: (e: any) => {
          this._saving.set(false);
          this._saveError.set(e?.error?.message ?? 'Save failed. Please try again.');
          setTimeout(() => this._saveError.set(null), 4000);
        },
      })
    );
  }

  add(activity: Omit<Activity, 'id'>): void {
    const item: Activity = { ...activity, id: crypto.randomUUID() };
    this._activities.update(list => [...list, item]);
  }

  update(id: string, changes: Partial<Omit<Activity, 'id'>>): void {
    this._activities.update(list =>
      list.map(a => a.id === id ? { ...a, ...changes } : a)
    );
  }

  remove(id: string): void {
    this._activities.update(list => list.filter(a => a.id !== id));
  }

  reorder(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;
    this._activities.update(list => {
      const arr = [...list];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, item);
      return arr;
    });
  }
}
