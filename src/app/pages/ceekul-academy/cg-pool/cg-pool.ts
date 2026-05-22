import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Welfare } from '../../../pages/personal/welfare/welfare';

interface PoolStream {
  id: string;
  code: string;
  label: string;
  title: string;
  share: string;
  purpose: string;
  descriptor: string;
  automation: string;
  accent: string;
}

interface AutoFlow {
  step: number;
  label: string;
  descriptor: string;
}

interface ConstitutionalPrinciple {
  code: string;
  title: string;
  body: string;
}

interface UpliftStage {
  step: number;
  phase: string;
  label: string;
  descriptor: string;
  tag?: string;
}

interface TrackingMetric {
  icon: string;
  domain: string;
  signals: string[];
}

interface SupportTier {
  label: string;
  duration: string;
  condition: string;
  accent: string;
}

interface LegacyPhase {
  step: number;
  phase: string;
  label: string;
  descriptor: string;
}

interface NeuronUsageRule {
  stream: string;
  code: string;
  title: string;
  accent: string;
  primary: string;
  conditions: string[];
  guardNote?: string;
}

@Component({
  selector: 'app-cg-pool',
  standalone: true,
  imports: [CommonModule, Welfare],
  templateUrl: './cg-pool.html',
  styleUrl: './cg-pool.scss',
})
export class CGPool {
  readonly expandedStream = signal<string | null>(null);

  toggleStream(id: string): void {
    this.expandedStream.update(v => v === id ? null : id);
  }

  readonly constitutionalPrinciples: ConstitutionalPrinciple[] = [
    {
      code: 'ART · I',
      title: 'No Human Can Transfer Neurons',
      body: 'No person — including founders, trustees, administrators, or any governance council member — holds the authority to initiate, approve, or override a neuron transfer. Every transfer in the CG system is exclusively triggered by a member\'s own application and executed by the matching algorithm. Human discretion has no role in disbursement.',
    },
    {
      code: 'ART · II',
      title: 'Goals Are Set Collectively, Not Individually',
      body: 'The criteria, conditions, and eligibility thresholds governing all CG neuron flows are established through structured discussion at all levels of governance — not by any individual or small group. No founder, trustee, or council may unilaterally define what the algorithm measures or rewards. All such parameters require multi-level deliberation and ratification.',
    },
    {
      code: 'ART · III',
      title: 'Members Apply for Themselves',
      body: 'Support is never assigned, awarded, or pushed to a member by any person or authority. A member submits their own application — their own statement of need, condition, and intent. The act of applying is itself an exercise of sovereignty. No intermediary may apply on behalf of a member without documented, explicit authorisation from that member.',
    },
    {
      code: 'ART · IV',
      title: 'The Algorithm Decides — And Only the Algorithm',
      body: 'Once a member submits an application, the criteria-matching algorithm evaluates it autonomously against the collectively ratified conditions. If criteria are met, the transfer executes automatically. If they are not met, the application does not proceed. No appeal to any human authority can override an algorithm decision — the resolution path is to re-apply when conditions are met.',
    },
  ];

  readonly streams: PoolStream[] = [
    {
      id: 'fun',
      code: 'FUN · CG',
      label: 'Family Upgradation Neurons',
      title: 'Extended Social Family Transformation',
      share: '33%',
      purpose: 'Transformation',
      descriptor: 'One-third of the CG Pool flows into the Family Upgradation stream — directed entirely toward the transformation of the extended social family network. These neurons fund community transformation programs, family-tier education initiatives, cultural intelligence interventions, and the social fabric-building activities that strengthen the bonds between families within the Ceekul civilizational ecosystem.',
      automation: 'When a member submits a family transformation request, the system evaluates the request against the FUN·CG eligibility criteria — community tier, participation history, and alignment with active transformation mandates. If criteria are met, neurons flow automatically without manual approval.',
      accent: '#818cf8',
    },
    {
      id: 'cun',
      code: 'CUN · CG',
      label: 'Cognitive Upgradation Neurons',
      title: 'Cognitive Upgradation of Extended Social Family',
      share: '33%',
      purpose: 'Cognition',
      descriptor: 'The second third of the CG Pool enters the Cognitive Upgradation stream — dedicated to the cognitive upgradation of every member\'s extended social family. This covers access to learning programs, knowledge tools, research subscriptions, mentorship sessions, and AI-augmented cognitive development resources. The premise is simple: when families think better, civilizations advance faster.',
      automation: 'Cognitive upgrade requests are auto-evaluated against the member\'s family-tier learning index and the requesting family member\'s prior participation. Qualifying requests trigger immediate neuron allocation to the designated learning resource, directly purchasing access on behalf of the beneficiary.',
      accent: '#a78bfa',
    },
    {
      id: 'sun',
      code: 'SUN · CG',
      label: 'Social Upgradation Neurons',
      title: 'Solidarity Advance — Emergency Community Support',
      share: '34%',
      purpose: 'Solidarity',
      descriptor: 'The largest share — 34% — flows into the Social Upgradation stream, powering the Solidarity Advance system. A Solidarity Advance is not a financial instrument — it is the community\'s automatic response to a member\'s emergency. When a member faces an acute short-term need they cannot immediately meet with their own neurons, they submit a Solidarity Advance request. The system evaluates, disburses automatically if criteria match, and recovers the advance silently and automatically when the member\'s CB account accumulates sufficient neurons — without penalty, without interest, without shame.',
      automation: 'The Solidarity Advance engine monitors the borrowing member\'s CB neuron balance continuously. When the balance crosses the repayment threshold defined at disbursement time, the advance is automatically recovered in full or in tranches — whichever the member specified at request time. No manual collection. No follow-up. No social friction.',
      accent: '#c084fc',
    },
  ];

