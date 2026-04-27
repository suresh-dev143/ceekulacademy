import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StoryMediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface StoryAuthor {
  _id: string;
  name: string;
  profileImage?: string;
}

export interface StoryItem {
  _id: string;
  userId: StoryAuthor | string;
  title: string;
  description: string;
  category: string;
  subCategory?: string;
  media: StoryMediaItem[];
  likes: number;
  views: number;
  status: string;
  createdAt: string;
}

export const STORY_CATEGORIES: Record<string, string[]> = {
  education:  ['Course Completion', 'Skills Development', 'Academic Achievement', 'Teaching'],
  career:     ['Job Placement', 'Promotion', 'Career Change', 'Freelancing'],
  growth:     ['Mindset', 'Habits', 'Leadership', 'Creativity'],
  technology: ['AI & ML', 'Web Development', 'Mobile Apps', 'Open Source'],
  community:  ['Volunteering', 'Mentoring', 'Social Impact', 'Collaboration'],
  health:     ['Fitness', 'Mental Wellbeing', 'Nutrition', 'Meditation'],
  business:   ['Startup', 'Freelance', 'Product Launch', 'Revenue Milestone']
};

export const STORY_CATEGORY_LABELS: Record<string, string> = {
  education:  'Education',
  career:     'Career',
  growth:     'Growth',
  technology: 'Technology',
  community:  'Community',
  health:     'Health',
  business:   'Business'
};

@Injectable({ providedIn: 'root' })
export class StoryService {
  private readonly http = inject(HttpClient);

  private readonly _stories       = signal<StoryItem[]>([]);
  private readonly _selectedStory = signal<StoryItem | null>(null);
  private readonly _loading       = signal(false);
  private readonly _activeCategory = signal('');

  readonly stories        = this._stories.asReadonly();
  readonly selectedStory  = this._selectedStory.asReadonly();
  readonly loading        = this._loading.asReadonly();
  readonly activeCategory = this._activeCategory.asReadonly();

  private readonly base = `${environment.apiUrl}/api/stories`;

  loadStories(category?: string): void {
    this._loading.set(true);
    const params: Record<string, string> = { status: 'approved', limit: '30' };
    if (category) params['category'] = category;

    this.http.get<{ status: boolean; data: StoryItem[] }>(this.base, { params }).subscribe({
      next: (res) => {
        if (res.status) {
          this._stories.set(res.data);
          if (!this._selectedStory() && res.data.length > 0) {
            this._selectedStory.set(res.data[0]);
            this._incrementView(res.data[0]._id);
          }
        }
        this._loading.set(false);
      },
      error: () => this._loading.set(false)
    });
  }

  selectStory(id: string): void {
    const story = this._stories().find(s => s._id === id) ?? null;
    this._selectedStory.set(story);
    if (story) this._incrementView(id);
  }

  clearSelection(): void {
    this._selectedStory.set(null);
  }

  setCategory(category: string): void {
    this._activeCategory.set(category);
    this._selectedStory.set(null);
    this.loadStories(category || undefined);
  }

  likeStory(id: string): Observable<{ status: boolean; data: { likes: number; liked: boolean } }> {
    return this.http
      .patch<{ status: boolean; data: { likes: number; liked: boolean } }>(`${this.base}/${id}/like`, {})
      .pipe(
        tap((res) => {
          if (!res.status) return;
          this._stories.update(list =>
            list.map(s => s._id === id ? { ...s, likes: res.data.likes } : s)
          );
          const sel = this._selectedStory();
          if (sel?._id === id) this._selectedStory.set({ ...sel, likes: res.data.likes });
        })
      );
  }

  createStory(formData: FormData): Observable<{ status: boolean; message: string; data: StoryItem; validation?: import('./validation.service').ValidationResult }> {
    return this.http.post<{ status: boolean; message: string; data: StoryItem; validation?: import('./validation.service').ValidationResult }>(this.base, formData);
  }

  private _incrementView(id: string): void {
    this.http.patch(`${this.base}/${id}/view`, {}).subscribe();
  }

  getAuthorName(story: StoryItem): string {
    return typeof story.userId === 'object' ? story.userId.name : 'Anonymous';
  }

  formatRelativeTime(dateStr: string | Date): string {
    const date  = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    const diff  = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (hours < 1)   return 'Just now';
    if (hours < 24)  return `${hours}h ago`;
    if (days === 1)  return 'Yesterday';
    return `${days}d ago`;
  }

  getCategoryLabel(category: string): string {
    return STORY_CATEGORY_LABELS[category] ?? category;
  }

  getContentParagraphs(description: string): string[] {
    return description.split('\n\n').filter(p => p.trim());
  }
}
