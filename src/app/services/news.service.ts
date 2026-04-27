import { Injectable, signal } from '@angular/core';

export interface NewsItem {
  _id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  source: string;
  author: string;
  category: 'tech' | 'global' | 'economy' | 'science';
  tags: string[];
  publishedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class NewsService {
  private readonly NEWS: NewsItem[] = [
    {
      _id: 'n1',
      title: 'AI Transforms Healthcare Industry',
      summary: 'Artificial intelligence is reshaping diagnostics, drug discovery, and patient care across global health systems.',
      content: `Artificial intelligence is fundamentally transforming the healthcare industry, with applications spanning diagnostics, drug discovery, and personalized patient care. Machine learning algorithms now detect cancer from imaging scans with accuracy surpassing experienced radiologists in several studies.\n\nMajor pharmaceutical companies are deploying AI models to compress drug discovery timelines from decades to years. DeepMind's AlphaFold has already predicted the 3D structures of virtually all known proteins, unlocking new avenues for therapeutic development.\n\nIn clinical settings, AI-powered diagnostic tools are being deployed in hospitals across Europe and Asia, reducing diagnostic errors and enabling faster triage in emergency departments. Predictive models analyze patient vitals in real time to flag deterioration hours before it becomes critical.\n\nEthicists and regulators caution that algorithmic bias in training data can perpetuate health disparities. Ensuring equitable access to AI-driven tools remains a central challenge as governments weigh policy frameworks for responsible adoption.`,
      source: 'Global Health Review',
      author: 'Dr. Priya Nair',
      category: 'tech',
      tags: ['AI', 'healthcare', 'machine learning'],
      publishedAt: new Date(Date.now() - 2 * 3_600_000),
    },
    {
      _id: 'n2',
      title: 'Global Economy Shows Signs of Recovery',
      summary: 'IMF revises growth forecasts upward as emerging markets stabilize and inflation pressures ease.',
      content: `The International Monetary Fund has revised its global growth forecast upward for the first time in three years, citing easing inflation pressures and stronger-than-expected performance in emerging markets.\n\nIndia and Southeast Asian economies continue to outperform projections, driven by robust domestic consumption and expanding digital infrastructure. The IMF now projects global GDP growth at 3.2% for the current year, up from an earlier estimate of 2.9%.\n\nEurope remains a source of uncertainty. Energy prices, though lower than their 2022 peaks, continue to strain manufacturing-heavy economies like Germany and Italy. ECB officials have signaled a cautious pivot toward rate reductions, contingent on sustained inflation decline.\n\nCentral banks in the United States and United Kingdom are navigating a delicate balance between sustaining employment growth and anchoring inflation expectations. Analysts expect two rate cuts from the US Federal Reserve before year-end, a scenario that has lifted equity markets globally.\n\nEmerging market debt levels remain elevated, and currency volatility continues to pose risks for countries with high dollar-denominated borrowing.`,
      source: 'Reuters',
      author: 'Marcus Henley',
      category: 'economy',
      tags: ['economy', 'IMF', 'growth', 'inflation'],
      publishedAt: new Date(Date.now() - 5 * 3_600_000),
    },
    {
      _id: 'n3',
      title: 'Space Mission Achieves Historic Milestone',
      summary: 'International crew completes first long-duration deep space transit, paving the way for Mars exploration.',
      content: `An international crew of six astronauts has successfully completed a 180-day deep space transit mission, marking the farthest crewed journey from Earth in human history and the most critical validation test for future Mars missions.\n\nThe mission, a joint effort between NASA, ESA, JAXA, and ISRO, used a new propulsion architecture combining solar electric propulsion with a compact nuclear thermal engine for final manoeuvres. The crew spent time in a rotating habitat module designed to mitigate bone density and cardiovascular effects of prolonged microgravity.\n\nCrew health data will inform life support system designs for the planned Mars transit architecture, targeted for a crewed mission in the 2030s. Radiation exposure logs revealed dose levels well within acceptable limits thanks to advances in active shielding technology.\n\nThe mission also deployed two autonomous surface mapping probes that will conduct surveys of near-Earth asteroids, adding to a growing database of potential resource extraction targets.\n\n"This is not the end of an experiment," said Mission Director Yuki Tanaka. "It is proof that humanity can travel far, and come back."`,
      source: 'Space News Network',
      author: 'Aisha Okonkwo',
      category: 'science',
      tags: ['space', 'NASA', 'Mars', 'exploration'],
      publishedAt: new Date(Date.now() - 8 * 3_600_000),
    },
    {
      _id: 'n4',
      title: 'Quantum Computing Breaks Encryption Barrier',
      summary: 'Researchers demonstrate first practical quantum algorithm capable of challenging current RSA encryption standards.',
      content: `Researchers at a consortium of European and Chinese universities have demonstrated a quantum algorithm capable of factoring cryptographic keys at scales previously considered theoretically impossible, reigniting urgent debates about post-quantum cryptography readiness.\n\nThe demonstration used a 1,024-qubit processor operating with error correction rates low enough to execute Shor's algorithm on a 2,048-bit RSA key in a controlled environment. While not yet operationally deployable at scale, the result signals a narrowing gap between theoretical and practical quantum supremacy in cryptography.\n\nThe US National Institute of Standards and Technology (NIST), which finalized its first set of post-quantum cryptographic standards last year, urged organizations to accelerate migration timelines. Financial institutions and critical infrastructure operators are particularly exposed, given the long lifecycle of encrypted data.\n\n"Harvest now, decrypt later attacks are not hypothetical," warned Dr. Elina Braun of the Fraunhofer Institute. "Adversaries may already be stockpiling encrypted data awaiting the capability to break it."\n\nMigration to NIST-approved lattice-based encryption schemes is expected to be a multi-year process for most enterprise systems.`,
      source: 'Tech Frontiers',
      author: 'Sam Richter',
      category: 'tech',
      tags: ['quantum', 'encryption', 'cybersecurity'],
      publishedAt: new Date(Date.now() - 12 * 3_600_000),
    },
    {
      _id: 'n5',
      title: 'Climate Summit Yields New Carbon Pledge Framework',
      summary: 'Nations agree on a binding carbon accounting standard for cross-border emissions tracking.',
      content: `Representatives from 148 nations have agreed on a unified carbon accounting framework that mandates transparent, comparable reporting of cross-border emissions for the first time in international climate governance history.\n\nThe agreement, reached at a special session of the UN Framework Convention on Climate Change, establishes a digital registry built on distributed ledger technology to track carbon credits and emissions data in real time. Independent third-party auditors will validate submissions against satellite-derived emissions measurements.\n\nThe framework directly addresses longstanding criticism that existing voluntary carbon markets were rife with double-counting and unverifiable offsets. Under the new standard, a carbon credit issued in one jurisdiction cannot be simultaneously claimed by another.\n\nEnvironmental groups cautiously welcomed the announcement but noted that binding enforcement mechanisms remain weak. "The architecture is sound," said Greenpeace lead negotiator Clara Mendez, "but without credible penalties, early adopters bear unfair costs relative to laggards."\n\nThe European Union and Canada announced immediate adoption, while the United States and China agreed to a 24-month implementation runway.`,
      source: 'The Guardian',
      author: 'Hemi Walker',
      category: 'global',
      tags: ['climate', 'carbon', 'UN', 'sustainability'],
      publishedAt: new Date(Date.now() - 18 * 3_600_000),
    },
    {
      _id: 'n6',
      title: 'Neural Interface Technology Enters Consumer Market',
      summary: 'FDA clearance granted for first consumer-grade brain-computer interface device targeting productivity applications.',
      content: `The US Food and Drug Administration has granted market clearance to a consumer-grade brain-computer interface (BCI) device designed to assist knowledge workers with focus, workflow management, and hands-free device control — the first such approval outside clinical or assistive-technology categories.\n\nThe device, a non-invasive headband using advanced dry-electrode EEG arrays combined with an on-device AI processor, interprets mental states and intent signals with sufficient accuracy for text navigation, smart home control, and adaptive notification filtering. Latency under 80 milliseconds was cited as the threshold that makes real-world productivity use viable.\n\nPrivacy advocates raised immediate concerns about the categories of neural data the device captures and retains. The company's terms of service permit aggregated, anonymized data to be used for model improvement, a provision critics argue creates structural incentives to over-collect.\n\nNeurologists emphasized that cognitive enhancement claims in marketing materials require independent longitudinal study. "Correlation between EEG signals and stated mental states in controlled lab conditions does not automatically translate to reliable, safe enhancements in real-world environments," noted Dr. Fatima Al-Rashid of Imperial College London.\n\nThe device launches in North America and Western Europe at a retail price of $499.`,
      source: 'Wired',
      author: 'Leo Chen',
      category: 'tech',
      tags: ['BCI', 'neurotechnology', 'FDA', 'consumer tech'],
      publishedAt: new Date(Date.now() - 24 * 3_600_000),
    },
  ];

  selectedNews = signal<NewsItem | null>(null);

  getNewsList(): NewsItem[] {
    return this.NEWS;
  }

  selectNews(id: string): void {
    this.selectedNews.set(this.NEWS.find(n => n._id === id) ?? null);
  }

  clearSelection(): void {
    this.selectedNews.set(null);
  }

  getContentParagraphs(content: string): string[] {
    return content.split('\n\n').filter(p => p.trim().length > 0);
  }

  formatRelativeTime(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffHrs = Math.floor(diffMs / 3_600_000);
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  getCategoryLabel(cat: string): string {
    const labels: Record<string, string> = {
      tech: 'TECH',
      global: 'GLOBAL',
      economy: 'ECONOMY',
      science: 'SCIENCE',
    };
    return labels[cat] ?? cat.toUpperCase();
  }
}
