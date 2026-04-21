import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalSearchComponent } from '../../components/global-search/global-search';

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
  imports: [CommonModule,GlobalSearchComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing {
  selectedId = signal('academy');

  titles = [
    { id: 'academy', title: 'FUTURE ACADEMY' },
    { id: 'vision', title: 'VISION COUNCIL' },
    { id: 'civilizer', title: 'CIVILIZER' },
    { id: 'reformers', title: 'REFORMERS' },
    { id: 'executive', title: 'EXECUTIVE COUNCIL' },
    { id: 'chancellor', title: 'CHANCELLOR' },
    { id: 'planners', title: 'PLANNERS' },
    { id: 'transformers', title: 'TRANSFORMERS' },
    { id: 'directors', title: 'DIRECTORS' },
    { id: 'managers', title: 'MANAGERS' }
  ];

  contentData: Record<string, ContentSection> = {
    academy: {
      id: 'academy',
      title: 'CEEKUL ACADEMY',
      heading: 'COMPUTABLE VISION',
      tagline: '',
      pillars: [
        {
          title: 'Understanding Consciousness',
          descriptor: 'Exploration of cognitive awareness frameworks and theoretical models of mind.',
          iconId: 'mind'
        },
        {
          title: 'Consciousness & Computation',
          descriptor: 'Investigating computational parallels of human cognition and symbolic processing.',
          iconId: 'compute'
        },
        {
          title: 'Emerging Models of Computation',
          descriptor: 'Post-classical paradigms including quantum, neuromorphic, and distributed architectures.',
          iconId: 'quantum'
        },
        {
          title: 'Data Encoding & Representation',
          descriptor: 'Formal structures for transforming perception into computable abstractions.',
          iconId: 'data'
        },
        {
          title: 'User-Centric Web of Things',
          descriptor: 'Human-aligned IoT ecosystems integrating context-aware digital intelligence.',
          iconId: 'network'
        },
        {
          title: 'Human–Machine Synergy',
          descriptor: 'Collaborative intelligence models bridging biological cognition and artificial systems.',
          iconId: 'synergy'
        }
      ],
      note: 'The emerging Computable Vision will be implemented by Ceekul Academy.'
    },
    vision: {
      id: 'vision',
      title: 'VISION COUNCIL',
      heading: 'VISION COUNCIL',
      description: 'The Vision Council shapes the strategic direction and long-term vision of Ceekul Civilisation, ensuring alignment with our core principles and emerging computational paradigms.'
    },
    civilizer: {
      id: 'civilizer',
      title: 'CIVILIZER',
      heading: 'CIVILIZER PROGRAM',
      description: 'Civilizers are change agents who embody and promote the values of Ceekul Civilisation, fostering growth and evolution in our digital ecosystem.'
    },
    reformers: {
      id: 'reformers',
      title: 'REFORMERS',
      heading: 'REFORMERS INITIATIVE',
      description: 'Reformers drive continuous improvement and innovation, challenging existing paradigms and proposing transformative solutions.'
    },
    executive: {
      id: 'executive',
      title: 'EXECUTIVE COUNCIL',
      heading: 'EXECUTIVE COUNCIL',
      description: 'The Executive Council oversees operational excellence and ensures effective implementation of our strategic vision across all initiatives.'
    },
    chancellor: {
      id: 'chancellor',
      title: 'CHANCELLOR',
      heading: 'CHANCELLOR OFFICE',
      description: 'The Chancellor provides leadership and governance, guiding Ceekul Civilisation toward its transformative goals.'
    },
    planners: {
      id: 'planners',
      title: 'PLANNERS',
      heading: 'STRATEGIC PLANNERS',
      description: 'Planners design and coordinate comprehensive strategies to achieve our vision of a computational civilization.'
    },
    transformers: {
      id: 'transformers',
      title: 'TRANSFORMERS',
      heading: 'TRANSFORMERS NETWORK',
      description: 'Transformers are specialists in implementing change, converting strategic plans into tangible outcomes.'
    },
    directors: {
      id: 'directors',
      title: 'DIRECTORS',
      heading: 'DIRECTORS BOARD',
      description: 'Directors provide oversight and guidance for specific programs and initiatives within the Ceekul ecosystem.'
    },
    managers: {
      id: 'managers',
      title: 'MANAGERS',
      heading: 'PROGRAM MANAGERS',
      description: 'Managers ensure day-to-day operations run smoothly and objectives are met efficiently.'
    }
  };

  activeTab = signal<'titles' | 'content' | 'chat'>('content');

  selectedContent = computed(() => this.contentData[this.selectedId()]);

  selectTitle(id: string): void {
    this.selectedId.set(id);
    this.activeTab.set('content');
  }

  setActiveTab(tab: 'titles' | 'content' | 'chat'): void {
    this.activeTab.set(tab);
  }
}
