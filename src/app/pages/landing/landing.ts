import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GlobalSearchComponent } from '../../components/global-search/global-search';
import { StoryService, StoryItem, STORY_CATEGORY_LABELS } from '../../services/story.service';
import { DiscussionChatComponent } from '../../components/discussion-chat/discussion-chat';

interface Pillar {
  title: string;
  descriptor: string;
  iconId: string;
}

interface ContentSection {
  id: string;
  title: string;
  heading: string;
  tagline?: string;
  items?: string[];
  pillars?: Pillar[];
  description?: string;
  note?: string;
}

@Component({
  selector: 'app-landing',
  imports: [CommonModule, GlobalSearchComponent, DiscussionChatComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing implements OnInit {
  private readonly router = inject(Router);
  readonly storyService = inject(StoryService);

  readonly stories       = this.storyService.stories;
  readonly selectedStory = this.storyService.selectedStory;
  readonly loading       = this.storyService.loading;
  readonly activeCategory = this.storyService.activeCategory;

  readonly categoryKeys   = Object.keys(STORY_CATEGORY_LABELS);
  readonly categoryLabels = STORY_CATEGORY_LABELS;

  readonly likedStories = signal<Set<string>>(new Set());

  selectedId = signal('academy');
  activeTab  = signal<'titles' | 'content' | 'chat'>('content');

  selectedContent = computed(() => this.contentData[this.selectedId()]);

  contentData: Record<string, ContentSection> = {
    academy: {
      id: 'academy',
      title: 'CEEKUL ACADEMY',
      heading: 'COMPUTABLE VISION',
      tagline: '',
      pillars: [
        { title: 'Understanding Consciousness',      descriptor: 'Exploration of cognitive awareness frameworks and theoretical models of mind.',                         iconId: 'mind'    },
        { title: 'Consciousness & Computation',      descriptor: 'Investigating computational parallels of human cognition and symbolic processing.',                     iconId: 'compute' },
        { title: 'Emerging Models of Computation',  descriptor: 'Post-classical paradigms including quantum, neuromorphic, and distributed architectures.',              iconId: 'quantum' },
        { title: 'Data Encoding & Representation',  descriptor: 'Formal structures for transforming perception into computable abstractions.',                           iconId: 'data'    },
        { title: 'User-Centric Web of Things',       descriptor: 'Human-aligned IoT ecosystems integrating context-aware digital intelligence.',                        iconId: 'network' },
        { title: 'Human–Machine Synergy',           descriptor: 'Collaborative intelligence models bridging biological cognition and artificial systems.',               iconId: 'synergy' }
      ],
      note: 'The emerging Computable Vision will be implemented by Ceekul Academy.'
    },
    vision:     { id: 'vision',     title: 'VISION COUNCIL',   heading: 'VISION COUNCIL',      description: 'The Vision Council shapes the strategic direction and long-term vision of Ceekul Civilisation, ensuring alignment with our core principles and emerging computational paradigms.' },
    civilizer:  { id: 'civilizer',  title: 'CIVILIZER',        heading: 'CIVILIZER PROGRAM',   description: 'Civilizers are change agents who embody and promote the values of Ceekul Civilisation, fostering growth and evolution in our digital ecosystem.' },
    reformers:  { id: 'reformers',  title: 'REFORMERS',        heading: 'REFORMERS INITIATIVE', description: 'Reformers drive continuous improvement and innovation, challenging existing paradigms and proposing transformative solutions.' },
    executive:  { id: 'executive',  title: 'EXECUTIVE COUNCIL', heading: 'EXECUTIVE COUNCIL',  description: 'The Executive Council oversees operational excellence and ensures effective implementation of our strategic vision across all initiatives.' },
    chancellor: { id: 'chancellor', title: 'CHANCELLOR',        heading: 'CHANCELLOR OFFICE',  description: 'The Chancellor provides leadership and governance, guiding Ceekul Civilisation toward its transformative goals.' },
    planners:   { id: 'planners',   title: 'PLANNERS',          heading: 'STRATEGIC PLANNERS', description: 'Planners design and coordinate comprehensive strategies to achieve our vision of a computational civilization.' },
    transformers:{ id: 'transformers', title: 'TRANSFORMERS',  heading: 'TRANSFORMERS NETWORK', description: 'Transformers are specialists in implementing change, converting strategic plans into tangible outcomes.' },
    directors:  { id: 'directors',  title: 'DIRECTORS',        heading: 'DIRECTORS BOARD',     description: 'Directors provide oversight and guidance for specific programs and initiatives within the Ceekul ecosystem.' },
    managers:   { id: 'managers',   title: 'MANAGERS',         heading: 'PROGRAM MANAGERS',    description: 'Managers ensure day-to-day operations run smoothly and objectives are met efficiently.' }
  };

  ngOnInit(): void {
    this.storyService.loadStories();
  }

  selectStoryItem(id: string): void {
    this.storyService.selectStory(id);
    this.activeTab.set('content');
  }

  setCategory(cat: string): void {
    this.storyService.setCategory(cat);
    if (window.innerWidth <= 1024) this.activeTab.set('titles');
  }

  selectTitle(id: string): void {
    this.selectedId.set(id);
    this.storyService.clearSelection();
    this.activeTab.set('content');
  }

  setActiveTab(tab: 'titles' | 'content' | 'chat'): void {
    this.activeTab.set(tab);
  }

  toggleLike(id: string, event: Event): void {
    event.stopPropagation();
    this.storyService.likeStory(id).subscribe({
      next: (res) => {
        this.likedStories.update(set => {
          const next = new Set(set);
          res.data.liked ? next.add(id) : next.delete(id);
          return next;
        });
      }
    });
  }

  isLiked(id: string): boolean {
    return this.likedStories().has(id);
  }

  getAuthorName(story: StoryItem): string {
    return this.storyService.getAuthorName(story);
  }

  formatRelativeTime(date: string | Date): string {
    return this.storyService.formatRelativeTime(date);
  }

  getCategoryLabel(cat: string): string {
    return this.storyService.getCategoryLabel(cat);
  }

  getContentParagraphs(content: string): string[] {
    return this.storyService.getContentParagraphs(content);
  }

  onRegister(): void { this.router.navigate(['/personal/register']); }
  onContact(): void  { this.router.navigate(['/contact']); }
}
