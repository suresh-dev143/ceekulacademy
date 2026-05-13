import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  selector: 'app-personal-hub',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-hub.html',
  styleUrl: './personal-hub.scss'
})
export class PersonalHubComponent {
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

  selectTopic(id: string) {
    this.selectedTopicId.set(id);
  }
}
