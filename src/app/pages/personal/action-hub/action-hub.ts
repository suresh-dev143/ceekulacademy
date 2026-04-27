import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StoryService, StoryItem, STORY_CATEGORY_LABELS } from '../../../services/story.service';

type ActiveTab = 'create' | 'offer' | 'advertise' | 'explore';

interface CreateOption {
  label: string;
  description: string;
  route: string;
  tag: string;
  available: boolean;
}

interface OfferOption {
  label: string;
  description: string;
  tag: string;
  available: boolean;
}

@Component({
  selector: 'app-action-hub',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-hub.html',
  styleUrl: './action-hub.scss'
})
export class ActionHub implements OnInit {
  private readonly router = inject(Router);
  private readonly storyService = inject(StoryService);

  readonly activeTab = signal<ActiveTab>('explore');
  readonly searchQuery = signal('');
  readonly activeCategory = signal('');
  readonly selectedStory = signal<StoryItem | null>(null);
  readonly toast = signal('');

  readonly adTitle = signal('');
  readonly adDescription = signal('');
  readonly adAudience = signal('');
  readonly adSubmitted = signal(false);
  readonly adSubmitting = signal(false);

  readonly stories = this.storyService.stories;
  readonly loading = this.storyService.loading;
  readonly categoryKeys = Object.keys(STORY_CATEGORY_LABELS);
  readonly categoryLabels = STORY_CATEGORY_LABELS;

  readonly filteredStories = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.activeCategory();
    return this.stories().filter(s => {
      const matchesQ = !q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      const matchesCat = !cat || s.category === cat;
      return matchesQ && matchesCat;
    });
  });

  readonly createOptions: CreateOption[] = [
    { label: 'Article / Story', description: 'Write and publish a story or insight', route: '/personal/create', tag: 'STORY', available: true },
    { label: 'Course', description: 'Design a structured learning program', route: '', tag: 'COURSE', available: false },
    { label: 'Code / Project', description: 'Showcase technical or open-source work', route: '/personal/projects', tag: 'PROJECT', available: true },
    { label: 'Multimedia', description: 'Upload video, audio or photo content', route: '', tag: 'MEDIA', available: false },
  ];

  readonly offerOptions: OfferOption[] = [
    { label: 'Offer Course', description: 'Share your knowledge as a structured program', tag: 'EDUCATION', available: true },
    { label: 'Offer Healthcare', description: 'Provide health or wellness services to the community', tag: 'HEALTH', available: false },
    { label: 'Offer Legal Support', description: 'Provide legal guidance or consultancy', tag: 'JUSTICE', available: false },
    { label: 'Offer Infrastructure', description: 'Contribute facilities, labs or services', tag: 'SERVICES', available: false },
  ];

  ngOnInit(): void {
    this.storyService.loadStories();
  }

  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    this.selectedStory.set(null);
    if (tab === 'explore') {
      this.storyService.loadStories(this.activeCategory() || undefined);
    }
  }

  setCategory(cat: string): void {
    const next = this.activeCategory() === cat ? '' : cat;
    this.activeCategory.set(next);
    this.storyService.setCategory(next);
  }

  openStory(story: StoryItem): void {
    this.selectedStory.set(story);
  }

  closeStory(): void {
    this.selectedStory.set(null);
  }

  getActionLabel(category: string): string {
    if (category === 'education') return 'Enroll';
    if (category === 'health') return 'Book';
    if (category === 'community') return 'Participate';
    return 'Request';
  }

  likeStory(story: StoryItem, event: Event): void {
    event.stopPropagation();
    this.storyService.likeStory(story._id).subscribe();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getAuthorName(story: StoryItem): string {
    return this.storyService.getAuthorName(story);
  }

  getTime(story: StoryItem): string {
    return this.storyService.formatRelativeTime(story.createdAt);
  }

  getFirstImage(story: StoryItem): string | null {
    return story.media?.find(m => m.type === 'image')?.url ?? null;
  }

  handleCreate(option: CreateOption): void {
    if (option.available) {
      this.router.navigate([option.route]);
    } else {
      this.showToast(`${option.label} — coming soon`);
    }
  }

  handleOffer(option: OfferOption): void {
    if (option.available) {
      this.router.navigate(['/personal/create']);
    } else {
      this.showToast(`${option.label} — coming soon`);
    }
  }

  submitAd(): void {
    if (!this.adTitle().trim()) return;
    this.adSubmitting.set(true);
    setTimeout(() => {
      this.adSubmitting.set(false);
      this.adSubmitted.set(true);
    }, 1200);
  }

  resetAd(): void {
    this.adTitle.set('');
    this.adDescription.set('');
    this.adAudience.set('');
    this.adSubmitted.set(false);
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