  readonly upliftStages: UpliftStage[] = [
    {
      step: 1,
      phase: 'Registration',
      label: 'Any CB ID Registers & Uploads Condition',
      descriptor: 'Any person — regardless of device access — can register for any level of educational content: watching dance videos, learning alphabets, basic literacy, vocational skills, or advanced programs. If they do not own a mobile device, they register through another person\'s mobile on their behalf. They upload their current condition — health, circumstance, and what support they need.',
      tag: 'Open to all',
    },
    {
      step: 2,
      phase: 'Primary Support',
      label: 'Ceebrain Community SUN — First Response',
      descriptor: 'The request is first broadcast to the Ceebrain member network. Any member may choose to support using their personal SUN (Social Unity Neurons). This peer-to-peer layer is always activated first — the community responds before the collective pool is touched. A waiting window allows genuine community response to occur.',
      tag: 'Community first',
    },
    {
      step: 3,
      phase: 'Fallback Eligibility',
      label: 'If Community Support Is Insufficient — CG SUN Activates',
      descriptor: 'Only if the Ceebrain community SUN response is insufficient to meet the registered need does the system open the SUN·CG gate. Eligibility requires confirmed course or content registration. The system verifies the gap between community support received and actual need before authorising CG pool access.',
      tag: 'CG SUN fallback',
    },
    {
      step: 4,
      phase: 'Daily Tracking',
      label: 'Progress Is Tracked Continuously',
      descriptor: 'Once supported, the member\'s daily activity is tracked across three dimensions: health trajectory, learning engagement, and behavioural indicators. Tracking is designed to be lightweight and dignified — not surveillance. The data determines whether monthly Uplift Allocation continues, pauses, or closes.',
      tag: 'Improvement required',
    },
    {
      step: 5,
      phase: 'Monthly Uplift Allocation',
      label: 'Monthly Support Released for Fees & Expenses',
      descriptor: 'If tracking confirms measurable improvement across the previous month, the monthly Uplift Allocation is released automatically from SUN·CG. This covers course fees, learning materials, and directly related living expenses. The allocation is not paid in advance — it is released on the basis of the previous month\'s demonstrated progress.',
      tag: 'Progress-linked',
    },
  ];

  readonly trackingMetrics: TrackingMetric[] = [
    {
      icon: '◎',
      domain: 'Health',
      signals: ['Physical health self-report trend', 'Medical access utilisation', 'Nutrition & wellbeing indicators', 'Rest and activity balance'],
    },
    {
      icon: '◈',
      domain: 'Learning',
      signals: ['Content engagement frequency', 'Course completion milestones', 'Assessment participation', 'Skill application indicators'],
    },
    {
      icon: '◇',
      domain: 'Behaviour',
      signals: ['Community participation rate', 'Peer interaction quality', 'Routine adherence patterns', 'Goal-setting and follow-through'],
    },
  ];

  readonly supportTiers: SupportTier[] = [
    {
      label: 'Standard Uplift',
      duration: 'Up to 6 months',
      condition: 'Consistent monthly improvement across at least two of three tracking dimensions. Renewed automatically each month on evidence of progress.',
      accent: '#818cf8',
    },
    {
      label: 'Extended Uplift',
      duration: 'Up to 12 months',
      condition: 'Exceptional circumstances — complex health, severe deprivation, or multi-generational need — assessed case-by-case. Requires consistent tracking data and a case-level review trigger.',
      accent: '#c084fc',
    },
  ];

