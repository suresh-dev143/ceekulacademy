import { Component, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface LifeDimension {
  key: string; label: string; glyph: string;
  score: number; desc: string; actions: string[];
}

export interface Ritu {
  name: string; english: string; months: string; glyph: string; color: string; desc: string;
}

export interface CircadianPhase {
  name: string; hours: string; glyph: string; color: string; desc: string;
}

export interface Ashrama {
  id: number; name: string; sub: string; years: string; glyph: string;
  desc: string; practices: string[];
}

@Component({
  selector: 'app-human-life',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './human-life.html',
  styleUrl: './human-life.scss',
})
export class HumanLife implements OnInit {

  readonly activeSection = signal<'cycle' | 'digital' | 'cosmic'>('cycle');
  readonly selectedAshrama = signal<number | null>(null);
  readonly selectedDim = signal<string | null>(null);

  // ── Life Cycle ────────────────────────────────────────────────────────────

  readonly ashramas: Ashrama[] = [
    {
      id: 1, name: 'Brahmacharya', sub: 'The Student', years: '0 – 25', glyph: '◎',
      desc: 'The phase of learning, discipline, and preparation. The mind is a clean slate; everything absorbed becomes the foundation of a life.',
      practices: ['Study & skill mastery', 'Physical discipline', 'Mentorship & guidance', 'Character formation', 'Curiosity cultivation'],
    },
    {
      id: 2, name: 'Grihastha', sub: 'The Householder', years: '25 – 50', glyph: '⬡',
      desc: 'The phase of creation, family, livelihood, and contribution. The fullest engagement with life as it is — building, giving, sustaining.',
      practices: ['Family & relationships', 'Livelihood & creation', 'Community contribution', 'Ecological responsibility', 'Raising the next generation'],
    },
    {
      id: 3, name: 'Vanaprastha', sub: 'The Forest Dweller', years: '50 – 75', glyph: '◆',
      desc: 'Gradual withdrawal from worldly roles. The elder begins transferring responsibility, deepening wisdom, and turning inward.',
      practices: ['Mentoring the next generation', 'Wisdom distillation', 'Simplification of life', 'Spiritual deepening', 'Legacy building'],
    },
    {
      id: 4, name: 'Sanyasa', sub: 'The Renunciant', years: '75 +', glyph: '✦',
      desc: 'Full liberation from role-identity. Pure being. The civilisational elder who has seen everything and needs nothing — yet offers everything.',
      practices: ['Non-attachment', 'Universal compassion', 'Teaching by presence', 'Spiritual transmission', 'Graceful release'],
    },
  ];

  readonly currentAshramaId = signal(2);

  readonly dimensions: LifeDimension[] = [
    {
      key: 'physical', label: 'Physical', glyph: '◉', score: 72,
      desc: 'Your body is the instrument of all experience. Nourishment, movement, rest, and environment — all shape your physical intelligence.',
      actions: ['Daily movement — at least 30 min', 'Natural foods — unprocessed, seasonal', 'Sleep 7–9 hours in darkness', 'Morning light exposure'],
    },
    {
      key: 'mental', label: 'Mental', glyph: '◈', score: 68,
      desc: 'Clarity, focus, emotional regulation, and the capacity to learn. The mind is trained by what we feed it — silence and study equally.',
      actions: ['Deep reading — 30 min minimum', 'Single-task focus practice', 'Emotional processing time', 'Limit fragmented media'],
    },
    {
      key: 'social', label: 'Social', glyph: '⬢', score: 81,
      desc: 'Humans are village creatures. Belonging, reciprocity, and contribution in relationship form the circulatory system of civilisation.',
      actions: ['Real conversation — not chat', 'Contribute to community', 'Care for elders and young', 'Resolve conflicts with dignity'],
    },
    {
      key: 'spiritual', label: 'Spiritual', glyph: '⬟', score: 59,
      desc: 'The dimension that asks why — and listens. Ritual, awe, silence, nature, and meaning-making. The root that keeps the tree standing.',
      actions: ['Morning silence — 10 min', 'Gratitude reflection', 'Time in nature', 'Connect with something larger'],
    },
    {
      key: 'creative', label: 'Creative', glyph: '✺', score: 77,
      desc: 'The capacity to bring something new into the world — through art, problem-solving, teaching, or building. Creativity is civilisational metabolism.',
      actions: ['Create something daily', 'Share your perspective', 'Teach what you know', 'Play without outcome'],
    },
  ];

  readonly overallLifeScore = computed(() =>
    Math.round(this.dimensions.reduce((s, d) => s + d.score, 0) / this.dimensions.length));

  // ── Digital Life ──────────────────────────────────────────────────────────

  readonly digitalStats = [
    { label: 'Content Sessions',  value: 148, unit: 'sessions',  glyph: '▶', color: '#00d2ff' },
    { label: 'Courses Active',    value: 3,   unit: 'courses',   glyph: '◈', color: '#a78bfa' },
    { label: 'FUN Balance',       value: 2840, unit: 'FUN',      glyph: '⚡', color: '#22c55e' },
    { label: 'CUN Balance',       value: 540,  unit: 'CUN',      glyph: '⬡', color: '#f59e0b' },
    { label: 'SUN Balance',       value: 120,  unit: 'SUN',      glyph: '✦', color: '#fb923c' },
    { label: 'Contributions',     value: 23,  unit: 'logged',    glyph: '◆', color: '#e879f9' },
  ];

  readonly recentActivity = [
    { action: 'Watched lecture', detail: 'Soil Regeneration — Dr. Priya Sundaram', time: 'Today, 8:14 AM', glyph: '▶', color: '#00d2ff' },
    { action: 'Completed quiz', detail: 'Watershed Systems — Score 88%', time: 'Yesterday', glyph: '◈', color: '#22c55e' },
    { action: 'FUN Transfer',   detail: '200 FUN → RCC Foundation Initiative', time: 'May 20', glyph: '⚡', color: '#f59e0b' },
    { action: 'Issue posted',   detail: 'CG100000100001 — Water tanker schedule', time: 'May 18', glyph: '◉', color: '#fb923c' },
    { action: 'Plan upvoted',   detail: 'Solar Street Lights — Vandavasi', time: 'May 15', glyph: '▲', color: '#a78bfa' },
  ];

  readonly participationStreak = 14;

  // ── Cosmic Coherence ──────────────────────────────────────────────────────

  readonly ritus: Ritu[] = [
    { name: 'Vasanta',  english: 'Spring',       months: 'Mar–Apr', glyph: '🌸', color: '#fb923c', desc: 'Renewal, new growth, lightness, creative beginnings.' },
    { name: 'Grishma',  english: 'Summer',       months: 'May–Jun', glyph: '☀',  color: '#f59e0b', desc: 'Intensity, purification, outward energy, maximum light.' },
    { name: 'Varsha',   english: 'Monsoon',      months: 'Jul–Aug', glyph: '🌧', color: '#3b82f6', desc: 'Inward turning, nourishment, receptivity, earth drinking.' },
    { name: 'Sharada',  english: 'Autumn',       months: 'Sep–Oct', glyph: '🍂', color: '#22c55e', desc: 'Harvest, clarity, gratitude, the light returning to warmth.' },
    { name: 'Hemanta',  english: 'Early Winter', months: 'Nov–Dec', glyph: '🌬', color: '#94a3b8', desc: 'Grounding, conservation, preparation, deep nourishment.' },
    { name: 'Shishira', english: 'Late Winter',  months: 'Jan–Feb', glyph: '❄',  color: '#00d2ff', desc: 'Stillness, inner fire, renewal beneath the surface.' },
  ];

  readonly circadianPhases: CircadianPhase[] = [
    { name: 'Brahma Muhurta', hours: '4–6 AM',   glyph: '✦', color: '#a78bfa', desc: 'The most auspicious time. Clarity, meditation, and intention-setting.' },
    { name: 'Surya Kala',     hours: '6–10 AM',  glyph: '◉', color: '#f59e0b', desc: 'Rising solar energy. Ideal for learning, physical movement, creation.' },
    { name: 'Pitta Kala',     hours: '10 AM–2 PM', glyph: '☀', color: '#fb923c', desc: 'Peak metabolic fire. Best for digestion, focused work, decisions.' },
    { name: 'Vata Kala',      hours: '2–6 PM',   glyph: '◈', color: '#00d2ff', desc: 'Creative and communicative energy. Ideas, movement, social exchange.' },
    { name: 'Sandhya Kala',   hours: '6–10 PM',  glyph: '◆', color: '#e879f9', desc: 'Twilight integration. Wind down, reflect, family, light meals.' },
    { name: 'Nidra Kala',     hours: '10 PM–4 AM', glyph: '⬟', color: '#334155', desc: 'Restoration, consolidation, deep processing. The gift of sleep.' },
  ];

  readonly currentRituIdx  = signal(1); // Grishma (May)
  readonly currentPhaseIdx = signal(1); // computed in ngOnInit
  readonly paksha          = signal<'Shukla' | 'Krishna'>('Krishna');

  readonly alignmentScore = computed(() => {
    const ritu  = this.ritus[this.currentRituIdx()];
    const phase = this.circadianPhases[this.currentPhaseIdx()];
    // simple mock alignment derived from static values
    return 76;
  });

  ngOnInit() {
    const h = new Date().getHours();
    let idx = 5;
    if (h >= 4  && h < 6)  idx = 0;
    else if (h >= 6  && h < 10) idx = 1;
    else if (h >= 10 && h < 14) idx = 2;
    else if (h >= 14 && h < 18) idx = 3;
    else if (h >= 18 && h < 22) idx = 4;
    this.currentPhaseIdx.set(idx);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  dimColor(key: string): string {
    return ({ physical: '#fb923c', mental: '#3b82f6', social: '#22c55e', spiritual: '#a78bfa', creative: '#00d2ff' } as Record<string,string>)[key] ?? '#475569';
  }

  scoreColor(s: number): string {
    if (s >= 80) return '#22c55e';
    if (s >= 65) return '#f59e0b';
    if (s >= 50) return '#fb923c';
    return '#ef4444';
  }

  toggleAshrama(id: number) {
    this.selectedAshrama.update(c => c === id ? null : id);
  }

  toggleDim(key: string) {
    this.selectedDim.update(c => c === key ? null : key);
  }
}
