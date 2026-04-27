import { Injectable } from '@angular/core';

export interface LocalNewsAction {
  label: string;
  variant: 'primary' | 'ghost';
}

export interface LocalNewsItem {
  _id: string;
  title: string;
  distance: number;
  timeContext: string;
  tag: string;
  isLive: boolean;
  actions: LocalNewsAction[];
}

@Injectable({ providedIn: 'root' })
export class LocalNewsService {

  readonly personalized: LocalNewsItem[] = [
    {
      _id: 'l1',
      title: 'Free AI-based diabetes screening camp',
      distance: 1.6,
      timeContext: 'Today 4–7 PM',
      tag: 'Matches your Health interest',
      isLive: false,
      actions: [
        { label: 'Participate', variant: 'primary' },
        { label: 'Contribute', variant: 'ghost' },
      ],
    },
    {
      _id: 'l2',
      title: 'Students build AI crop prediction model',
      distance: 3.2,
      timeContext: 'College lab demo this week',
      tag: 'Innovation · Early Stage',
      isLive: false,
      actions: [
        { label: 'Connect', variant: 'primary' },
        { label: 'Support', variant: 'ghost' },
      ],
    },
  ];

  readonly nearby: LocalNewsItem[] = [
    {
      _id: 'l3',
      title: 'Volunteers needed for AI waste management pilot',
      distance: 0.9,
      timeContext: 'Starts tomorrow',
      tag: 'Sustainability',
      isLive: false,
      actions: [
        { label: 'Join', variant: 'primary' },
        { label: 'Contribute', variant: 'ghost' },
      ],
    },
    {
      _id: 'l4',
      title: 'Smart traffic AI reduces congestion at 3 junctions',
      distance: 2.8,
      timeContext: 'Live deployment',
      tag: 'Civic · Active',
      isLive: true,
      actions: [
        { label: 'View Impact', variant: 'primary' },
      ],
    },
    {
      _id: 'l5',
      title: 'AI tutoring centre opens free slots for kids',
      distance: 1.1,
      timeContext: 'Today 3–6 PM',
      tag: 'Education',
      isLive: false,
      actions: [
        { label: 'Register', variant: 'primary' },
        { label: 'Support', variant: 'ghost' },
      ],
    },
    {
      _id: 'l6',
      title: 'Local solar microgrid goes live across 2 streets',
      distance: 4.2,
      timeContext: 'Active now',
      tag: 'Energy · Live',
      isLive: true,
      actions: [
        { label: 'View Impact', variant: 'primary' },
      ],
    },
    {
      _id: 'l7',
      title: 'Community coding bootcamp — 12 seats remaining',
      distance: 2.1,
      timeContext: 'Starts next Monday',
      tag: 'Skills',
      isLive: false,
      actions: [
        { label: 'Join', variant: 'primary' },
      ],
    },
  ];

  readonly tickerMessages: string[] = [
    'Health camp started now · 1.2 km away',
    'New AI lab opened · 4 km away',
    'Solar microgrid active · Sector 7',
    'Bootcamp registration closes in 2 hrs',
    'Waste pilot accepting volunteers now',
  ];
}