  readonly usageRules: NeuronUsageRule[] = [
    {
      stream: 'fun',
      code: 'FUN',
      title: 'Family Upgradation Neurons',
      accent: '#22d3ee',
      primary: 'The wellbeing and growth of the primary family unit — life partner and biological children — takes precedence over all other FUN uses.',
      conditions: [
        'Educational support and skill development for biological children',
        'Health, nutrition, and household wellbeing of the primary family unit',
        'Family participation in Ceekul learning and development programs',
        'Parents and in-laws supported through online engagement and regular in-person wellness presence',
      ],
      guardNote: 'Wellbeing Priority Check: If the algorithm identifies unmet needs within the primary family unit, FUN access is placed on hold until those needs are actively being addressed and confirmed.',
    },
    {
      stream: 'cun',
      code: 'CUN',
      title: 'Cognitive Upgradation Neurons',
      accent: '#a78bfa',
      primary: 'Directed toward the member\'s own cognitive development — learning programs, skill-building, research access, and knowledge participation.',
      conditions: [
        'Enrolment in educational courses, workshops, and learning resources',
        'Access to research tools, knowledge platforms, and cognitive development programs',
        'Mentorship and guided learning engagements',
        'Participation in community research initiatives with pre-agreed participation returns',
      ],
    },
    {
      stream: 'sun',
      code: 'SUN',
      title: 'Social Upgradation Neurons',
      accent: '#f59e0b',
      primary: 'Directed toward charitable contribution, social welfare support, and peer solidarity within the Ceekul community.',
      conditions: [
        'Charitable contributions to social causes and humanitarian support',
        'Peer-to-peer support for members registered in the Uplift Pathway',
        'Community welfare programs and social fabric-building activities',
        'Participation in Ceekul community projects with pre-agreed participation returns',
      ],
    },
  ];

  readonly legacyPhases: LegacyPhase[] = [
    {
      step: 1,
      phase: 'Information Filing',
      label: 'Spouse, Biological Child, or Parent Files Through Their Own CB ID',
      descriptor: 'The process begins only when the deceased member\'s information is filed by their spouse, any biological child, or either parent — each through their own CB ID. The filing includes the deceased member\'s CB ID, the filer\'s relationship to the member, and any required supporting details. The algorithm verifies the filer\'s eligibility autonomously. No filing means no distribution is triggered.',
    },
    {
      step: 2,
      phase: 'Primary Stream Distribution',
      label: 'MY Neurons Distributed Across Personal Streams',
      descriptor: 'Once the information is filed, the deceased member\'s CB ID initiates distribution automatically. MY Neurons are split: 33% into the member\'s FUN (Family Upgradation) account, 33% into CUN (Cognitive Upgradation), 33% into SUN (Social Upgradation), and the remaining ~1% flows to CG100000000000.',
    },
    {
      step: 3,
      phase: 'Transfer to Spouse',
      label: 'Stream Balances Flow to the Registered Spouse',
      descriptor: 'The FUN, CUN, and SUN stream balances are transferred to the registered spouse\'s corresponding accounts — FUN to their FUN, CUN to their CUN, SUN to their SUN. The spouse is the primary beneficiary. If the spouse is also deceased, the system moves to the next step.',
    },
    {
      step: 4,
      phase: 'Fallback to Biological Children',
      label: 'If Spouse Is Also Deceased — Transfer to Biological Children',
      descriptor: 'If the spouse\'s CB ID is also in a transition state, stream balances flow equally among the biological children\'s corresponding accounts — FUN equally to each child\'s FUN, CUN to their CUN, SUN to their SUN. If there are no biological children either, the full stream balances flow to CG100000000000, where they serve the broader Ceekul community.',
    },
    {
      step: 5,
      phase: 'Recurring Post-Transition Distribution',
      label: 'Investment Returns Accumulate and Redistribute Every 6 Months',
      descriptor: 'Any investment returns that arrive after the member\'s passing continue to accumulate in the member\'s CB ID. Every 6 months, the same Legacy Distribution Protocol activates on the accumulated balance — to the spouse if living, to biological children if the spouse has also passed, or to CG100000000000 if neither is available. This cycle continues for as long as returns are received.',
    },
  ];

  readonly autoFlowSteps: AutoFlow[] = [
    {
      step: 1,
      label: 'Member Submits Request',
      descriptor: 'A member sends a structured request — FUN, CUN, or Solidarity Advance — through their personal dashboard. The request includes the purpose, the amount in neurons, and the beneficiary CB ID.',
    },
    {
      step: 2,
      label: 'Criteria Engine Evaluates',
      descriptor: 'The CG criteria engine instantly checks: membership standing, community tier, participation score, existing advance balance, request category alignment, and available neurons in the relevant CG stream.',
    },
    {
      step: 3,
      label: 'Automatic Disbursement',
      descriptor: 'If all criteria are met, neurons flow automatically from the relevant CG stream (FUN, CUN, or SUN) to the beneficiary CB ID — no human approval required, no waiting period.',
    },
    {
      step: 4,
      label: 'Silent Auto-Recovery (Solidarity Advance only)',
      descriptor: 'For Solidarity Advances, the system monitors the requesting member\'s CB ID continuously. When sufficient neurons accumulate, the advance is recovered automatically — silently, without notification friction, and without any social record visible to other members.',
    },
  ];
}
