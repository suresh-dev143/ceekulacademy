import { Component, signal, computed } from '@angular/core';
import { DecimalPipe, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';

export type DistrictTab =
  'overview' | 'council' | 'director' | 'villages' |
  'lda' | 'infrastructure' | 'ai' | 'evolution';

export interface Advisor {
  id: number; name: string; lens: string; icon: string; color: string;
  focus: string[]; currentPlan: string;
}

export interface VillageNode {
  id: string; name: string; manager: string; population: number;
  ecoScore: number; healthIndex: number; evolutionStage: number;
  status: 'active' | 'monitoring' | 'alert'; alerts: number;
}

export interface CeekulInfraProject {
  id: number; icon: string; name: string; tagline: string;
  specs: string; desc: string; timeline: string;
  status: 'vision' | 'imminent' | 'active' | 'future';
  color: string;
}

export interface LdaIndicator {
  label: string; icon: string; value: number; max: number; unit: string;
  trend: string; trendUp: boolean;
  status: 'healing' | 'growing' | 'stable' | 'improving' | 'declining' | 'critical';
}

export interface AiRec {
  priority: 'critical' | 'high' | 'medium' | 'low';
  domain: string; domainColor: string; insight: string;
  action: string; villages: string[];
}

export interface EvolutionPhase {
  phase: number; label: string; year: string;
  status: 'completed' | 'active' | 'upcoming' | 'future';
  desc: string; milestones: string[];
}

@Component({
  selector: 'app-district',
  standalone: true,
  imports: [LayoutComponent, RouterLink, DecimalPipe, UpperCasePipe],
  templateUrl: './district.html',
  styleUrl: './district.scss',
})
export class DistrictComponent {

  readonly activeTab   = signal<DistrictTab>('overview');
  readonly expandedRec = signal<number | null>(null);

  readonly districtName  = 'TIRUVANNAMALAI';
  readonly districtState = 'Tamil Nadu';
  readonly districtId    = 'DST-TN-010';

  readonly tabs: { id: DistrictTab; label: string; icon: string }[] = [
    { id: 'overview',       label: 'Overview',        icon: '◎' },
    { id: 'council',        label: 'Council',          icon: '◈' },
    { id: 'director',       label: 'Director',         icon: '⬡' },
    { id: 'villages',       label: 'Village Network',  icon: '⬢' },
    { id: 'lda',            label: 'LDA Ecosystem',    icon: '✦' },
    { id: 'infrastructure', label: 'Infrastructure',   icon: '◆' },
    { id: 'ai',             label: 'AI Planner',       icon: '✺' },
    { id: 'evolution',      label: 'Evolution',        icon: '⬟' },
  ];

  readonly advisors: Advisor[] = [
    { id: 1,  name: 'Dr. Priya Sundaram',      lens: 'Ecology & Planetary Health',        icon: '◉', color: '#22c55e',
      focus: ['Forest Restoration', 'Watershed Systems', 'Biodiversity Corridors', 'Soil Regeneration'],
      currentPlan: 'Green Belt Ecological Design — 500 Km × 500 Km Concentric Zones for Ceekul & 10 Km × 10 Km for every RCC' },
    { id: 2,  name: 'Rajan Krishnamurthy',     lens: 'Human Life Sciences & Wellbeing',   icon: '◎', color: '#3b82f6',
      focus: ['Community Health Ecosystems', 'Preventive Medicine', 'Mental Wellbeing', 'Elder Care'],
      currentPlan: 'Health-Promoting Location Framework for RCC & Ceekul Siting — Safe Regions of Earth' },
    { id: 3,  name: 'Meera Sharma',            lens: 'Education & Cognitive Evolution',   icon: '◈', color: '#a78bfa',
      focus: ['LCC Learning Networks', 'Indigenous Knowledge', 'Adaptive Curriculum', 'Youth Leadership'],
      currentPlan: 'LCC Learning Network Blueprint — Every 10 Km on Earth, District Rollout by 2028' },
    { id: 4,  name: 'Dr. Suresh Pillai',       lens: 'Regenerative Economy & Commons',    icon: '⬡', color: '#f59e0b',
      focus: ['Cooperative Commerce', 'Resource Commons', 'Local Exchange', 'Ecological Livelihoods'],
      currentPlan: 'Cooperative Economic Architecture for LDA & the Ceekul Kutumb — Facilities as a Service Model' },
    { id: 5,  name: 'Ananya Iyer',             lens: 'Technology & Future Systems',       icon: '⬢', color: '#00d2ff',
      focus: ['4D Printed Construction', 'IoT Ecological Sensors', 'AI Planning Infrastructure', 'Regen Tech'],
      currentPlan: '4D Printed & Foldable Ceekul Technology Roadmap — RCC November 2026 Foundation Tech Stack' },
    { id: 6,  name: 'Gopalan Nair',            lens: 'Energy & Planetary Cycles',         icon: '✦', color: '#fb923c',
      focus: ['Solar Cooperative Grids', 'Biogas Systems', 'Floating City Energy', 'Circular Energy'],
      currentPlan: 'Zero-Fossil Energy Systems for RCC, LCC & Floating Cities — District to Planetary Scale by 2035' },
    { id: 7,  name: 'Kavya Reddy',             lens: 'Governance & Social Architecture',  icon: '◆', color: '#e879f9',
      focus: ['Participatory Democracy', 'Kutumb Self-Governance', 'LDA Community Charters', 'Policy Evolution'],
      currentPlan: 'Ceekul Kutumb Self-Governance Charter — 128 Villages Scaling to Planetary Civilisational Model' },
    { id: 8,  name: 'Thiru Maran',             lens: 'Cultural & Civilizational Memory',  icon: '✺', color: '#f43f5e',
      focus: ['Living Heritage', 'RCC Cultural Archives', 'LDA Sacred Sites', 'Civilisational Narrative'],
      currentPlan: 'Civilisational Archive Network for RCC — Cultural Memory Infrastructure from District to Planetary Scale' },
    { id: 9,  name: 'Divya Krishnan',          lens: 'Infrastructure & Spatial Intelligence', icon: '⬟', color: '#14b8a6',
      focus: ['RCC Spatial Design', 'LCC Construction Blueprint', 'Floating City Architecture', 'Habitat Intelligence'],
      currentPlan: 'RCC & LCC Spatial Design Framework — November 2026 Foundation at Musapur, Sareni, Raebareli' },
    { id: 10, name: 'Arjun Varma',             lens: 'Disaster Resilience & Regeneration', icon: '⬣', color: '#84cc16',
      focus: ['Early Warning Systems', 'Floating City Resilience', 'Space Habitat Safety', 'Climate Adaptation'],
      currentPlan: 'Disaster Resilience Architecture for Floating Cities & Future Space Habitat Systems 2026–2050' },
  ];

  readonly villages: VillageNode[] = [
    { id: 'CG100000100001', name: 'Vandavasi',     manager: 'Mani Kumar',    population: 12400, ecoScore: 67, healthIndex: 71, evolutionStage: 2, status: 'active',     alerts: 2 },
    { id: 'CG100000100002', name: 'Polur',          manager: 'Divya Anand',   population: 8900,  ecoScore: 58, healthIndex: 68, evolutionStage: 1, status: 'monitoring', alerts: 4 },
    { id: 'CG100000100003', name: 'Cheyyar',        manager: 'Raj Sekar',     population: 6200,  ecoScore: 72, healthIndex: 74, evolutionStage: 2, status: 'active',     alerts: 1 },
    { id: 'CG100000100004', name: 'Arani',          manager: 'Lalitha Devi',  population: 15600, ecoScore: 54, healthIndex: 62, evolutionStage: 1, status: 'alert',      alerts: 7 },
    { id: 'CG100000100005', name: 'Tiruvannamalai', manager: 'Karthik Rajan', population: 62000, ecoScore: 48, healthIndex: 65, evolutionStage: 1, status: 'alert',      alerts: 9 },
    { id: 'CG100000100006', name: 'Kilpennathur',   manager: 'Vimal Raj',     population: 4800,  ecoScore: 79, healthIndex: 81, evolutionStage: 3, status: 'active',     alerts: 0 },
    { id: 'CG100000100007', name: 'Thandrampet',    manager: 'Geetha Devi',   population: 3200,  ecoScore: 84, healthIndex: 78, evolutionStage: 3, status: 'active',     alerts: 0 },
    { id: 'CG100000100008', name: 'Chengam',        manager: 'Murugan K.',    population: 7100,  ecoScore: 61, healthIndex: 69, evolutionStage: 2, status: 'monitoring', alerts: 3 },
  ];

  readonly ldaIndicators: LdaIndicator[] = [
    { label: 'Forest Cover',       icon: '🌿', value: 34, max: 100, unit: '%',      trend: '+1.2', trendUp: true,  status: 'healing'   },
    { label: 'Water Bodies',       icon: '💧', value: 78, max: 100, unit: 'active', trend: '+3',   trendUp: true,  status: 'stable'    },
    { label: 'Biodiversity Index', icon: '🦋', value: 61, max: 100, unit: '/100',   trend: '+2.4', trendUp: true,  status: 'growing'   },
    { label: 'Soil Health',        icon: '🌱', value: 53, max: 100, unit: '/100',   trend: '-0.8', trendUp: false, status: 'declining' },
    { label: 'Air Quality',        icon: '🌬', value: 72, max: 100, unit: 'AQI',    trend: '+4.1', trendUp: true,  status: 'improving' },
    { label: 'Renewable Energy',   icon: '☀',  value: 28, max: 100, unit: '%',      trend: '+6.3', trendUp: true,  status: 'growing'   },
    { label: 'Crop Diversity',     icon: '🌾', value: 41, max: 80,  unit: 'spp',    trend: '-2',   trendUp: false, status: 'declining' },
    { label: 'Community Health',   icon: '❤',  value: 67, max: 100, unit: '/100',   trend: '+1.8', trendUp: true,  status: 'improving' },
    { label: 'River Health',       icon: '🏞',  value: 44, max: 100, unit: '/100',   trend: '-3.1', trendUp: false, status: 'critical'  },
    { label: 'Groundwater',        icon: '🌊', value: 56, max: 100, unit: '/100',   trend: '-1.4', trendUp: false, status: 'declining' },
    { label: 'Pollution Index',    icon: '⚠',  value: 38, max: 100, unit: '/100',   trend: '-2.8', trendUp: true,  status: 'healing'   },
    { label: 'Social Cohesion',    icon: '🤝', value: 62, max: 100, unit: '/100',   trend: '+0.4', trendUp: true,  status: 'stable'    },
  ];

  readonly aiRecs: AiRec[] = [
    { priority: 'critical', domain: 'Water Systems',     domainColor: '#3b82f6',
      insight: 'Three river tributaries show >40% reduction in annual flow over 5 years. Watershed degradation accelerating. Monsoon dependency rising critically.',
      action: 'Initiate Emergency Watershed Restoration Protocol',
      villages: ['Tiruvannamalai', 'Arani', 'Cheyyar'] },
    { priority: 'critical', domain: 'Soil Regeneration', domainColor: '#f59e0b',
      insight: 'Chemical fertiliser accumulation detected in 62% of surveyed agricultural zones. Soil microbiome collapse projected within 3–5 years.',
      action: 'Launch Soil Microbiome Restoration Initiative',
      villages: ['Polur', 'Arani', 'Vandavasi'] },
    { priority: 'high',     domain: 'Community Health',  domainColor: '#22c55e',
      insight: 'Vector-borne disease incidence rising 12% YoY in southern zones. Preventive infrastructure critically insufficient across 6 villages.',
      action: 'Activate Community Health Network Deployment',
      villages: ['Tiruvannamalai', 'Polur', 'Chengam'] },
    { priority: 'high',     domain: 'Renewable Energy',  domainColor: '#fb923c',
      insight: 'Eastern farmlands hold 74% solar utilisation potential. Cooperative solar model achieves energy sovereignty within 4 years.',
      action: 'Design Village Solar Cooperative Architecture',
      villages: ['Kilpennathur', 'Thandrampet', 'Cheyyar'] },
    { priority: 'high',     domain: 'Biodiversity',      domainColor: '#a78bfa',
      insight: 'Migratory bird corridor disruption detected across 3 eco-zones. 18 endemic species at risk. Vegetation corridor urgent.',
      action: 'Commission Biodiversity Corridor Design',
      villages: ['Kilpennathur', 'Thandrampet'] },
    { priority: 'medium',   domain: 'Education Access',  domainColor: '#00d2ff',
      insight: '18 villages lack functional learning spaces. LCC satellite model can serve 12 within 6 months at minimal infrastructure cost.',
      action: 'Deploy LCC Satellite Learning Network',
      villages: ['18 villages (distributed)'] },
  ];

  readonly evolutionPhases: EvolutionPhase[] = [
    { phase: 1, label: 'Awakening', year: '2025–2027', status: 'active',
      desc: 'Council formation, village manager network, ecological baseline surveys, and the laying of the first RCC foundation.',
      milestones: [
        '10 Advisors elected and active',
        '1st RCC foundation laid at Musapur, Sareni, Raebareli — November 2026',
        'Village manager network operational across district',
        'LCC construction initiated — every 10 Km rollout begins',
        'Tourist Spots & LDA development commenced',
      ] },
    { phase: 2, label: 'Healing', year: '2027–2030', status: 'upcoming',
      desc: 'RCC network expands globally. LCC at every 10 Km grows. LDA ecological restoration at scale. Floating Homes pilot projects begin.',
      milestones: [
        'RCC network operational — every 500 Km worldwide',
        'LCC at every 10 Km in 40+ districts globally',
        'Floating Homes pilot projects underway',
        'LDA ecological healing active across 100+ regions',
        'Ceekul site selection study begins',
      ] },
    { phase: 3, label: 'Regeneration', year: '2030–2035', status: 'future',
      desc: 'Global RCC & LCC network complete. Floating Cities construction begins. Ceekul design finalised. LDA healing on every continent.',
      milestones: [
        'Global RCC & LCC network complete',
        'Floating Cities construction begins before 2035',
        'Ceekul 200 Km × 200 Km site finalised & design complete',
        'LDA restoration active on every inhabited continent',
        'Space Habitat design programme initiated',
      ] },
    { phase: 4, label: 'Flourishing', year: '2035–2050', status: 'future',
      desc: 'Ceekul construction underway. Floating Cities operational. Space Habitat built. Humanity converging as a planetary Kutumb.',
      milestones: [
        'Ceekul construction underway (2035 start)',
        'Floating Cities operational on 3+ continents',
        'Space Habitat construction: 2040–2050',
        'Ceekul completed by 2050 — humanity living as Kutumb',
        'Every ultratech & personalised facility available as a Service',
      ] },
    { phase: 5, label: 'Planetary Alignment', year: '2050+', status: 'future',
      desc: 'Ceekul, RCC, LCC, Floating Cities and Space Habitats form a unified planetary and multi-planetary civilisational OS.',
      milestones: [
        'Ceekul fully operational — global Kutumb realised',
        'Space Habitat for tourism & healthy living worldwide',
        'Multi-planetary Ceekul civilisational network',
        'Tourist Spots on Earth and other planets active',
        'Human flourishing at planetary and inter-planetary scale',
      ] },
  ];

  readonly uploadStreams = [
    'Local Environmental Observations', 'Geographic Conditions', 'Health Indicators',
    'Pollution Levels', 'Agricultural Data', 'Biodiversity Updates',
    'Disaster Alerts', 'Community Requirements',
  ];

  readonly ldaIncludes = [
    'All 128 Villages & Towns', 'Rivers, Lakes & Wetlands', 'Forests & Biodiversity Zones',
    'Agricultural Farmlands', 'Existing Roads & Transport', 'Industries & Commerce',
    'Schools & Institutions', 'Sacred & Cultural Sites',
  ];

  readonly infraProjects: CeekulInfraProject[] = [
    {
      id: 1, icon: '🏙', name: 'Ceekul', tagline: 'G+50 · 4D Printed & Foldable',
      specs: '200 Km × 200 Km land surrounded by 500 Km × 500 Km concentric green belt',
      desc: 'A place where all people on earth will live as a Kutumb and enjoy every ultratech and personalised facility as a Service. Safe and health-promoting region of earth.',
      timeline: 'Construction start before 2035 · Complete by 2050',
      status: 'vision', color: '#00d2ff',
    },
    {
      id: 2, icon: '⬡', name: 'Regional Ceekul Center (RCC)', tagline: 'G+10 · Every 500 Km on Earth',
      specs: '1 Km × 1 Km land surrounded by 10 Km × 10 Km concentric green belt',
      desc: 'Ultra futuristic research centre to reinvent everything along emerging ideals and shape better and better civilizations. Each RCC locally supervised by Trustees with online guidance from Ceekul Academy.',
      timeline: '1st RCC foundation: November 2026 at Musapur, Sareni, Raebareli (in honour of Shree Hanumant Prasad Srivastava & Smt Sarswati Devi Srivastava) · RCC at every 500 Km worldwide within 1–2 years',
      status: 'imminent', color: '#f59e0b',
    },
    {
      id: 3, icon: '◎', name: 'Local Ceekul Center (LCC)', tagline: 'G+10 · Every 10 Km on Earth',
      specs: '100 m × 100 m land surrounded by 1 Km × 1 Km concentric green belt',
      desc: 'Village and neighbourhood-scale intelligence, learning, and community coordination hubs. Locally supervised by Trustees with online guidance from Ceekul Academy.',
      timeline: 'Construction at every 10 Km distance on earth within 1–2 years',
      status: 'active', color: '#22c55e',
    },
    {
      id: 4, icon: '✦', name: 'Tourist Spots', tagline: 'Earth & Other Planets',
      specs: 'Appropriate locations on earth and other planets',
      desc: 'Civilisational cultural and ecological tourism nodes — locally supervised by Trustees with online guidance from Ceekul Academy.',
      timeline: 'Construction within 1–2 years',
      status: 'active', color: '#a78bfa',
    },
    {
      id: 5, icon: '🌿', name: 'Local Development Area (LDA)', tagline: 'Earth & Other Planets',
      specs: 'Appropriate locations on earth and other planets',
      desc: 'Healing, regenerating and harmonising existing geographies. Existing villages, forests, rivers and roads already ARE the LDA — Ceekul heals and upgrades them, not replaces them.',
      timeline: 'Construction within 1–2 years',
      status: 'active', color: '#84cc16',
    },
    {
      id: 6, icon: '🌊', name: 'Floating Homes & Cities', tagline: 'Earth — Water-Based Living',
      specs: 'Appropriate locations on earth',
      desc: 'Regenerative water-based living communities — homes and entire cities floating in harmony with aquatic ecosystems. Locally supervised by Trustees with online guidance from Ceekul Academy.',
      timeline: 'Construction start before 2035',
      status: 'future', color: '#3b82f6',
    },
    {
      id: 7, icon: '🚀', name: 'Space Habitat', tagline: 'Tourism & Healthy Living',
      specs: 'Orbital and planetary habitats',
      desc: 'Space habitats for human tourism and healthy civilisational living — extending the Ceekul regenerative mission beyond Earth. Supervised by Trustees with online guidance from Ceekul Academy.',
      timeline: '2040–2050',
      status: 'vision', color: '#e879f9',
    },
  ];

  readonly evoDrivers = [
    { icon: '◈', label: 'Council Intelligence',   desc: '10 Advisors continuously updating long-term plans',                    color: '#a78bfa' },
    { icon: '⬡', label: 'Village Data Streams',   desc: 'Continuous ecological and health data from 128 village managers',     color: '#22c55e' },
    { icon: '✺', label: 'AI Pattern Recognition', desc: 'Machine intelligence surfacing hidden ecological and social trends',   color: '#00d2ff' },
    { icon: '⬢', label: 'Community Participation',desc: 'Collective wisdom of district citizens guiding civilisational decisions', color: '#f59e0b' },
    { icon: '◆', label: 'Global Learning',        desc: 'Integration of planetary regenerative knowledge and practice',        color: '#fb923c' },
    { icon: '⬟', label: 'Civilisational Memory',  desc: 'Traditional ecological knowledge embedded in future planning',        color: '#e879f9' },
  ];

  // ── Computed district summary ──────────────────────────────────────────────

  readonly avgEcoScore    = computed(() =>
    Math.round(this.villages.reduce((s, v) => s + v.ecoScore, 0) / this.villages.length));
  readonly avgHealthScore = computed(() =>
    Math.round(this.villages.reduce((s, v) => s + v.healthIndex, 0) / this.villages.length));
  readonly totalAlerts    = computed(() =>
    this.villages.reduce((s, v) => s + v.alerts, 0));
  readonly criticalRecs   = computed(() =>
    this.aiRecs.filter(r => r.priority === 'critical').length);

  // ── Methods ────────────────────────────────────────────────────────────────

  selectTab(id: DistrictTab): void { this.activeTab.set(id); }

  toggleRec(i: number): void {
    this.expandedRec.update(c => c === i ? null : i);
  }

  ecoColor(score: number): string {
    if (score >= 75) return '#22c55e';
    if (score >= 55) return '#f59e0b';
    if (score >= 40) return '#fb923c';
    return '#ef4444';
  }

  statusColor(s: LdaIndicator['status']): string {
    return ({ healing: '#22c55e', growing: '#00d2ff', stable: '#94a3b8',
              improving: '#a78bfa', declining: '#fb923c', critical: '#ef4444' } as Record<string,string>)[s] ?? '#94a3b8';
  }

  priorityColor(p: string): string {
    return ({ critical: '#ef4444', high: '#fb923c', medium: '#f59e0b', low: '#22c55e' } as Record<string,string>)[p] ?? '#94a3b8';
  }

  phaseColor(s: string): string {
    return ({ completed: '#22c55e', active: '#00d2ff', upcoming: '#a78bfa', future: '#334155' } as Record<string,string>)[s] ?? '#334155';
  }

  stageLabel(n: number): string {
    return (['', 'Awakening', 'Healing', 'Regenerating', 'Flourishing'] as string[])[n] ?? '—';
  }

  advisorAngle(i: number): string { return `${i * 36}deg`; }

  infraStatusColor(s: CeekulInfraProject['status']): string {
    return ({ vision: '#00d2ff', imminent: '#f59e0b', active: '#22c55e', future: '#3b82f6' } as Record<string,string>)[s] ?? '#475569';
  }

  infraStatusLabel(s: CeekulInfraProject['status']): string {
    return ({ vision: 'VISION 2050', imminent: 'NOV 2026', active: 'WITHIN 1–2 YRS', future: 'PRE-2035' } as Record<string,string>)[s] ?? s.toUpperCase();
  }
}
