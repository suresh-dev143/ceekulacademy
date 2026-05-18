import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

type KutumbTab = 'family' | 'community' | 'vitals' | 'future';

interface FamilyMember {
  id: string;
  name: string;
  role: string;
  cbId: string | null;
  status: 'active' | 'invited' | 'offline';
  funFlow: number;
}

interface CommunityNode {
  id: string;
  name: string;
  type: 'cg' | 'ward' | 'school' | 'workspace';
  role: string;
  members: number;
  active: boolean;
}

interface FamilyGoal {
  id: string;
  title: string;
  owner: string;
  horizon: 'this-month' | 'this-year' | 'five-year';
  progress: number;
  status: 'active' | 'planned' | 'complete';
}

@Component({
  selector: 'app-kutumb',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kutumb.html',
  styleUrl: './kutumb.scss',
})
export class Kutumb {
  readonly activeTab = signal<KutumbTab>('family');
  readonly expandedMemberId = signal<string | null>(null);
  readonly expandedGoalId   = signal<string | null>(null);

  readonly members = signal<FamilyMember[]>([
    { id: 'm1', name: 'Aravind Kumar',  role: 'Father',        cbId: 'CB100000000042', status: 'active',  funFlow: 340 },
    { id: 'm2', name: 'Savitha Kumar',  role: 'Mother',        cbId: 'CB100000000043', status: 'active',  funFlow: 290 },
    { id: 'm3', name: 'Priya Kumar',    role: 'Sister',        cbId: null,             status: 'invited', funFlow: 0   },
    { id: 'm4', name: 'Rajan Kumar',    role: 'Grandfather',   cbId: 'CB100000000071', status: 'offline', funFlow: 80  },
    { id: 'm5', name: 'Meena Rajan',    role: 'Grandmother',   cbId: null,             status: 'invited', funFlow: 0   },
  ]);

  readonly communityNodes = signal<CommunityNode[]>([
    { id: 'c1', name: 'Koramangala Ward 68',  type: 'ward',      role: 'Resident',      members: 1240, active: true  },
    { id: 'c2', name: 'CG100000000012',        type: 'cg',        role: 'Core Member',   members: 18,   active: true  },
    { id: 'c3', name: 'Sunrise Public School', type: 'school',    role: 'Parent Member', members: 340,  active: true  },
    { id: 'c4', name: 'TechFoundry Co-Space',  type: 'workspace', role: 'Member',        members: 62,   active: false },
  ]);

  readonly goals = signal<FamilyGoal[]>([
    { id: 'g1', title: 'Complete Ceekul Academy enrolment for all adults',  owner: 'Family',        horizon: 'this-month', progress: 65, status: 'active'   },
    { id: 'g2', title: 'Establish daily family reflection ritual',          owner: 'Aravind Kumar', horizon: 'this-month', progress: 40, status: 'active'   },
    { id: 'g3', title: 'Reach 1000 collective FUN neurons',                 owner: 'Family',        horizon: 'this-year',  progress: 71, status: 'active'   },
    { id: 'g4', title: 'Design a 5-year family civilisation blueprint',     owner: 'Family',        horizon: 'five-year',  progress: 10, status: 'planned'  },
    { id: 'g5', title: 'Move grandmother to Ceekul digital ecosystem',      owner: 'Priya Kumar',   horizon: 'this-year',  progress: 0,  status: 'planned'  },
  ]);

  readonly totalFunFlow  = computed(() => this.members().reduce((s, m) => s + m.funFlow, 0));
  readonly activeMembers = computed(() => this.members().filter(m => m.status === 'active').length);
  readonly pendingInvites = computed(() => this.members().filter(m => m.status === 'invited').length);

  readonly familyScore = computed(() => {
    const base = Math.min(100, Math.round((this.totalFunFlow() / 1000) * 100));
    return base;
  });

  readonly activeGoals    = computed(() => this.goals().filter(g => g.status === 'active').length);
  readonly completedGoals = computed(() => this.goals().filter(g => g.status === 'complete').length);

  setTab(tab: KutumbTab): void {
    this.activeTab.set(tab);
  }

  toggleMember(id: string): void {
    this.expandedMemberId.update(curr => curr === id ? null : id);
  }

  toggleGoal(id: string): void {
    this.expandedGoalId.update(curr => curr === id ? null : id);
  }

  horizonLabel(h: FamilyGoal['horizon']): string {
    return { 'this-month': 'This Month', 'this-year': 'This Year', 'five-year': '5-Year Plan' }[h];
  }

  communityTypeIcon(type: CommunityNode['type']): string {
    return { cg: '◎', ward: '⬡', school: '◈', workspace: '◉' }[type];
  }
}
