import { Injectable } from '@nestjs/common';
import { AdMatcherService, AdCriteria, Advertisement } from './ad-matcher.service';

export enum SegmentType {
  CONTENT = 'CONTENT',
  ADVERTISEMENT = 'ADVERTISEMENT',
}

@Injectable()
export class OrchestrationService {
  constructor(private readonly adMatcherService: AdMatcherService) {}

  // Mocked data - in production this would come from a database
  private ads: Advertisement[] = [
    {
      id: 'ad_1',
      title: 'Premium Course Ad',
      mediaUrl: 'https://assets.ceekul.com/ads/premium.mp4',
      mandatoryCriteria: { location: ['IN'], language: ['en'] },
      optionalCriteria: { interests: ['coding', 'ai'] },
    },
    {
      id: 'ad_2',
      title: 'Workshop Offer',
      mediaUrl: 'https://assets.ceekul.com/ads/workshop.mp4',
      mandatoryCriteria: { location: ['US'], language: ['en'] },
      optionalCriteria: { ageGroup: ['20-30'] },
    },
  ];

  getCurrentSegment(criteria: AdCriteria) {
    const now = new Date();
    const minuteOfHour = now.getMinutes();
    const secondsOfMinute = now.getSeconds();

    if (minuteOfHour < 50) {
      return {
        type: SegmentType.CONTENT,
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0),
        duration: 3000, // 50 mins in seconds
        remainingSeconds: (50 - minuteOfHour) * 60 - secondsOfMinute,
      };
    } else {
      // 10-minute advertisement window (50 to 60)
      const adMinute = minuteOfHour - 50;
      const totalAdSeconds = adMinute * 60 + secondsOfMinute;
      const adBlockIndex = Math.floor(totalAdSeconds / 10); // 10s blocks

      const matchedAds = this.adMatcherService.matchAds(this.ads, criteria);
      const selectedAd = matchedAds[adBlockIndex % matchedAds.length] || this.ads[0];

      return {
        type: SegmentType.ADVERTISEMENT,
        ad: selectedAd,
        blockIndex: adBlockIndex,
        remainingSeconds: 10 - (totalAdSeconds % 10),
      };
    }
  }
}
