import { Injectable, signal, computed, effect } from '@angular/core';

export interface MiddleBox {
  activity: string;
  guidance: string;
}

export interface LeftBox {
  insight: string;
  data: Record<string, string>;
}

export interface RightBox {
  tools: string[];
  devices: string[];
}

export interface HourBlock {
  hour: number;
  hour_block: string;
  intent: string;
  phase: 'sleep' | 'morning' | 'work' | 'afternoon' | 'evening' | 'wind-down';
  middle_box: MiddleBox;
  left_box: LeftBox;
  right_box: RightBox;
  user_override: boolean;
  custom_activity: string;
  confidence_score: number;
}

const BASE_SCHEDULE: Omit<HourBlock, 'user_override' | 'custom_activity'>[] = [
  {
    hour: 5,
    hour_block: "5:00-6:00",
    intent: "Wake + detox",
    phase: "morning",
    middle_box: {
      activity: "Morning Detox & Wakeup",
      guidance: "1. Drink 500ml warm water.\n2. Allow natural bowel movement.\n3. Open curtains for direct sunlight.\n4. No screens for the first 20 minutes."
    },
    left_box: {
      insight: "Early light exposure anchors your circadian rhythm and boosts morning cortisol for natural alertness.",
      data: {
        "Cortisol Trend": "Rising",
        "Hydration Status": "Low"
      }
    },
    right_box: {
      tools: ["Hydration Tracker", "Sunlight Timer"],
      devices: ["Smart Blinds (Open)", "Lights (80% warm)"]
    },
    confidence_score: 0.95
  },
  {
    hour: 6,
    hour_block: "6:00-7:00",
    intent: "Movement + breath",
    phase: "morning",
    middle_box: {
      activity: "Light Movement & Breathwork",
      guidance: "1. 10 mins of light stretching.\n2. 5 mins of box breathing (4-4-4-4).\n3. 10 mins outdoor walking/jogging."
    },
    left_box: {
      insight: "Fasted zone-2 cardio enhances fat metabolism and improves sleep latency tonight.",
      data: {
        "Heart Rate Target": "110-130 bpm",
        "Oxygen Saturation": "Normal"
      }
    },
    right_box: {
      tools: ["Breathwork Guide", "Stretch Timer"],
      devices: ["Outdoor Air Quality Monitor"]
    },
    confidence_score: 0.92
  },
  {
    hour: 7,
    hour_block: "7:00-8:00",
    intent: "Body + skin care",
    phase: "morning",
    middle_box: {
      activity: "Hygiene & Preparation",
      guidance: "1. Take a cold-to-warm shower (end with cold).\n2. Complete skin care routine.\n3. Dress for the day."
    },
    left_box: {
      insight: "Finishing your shower with 30-60 seconds of cold water spikes norepinephrine, increasing focus.",
      data: {
        "Norepinephrine Level": "Spiking",
        "Core Temp": "Regulating"
      }
    },
    right_box: {
      tools: ["Skin Care Routine Log"],
      devices: ["Shower Thermostat (Cold preset)", "Bathroom Mirror Light (Daylight)"]
    },
    confidence_score: 0.94
  },
  {
    hour: 8,
    hour_block: "8:00-9:00",
    intent: "Self-growth",
    phase: "morning",
    middle_box: {
      activity: "Learning & Reading",
      guidance: "1. Read 20 pages of a non-fiction book or listen to an educational podcast.\n2. Write down 3 key intentions for the day."
    },
    left_box: {
      insight: "Hippocampal neuroplasticity is at its peak; this is the optimal window for declarative memory retention.",
      data: {
        "Retention Probability": "High",
        "Cognitive Load": "Low"
      }
    },
    right_box: {
      tools: ["Reading App", "Journal App"],
      devices: ["Desk Lamp (Focus mode)"]
    },
    confidence_score: 0.96
  },
  {
    hour: 9,
    hour_block: "9:00-10:00",
    intent: "Meal + relaxation",
    phase: "morning",
    middle_box: {
      activity: "Breakfast & Mindful Eating",
      guidance: "1. Consume a high-protein breakfast (30g+).\n2. Include healthy fats.\n3. Eat slowly without screens."
    },
    left_box: {
      insight: "A protein-rich morning meal stabilizes insulin and prevents mid-day energy crashes.",
      data: {
        "Protein Target": "30g+",
        "Blood Glucose": "Stable"
      }
    },
    right_box: {
      tools: ["Nutrition Tracker", "Mindful Eating Timer"],
      devices: ["Kitchen Lights (Warm)"]
    },
    confidence_score: 0.90
  },
  {
    hour: 10,
    hour_block: "10:00-11:00",
    intent: "Deep work",
    phase: "work",
    middle_box: {
      activity: "Peak Focus Execution",
      guidance: "1. Tackle your #1 most important task.\n2. Turn phone to silent.\n3. Use 52/17 Pomodoro technique."
    },
    left_box: {
      insight: "Your prefrontal cortex is operating at maximum efficiency. Avoid task switching.",
      data: {
        "Focus Score": "Peak",
        "Distraction Risk": "Low"
      }
    },
    right_box: {
      tools: ["Focus Timer", "Task Board"],
      devices: ["DND Mode (Active)", "Workstation Lights (Cool White)"]
    },
    confidence_score: 0.98
  },
  {
    hour: 11,
    hour_block: "11:00-12:00",
    intent: "Deep work",
    phase: "work",
    middle_box: {
      activity: "Sustained Execution",
      guidance: "1. Continue complex problem-solving.\n2. Avoid checking email until core work is complete."
    },
    left_box: {
      insight: "Decision fatigue is beginning to accumulate; continue leveraging momentum before it sets in.",
      data: {
        "Mental Fatigue": "Rising slightly",
        "Flow State": "Active"
      }
    },
    right_box: {
      tools: ["Code/Design Editor", "Research Tools"],
      devices: ["Noise Cancellation (ON)"]
    },
    confidence_score: 0.95
  },
  {
    hour: 12,
    hour_block: "12:00-13:00",
    intent: "Deep work",
    phase: "work",
    middle_box: {
      activity: "Final Morning Work Sprint",
      guidance: "1. Wrap up the morning's deep work tasks.\n2. Prepare notes for afternoon meetings."
    },
    left_box: {
      insight: "Your initial cognitive peak is ending. Switch to wrapping up logic-heavy tasks.",
      data: {
        "Focus Score": "Declining"
      }
    },
    right_box: {
      tools: ["Note-taking App"],
      devices: []
    },
    confidence_score: 0.88
  },
  {
    hour: 13,
    hour_block: "13:00-14:00",
    intent: "Social + recovery",
    phase: "afternoon",
    middle_box: {
      activity: "Lunch & Disconnect",
      guidance: "1. Step away from your desk.\n2. Eat a balanced meal (protein, complex carbs, greens).\n3. Engage in light social interaction."
    },
    left_box: {
      insight: "Midday social connection buffers afternoon cortisol and prevents burnout.",
      data: {
        "Energy Level": "Post-meal dip expected"
      }
    },
    right_box: {
      tools: ["Social/Chat Apps"],
      devices: ["Increase Ambient Light"]
    },
    confidence_score: 0.91
  },
  {
    hour: 14,
    hour_block: "14:00-15:00",
    intent: "Work block",
    phase: "work",
    middle_box: {
      activity: "Meetings & Collaboration",
      guidance: "1. Excellent time for collaborative work and meetings.\n2. Motor skills and reaction times are at their peak."
    },
    left_box: {
      insight: "Afternoon peaks in coordination make this the best time for design, presenting, and physical tasks.",
      data: {
        "Coordination": "Peak",
        "Collaborative Readiness": "High"
      }
    },
    right_box: {
      tools: ["Video Conferencing", "Whiteboard App"],
      devices: []
    },
    confidence_score: 0.89
  },
  {
    hour: 15,
    hour_block: "15:00-16:00",
    intent: "Work block",
    phase: "work",
    middle_box: {
      activity: "Execution & Reviews",
      guidance: "1. Conduct code or document reviews.\n2. Engage in creative tasks or writing.\n3. Reply to emails."
    },
    left_box: {
      insight: "Accuracy and attention to detail remain high, making it ideal for QA and review processes.",
      data: {
        "Accuracy Index": "High"
      }
    },
    right_box: {
      tools: ["Email Client", "Review Tools"],
      devices: []
    },
    confidence_score: 0.87
  },
  {
    hour: 16,
    hour_block: "16:00-17:00",
    intent: "Work block",
    phase: "work",
    middle_box: {
      activity: "Wrap-up & Planning",
      guidance: "1. Review today's completed tasks.\n2. Plan tomorrow's top 3 priorities.\n3. Clear inbox and shut down work mode."
    },
    left_box: {
      insight: "Planning tomorrow's tasks today reduces next-day startup friction by up to 40%.",
      data: {
        "Closure Status": "Pending"
      }
    },
    right_box: {
      tools: ["Task Planner", "Calendar"],
      devices: ["Lights (Transition to Warm)"]
    },
    confidence_score: 0.93
  },
  {
    hour: 17,
    hour_block: "17:00-18:00",
    intent: "Dinner + social",
    phase: "evening",
    middle_box: {
      activity: "Dinner & Connection",
      guidance: "1. Eat dinner early for metabolic health.\n2. Keep meal lighter than lunch.\n3. Screen-free conversation."
    },
    left_box: {
      insight: "Eating before 6 PM aligns with your circadian clock, improving digestion and sleep quality.",
      data: {
        "Digestion Phase": "Active",
        "Metabolic Rate": "Slowing"
      }
    },
    right_box: {
      tools: ["Recipe App"],
      devices: ["Dining Lights (Warm/Dim)"]
    },
    confidence_score: 0.90
  },
  {
    hour: 18,
    hour_block: "18:00-19:00",
    intent: "Family / development",
    phase: "evening",
    middle_box: {
      activity: "Personal Growth & Family",
      guidance: "1. Spend quality time with family or housemates.\n2. Take an evening walk.\n3. Engage in a creative hobby."
    },
    left_box: {
      insight: "Evening social bonding increases oxytocin and lowers stress hormones, aiding sleep onset.",
      data: {
        "Cortisol Trend": "Declining",
        "Oxytocin": "Rising"
      }
    },
    right_box: {
      tools: ["Music Player"],
      devices: ["Ambient Lighting"]
    },
    confidence_score: 0.85
  },
  {
    hour: 19,
    hour_block: "19:00-20:00",
    intent: "Family / development",
    phase: "evening",
    middle_box: {
      activity: "Deep Learning",
      guidance: "1. Learn a new skill or read.\n2. Reflect on the day in your journal.\n3. No heavy exercise."
    },
    left_box: {
      insight: "Your brain enters a relaxed focus state, highly receptive to language learning and creativity.",
      data: {
        "Mental State": "Relaxed Focus"
      }
    },
    right_box: {
      tools: ["Learning App", "Journal"],
      devices: ["Dim Lights Further"]
    },
    confidence_score: 0.88
  },
  {
    hour: 20,
    hour_block: "20:00-21:00",
    intent: "Family / development",
    phase: "evening",
    middle_box: {
      activity: "Wind-Down Transition",
      guidance: "1. Reduce screen brightness; turn on blue-light filters.\n2. Avoid stimulating news or content.\n3. Prepare items for tomorrow."
    },
    left_box: {
      insight: "Melatonin secretion begins soon. Blue light exposure now will delay it by 2-3 hours.",
      data: {
        "Melatonin Readiness": "Building",
        "Blue Light Exposure": "Minimize"
      }
    },
    right_box: {
      tools: ["Blue Light Filter"],
      devices: ["Lights (30% Amber)", "Thermostat (-1°C)"]
    },
    confidence_score: 0.92
  },
  {
    hour: 21,
    hour_block: "21:00-22:00",
    intent: "Relaxation",
    phase: "wind-down",
    middle_box: {
      activity: "Deep Relaxation",
      guidance: "1. Take a warm shower or bath.\n2. 10 mins of meditation or deep breathing.\n3. Read a physical book."
    },
    left_box: {
      insight: "A warm bath before bed rapidly drops your core body temperature, triggering deep sleep onset.",
      data: {
        "Core Temp": "Dropping",
        "Sleep Latency Est": "15 mins"
      }
    },
    right_box: {
      tools: ["Meditation App"],
      devices: ["Lights (10% Amber)", "Thermostat (18°C)"]
    },
    confidence_score: 0.96
  },
  {
    hour: 22,
    hour_block: "22:00-23:00",
    intent: "Sleep + regeneration",
    phase: "sleep",
    middle_box: {
      activity: "Sleep",
      guidance: "Lights OFF\nPhone in another room\nDeep breathing to fall asleep faster"
    },
    left_box: {
      insight: "Silent monitoring active.",
      data: {
        "System Status": "Autonomous Regeneration Mode"
      }
    },
    right_box: {
      tools: [],
      devices: ["All Lights (OFF)", "Smart Blinds (Closed)", "DND (ON)"]
    },
    confidence_score: 0.99
  },
  {
    hour: 23,
    hour_block: "23:00-0:00",
    intent: "Sleep + regeneration",
    phase: "sleep",
    middle_box: {
      activity: "Sleep",
      guidance: "Remain in deep sleep\nAutonomous regeneration mode active"
    },
    left_box: {
      insight: "Silent monitoring active.",
      data: {
        "Heart Rate Variability": "Tracking"
      }
    },
    right_box: {
      tools: [],
      devices: ["Maintain Environment"]
    },
    confidence_score: 0.99
  },
  {
    hour: 0,
    hour_block: "0:00-1:00",
    intent: "Sleep + regeneration",
    phase: "sleep",
    middle_box: {
      activity: "Sleep",
      guidance: "Maintain a cool room (18–20°C)\nDeep sleep cycle"
    },
    left_box: {
      insight: "Deep sleep phase (NREM 3).",
      data: {
        "Tissue Repair": "Active"
      }
    },
    right_box: {
      tools: [],
      devices: ["Set AC to 18°C"]
    },
    confidence_score: 0.98
  },
  {
    hour: 1,
    hour_block: "1:00-2:00",
    intent: "Sleep + regeneration",
    phase: "sleep",
    middle_box: {
      activity: "Sleep",
      guidance: "Maintain silence"
    },
    left_box: {
      insight: "Liver detox peaks between 1-3 AM.",
      data: {
        "Detox Phase": "Peak"
      }
    },
    right_box: {
      tools: [],
      devices: ["Maintain blackout conditions"]
    },
    confidence_score: 0.98
  },
  {
    hour: 2,
    hour_block: "2:00-3:00",
    intent: "Sleep + regeneration",
    phase: "sleep",
    middle_box: {
      activity: "Sleep",
      guidance: "Core sleep window"
    },
    left_box: {
      insight: "Growth hormone peaks around 2 AM.",
      data: {
        "Growth Hormone": "Peak"
      }
    },
    right_box: {
      tools: [],
      devices: ["DND mode active"]
    },
    confidence_score: 0.97
  },
  {
    hour: 3,
    hour_block: "3:00-4:00",
    intent: "Sleep + regeneration",
    phase: "sleep",
    middle_box: {
      activity: "Sleep",
      guidance: "Remain in sleep"
    },
    left_box: {
      insight: "REM sleep cycles lengthen.",
      data: {
        "Rem Sleep": "Active"
      }
    },
    right_box: {
      tools: [],
      devices: ["Maintain environment"]
    },
    confidence_score: 0.96
  },
  {
    hour: 4,
    hour_block: "4:00-5:00",
    intent: "Sleep + regeneration",
    phase: "sleep",
    middle_box: {
      activity: "Light Sleep / Pre-wake",
      guidance: "Body temperature begins rising"
    },
    left_box: {
      insight: "Cortisol awakening response begins. Body temp rises.",
      data: {
        "Cortisol Trend": "Slowly rising",
        "Core Temp": "Rising"
      }
    },
    right_box: {
      tools: [],
      devices: ["Slowly Increase Temp", "Prepare Blinds"]
    },
    confidence_score: 0.95
  }
];

