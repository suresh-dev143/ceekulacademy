import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface Activity {
  type: string;
  text: string;
}

interface Topic {
  id: string;
  title: string;
  activities: Activity[];
}

@Component({
  selector: 'app-my-activities',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-activities.html',
  styleUrl: './my-activities.scss'
})
export class MyActivities implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);

  readonly collapsed = signal(false);
  readonly ceebrainId = computed(() => {
    const raw = this.auth.currentUserProfile()?.ceebrainId ?? '';
    if (!raw) return '';
    return raw.startsWith('CB') ? raw : `CB${raw}`;
  });

  readonly currentDate = signal<string>('');
  readonly currentTime = signal<string>('');

  private timerId?: any;

  readonly topics = signal<Topic[]>([
    {
      id: 'self-improvement',
      title: 'Self-Improvement',
      activities: [
        { type: 'Morning Reflection', text: 'Understand your behavioral patterns' },
        { type: 'Focus Exercise', text: 'Spend 10 minutes observing distraction triggers' },
        { type: 'Micro Learning', text: 'Watch: “Discipline Through Systems”' }
      ]
    },
    {
      id: 'creative-expression',
      title: 'Creative Expression',
      activities: [
        { type: 'Visual Thinking', text: 'Sketch your next idea' },
        { type: 'Creative Writing', text: 'Write one future scenario' },
        { type: 'AI Collaboration', text: 'Generate one concept with AI tools' }
      ]
    },
    {
      id: 'family-transformation',
      title: 'Family Transformation',
      activities: [
        { type: 'Family Values', text: 'Define your core family principles' },
        { type: 'Communication Hub', text: 'Setup a shared digital space for family' }
      ]
    },
    {
      id: 'evolving-digital-systems',
      title: 'Evolving Digital Systems',
      activities: [
        { type: 'System Audit', text: 'Review your current digital workflows' },
        { type: 'AI Automation', text: 'Identify one task to automate' }
      ]
    },
    {
      id: 'identify-project',
      title: 'Identify Your Project',
      activities: [
        { type: 'Passion Discovery', text: 'List 3 things you are curious about' },
        { type: 'Project Scoping', text: 'Define a 1-week MVP for your idea' }
      ]
    }
  ]);

  readonly selectedTopicId = signal<string>('self-improvement');

  readonly selectedTopic = computed(() =>
    this.topics().find(t => t.id === this.selectedTopicId())
  );

  ngOnInit() {
    this.updateDateTime();
    this.timerId = setInterval(() => this.updateDateTime(), 1000);
  }

  ngOnDestroy() {
    if (this.timerId) clearInterval(this.timerId);
  }

  private updateDateTime() {
    const now = new Date();
    this.currentDate.set(now.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }));
    this.currentTime.set(now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }));
  }

  toggleHub() {
    this.collapsed.update(v => !v);
  }

  selectTopic(id: string) {
    this.selectedTopicId.set(id);
  }
}
