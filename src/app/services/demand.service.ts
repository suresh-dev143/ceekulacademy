import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export type DemandDecision = 'approved' | 'suggest_alternative' | 'restricted';
export type AlternativeType = 'better' | 'safer' | 'growth';

export interface DemandAlternative {
  title: string;
  type: AlternativeType;
  description: string;
}

export interface DemandResult {
  decision: DemandDecision;
  message: string;
  alternatives: DemandAlternative[];
  confidence_score: number;
}

const HARMFUL_PATTERNS = [
  /\b(drugs?|narcotics?|illegal|cheat|hack|steal|fraud|scam|kill|harm|suicide|self.harm)\b/i
];

const GROWTH_PATTERNS = [
  /\b(learn|study|skill|course|health|fitness|exercise|grow|improve|build|create|read|meditate|practice|develop)\b/i
];

@Injectable({ providedIn: 'root' })
export class DemandService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/demand`;

  evaluate(input: string, context: string): Observable<DemandResult> {
    return this.http
      .post<DemandResult>(`${this.base}/evaluate`, { user_input: input, context })
      .pipe(catchError(() => of(this.frontendEvaluate(input, context)).pipe(delay(200))));
  }

  private frontendEvaluate(input: string, context: string): DemandResult {
    const text = `${input} ${context}`.toLowerCase();

    if (HARMFUL_PATTERNS.some(p => p.test(text))) {
      return {
        decision: 'restricted',
        message: `This request may not support your well-being or long-term growth right now.\n\nHere are constructive directions that could serve you better:`,
        alternatives: [
          { type: 'safer',  title: 'Mindful Reflection',       description: 'Take 10 minutes to journal what is driving this desire and what outcome you truly want.' },
          { type: 'better', title: 'Speak to a Mentor',        description: 'Connecting with someone who has navigated similar feelings can reframe the situation.' },
          { type: 'growth', title: 'Channel into a Skill',     description: 'Identify the energy behind this desire and redirect it into something that builds you.' }
        ],
        confidence_score: 0.91
      };
    }

    if (GROWTH_PATTERNS.some(p => p.test(text))) {
      return {
        decision: 'approved',
        message: `Great choice. This aligns well with your current goals and the direction you are building toward. Move on it.`,
        alternatives: [],
        confidence_score: 0.88
      };
    }

    return {
      decision: 'suggest_alternative',
      message: `This is a reasonable direction. Based on your current path, you may benefit even more from these aligned options:`,
      alternatives: [
        { type: 'better', title: 'Skill-Backed Version',       description: 'Pursue this through a structured approach that builds a lasting capability alongside the outcome.' },
        { type: 'safer',  title: 'Start Smaller',              description: 'Begin with a lighter version of this demand to test alignment before committing fully.' },
        { type: 'growth', title: 'Community-Linked Option',    description: 'Explore if this desire can be met while contributing to or learning from others around you.' }
      ],
      confidence_score: 0.76
    };
  }
}