@Injectable({ providedIn: 'root' })
export class LifeOrchestratorService {
  private readonly STORAGE_KEY = 'life_orchestrator_overrides';

  private readonly _schedule   = signal<HourBlock[]>([]);
  private readonly _currentHour = signal(new Date().getHours());
  private readonly _selectedHour = signal<number | null>(null);

  readonly schedule     = this._schedule.asReadonly();
  readonly currentHour  = this._currentHour.asReadonly();
  readonly selectedHour = this._selectedHour.asReadonly();

  readonly currentBlock = computed(() => {
    const h = this._currentHour();
    return this._schedule().find(b => b.hour === h) ?? null;
  });

  readonly selectedBlock = computed(() => {
    const h = this._selectedHour();
    if (h === null) return this.currentBlock();
    return this._schedule().find(b => b.hour === h) ?? null;
  });

  readonly isSleepMode = computed(() => {
    const h = this._currentHour();
    return h >= 22 || h < 5;
  });

  constructor() {
    this._buildSchedule();
    this._startClock();
  }

  private _buildSchedule(): void {
    const overrides = this._loadOverrides();
    const schedule: HourBlock[] = BASE_SCHEDULE.map(base => {
      const ov = overrides[base.hour];
      return {
        ...base,
        user_override:   !!ov,
        custom_activity: ov ?? ''
      };
    });
    this._schedule.set(schedule);
  }

