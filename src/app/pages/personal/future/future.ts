import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

type FutureTab = 'goals' | 'aspirations' | 'blueprint' | 'timeline';

interface LifeGoal {
  id: string;
  title: string;
  category: 'self' | 'family' | 'community' | 'civilization';
  horizon: 'one-year' | 'five-year' | 'ten-year' | 'lifetime';
  progress: number;
  status: 'active' | 'planned' | 'complete';
}

interface Aspiration {
  id: string;
  domain: string;
  glyph: string;
  vision: string;
  current: string;
}

interface BlueprintPillar {
  id: string;
  title: string;
  description: string;
  score: number;
}

interface TimelineEvent {
  year: string;
  title: string;
  type: 'milestone' | 'goal' | 'vision';
  done: boolean;
}

@Component({
  selector: 'app-future',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './future.html',
  styleUrl: './future.scss',
})
export class Future {
  readonly activeTab = signal<FutureTab>('goals');
  readonly expandedGoalId = signal<string | null>(null);

  readonly goals = signal<LifeGoal[]>([
    { id: 'lg1', title: 'Complete Ceekul Academy civilizer track',       category: 'self',         horizon: 'one-year',  progress: 42, status: 'active'  },
    { id: 'lg2', title: 'Establish weekly family learning circle',        category: 'family',       horizon: 'one-year',  progress: 30, status: 'active'  },
    { id: 'lg3', title: 'Launch a community knowledge project',           category: 'community',    horizon: 'five-year', progress: 8,  status: 'planned' },
    { id: 'lg4', title: 'Master a second domain of expertise',            category: 'self',         horizon: 'five-year', progress: 15, status: 'active'  },
    { id: 'lg5', title: 'Design and contribute a civilisation blueprint', category: 'civilization', horizon: 'ten-year',  progress: 3,  status: 'planned' },
    { id: 'lg6', title: 'Reach financial sovereignty through neurons',    category: 'self',         horizon: 'five-year', progress: 22, status: 'active'  },
    { id: 'lg7', title: 'Raise children in the Ceekul value system',     category: 'family',       horizon: 'lifetime',  progress: 60, status: 'active'  },
  ]);

  readonly aspirations = signal<Aspiration[]>([
    { id: 'a1', domain: 'Health & Vitality', glyph: '◈', vision: 'Sustained peak physical and cognitive energy throughout life', current: 'Building daily regenerative routines' },
    { id: 'a2', domain: 'Knowledge Mastery', glyph: '◎', vision: 'Deep expertise in consciousness, computation, and civilisation design', current: 'Active in 3 learning tracks' },
    { id: 'a3', domain: 'Family Legacy',     glyph: '⬡', vision: 'A family lineage that uplifts every generation in its wake', current: 'Introducing children to Ceekul framework' },
    { id: 'a4', domain: 'Economic Freedom',  glyph: '◉', vision: 'Neuron income sustaining life without exchanging time for money', current: 'Building FUN neuron reserves' },
    { id: 'a5', domain: 'Social Impact',     glyph: '◬', vision: 'Measurable civilisational transformation in my community and beyond', current: 'Contributing to ward-level reform' },
  ]);

  readonly pillars = signal<BlueprintPillar[]>([
    { id: 'p1', title: 'Physical & Mental Health',  description: 'Regenerative daily discipline, nutrition, rest, and cognitive training protocols.', score: 68 },
    { id: 'p2', title: 'Knowledge & Skills',        description: 'Continuous deepening of domain expertise and civilisational frameworks.', score: 55 },
    { id: 'p3', title: 'Financial Architecture',    description: 'Neuron accumulation, investment, and resource allocation strategy.', score: 40 },
    { id: 'p4', title: 'Family & Relationships',    description: 'Kutumb health, legacy design, and intentional relationship cultivation.', score: 72 },
    { id: 'p5', title: 'Community Contribution',    description: 'Active participation in local CG, ward governance, and reform initiatives.', score: 35 },
    { id: 'p6', title: 'Civilisational Purpose',    description: 'Alignment of personal life with the long-range vision of Ceekul.', score: 28 },
  ]);

  readonly timeline = signal<TimelineEvent[]>([
    { year: '2025', title: 'Joined Ceekul Academy ecosystem',         type: 'milestone', done: true  },
    { year: '2026', title: 'Completed first Academy learning track',  type: 'goal',      done: false },
    { year: '2027', title: 'First community project launched',        type: 'goal',      done: false },
    { year: '2028', title: 'Achieved FUN neuron financial threshold', type: 'goal',      done: false },
    { year: '2030', title: 'Family civilisation blueprint complete',  type: 'vision',    done: false },
    { year: '2035', title: 'Domain mastery and publishing achieved',  type: 'vision',    done: false },
  ]);

  readonly activeGoalsCount   = computed(() => this.goals().filter(g => g.status === 'active').length);
  readonly overallProgress    = computed(() => {
    const active = this.goals().filter(g => g.status === 'active');
    if (!active.length) return 0;
    return Math.round(active.reduce((s, g) => s + g.progress, 0) / active.length);
  });
  readonly blueprintScore = computed(() =>
    Math.round(this.pillars().reduce((s, p) => s + p.score, 0) / this.pillars().length)
  );

  setTab(tab: FutureTab): void { this.activeTab.set(tab); }
  toggleGoal(id: string): void { this.expandedGoalId.update(c => c === id ? null : id); }

  horizonLabel(h: LifeGoal['horizon']): string {
    return { 'one-year': '1-Year', 'five-year': '5-Year', 'ten-year': '10-Year', 'lifetime': 'Lifetime' }[h];
  }

  categoryColor(c: LifeGoal['category']): string {
    return { self: '#f59e0b', family: '#10b981', community: '#3b82f6', civilization: '#8b5cf6' }[c];
  }
}