  private _startClock(): void {
    const tick = () => {
      this._currentHour.set(new Date().getHours());
    };
    const now     = new Date();
    const msToNext = (60 - now.getMinutes()) * 60_000 - now.getSeconds() * 1_000;
    setTimeout(() => {
      tick();
      setInterval(tick, 3_600_000);
    }, msToNext);
  }

  selectHour(hour: number): void {
    this._selectedHour.set(hour);
  }

  clearSelection(): void {
    this._selectedHour.set(null);
  }

  setOverride(hour: number, activity: string): void {
    const overrides = this._loadOverrides();
    if (activity.trim()) {
      overrides[hour] = activity.trim();
    } else {
      delete overrides[hour];
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(overrides));
    this._buildSchedule();
  }

  removeOverride(hour: number): void {
    const overrides = this._loadOverrides();
    delete overrides[hour];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(overrides));
    this._buildSchedule();
  }

  private _loadOverrides(): Record<number, string> {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) ?? '{}');
    } catch {
      return {};
    }
  }

  formatHour(hour: number): string {
    if (hour === 0)  return '12 AM';
    if (hour < 12)  return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  }

  phaseColor(phase: HourBlock['phase']): string {
    switch (phase) {
      case 'sleep':     return '#1e3a5f';
      case 'morning':   return '#3d2b0a';
      case 'work':      return '#1a2e1a';
      case 'afternoon': return '#2a1f3d';
      case 'evening':   return '#2d1a0a';
      case 'wind-down': return '#1e1a2e';
    }
  }

  phaseAccent(phase: HourBlock['phase']): string {
    switch (phase) {
      case 'sleep':     return '#4a90d9';
      case 'morning':   return '#f59e0b';
      case 'work':      return '#22c55e';
      case 'afternoon': return '#a78bfa';
      case 'evening':   return '#fb923c';
      case 'wind-down': return '#818cf8';
    }
  }
}
