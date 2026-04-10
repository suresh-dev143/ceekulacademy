import { Injectable } from '@nestjs/common';

export interface AdCriteria {
  location: string;
  language: string;
  ageGroup?: string;
  interests?: string[];
  engagementScore?: number;
}

export interface Advertisement {
  id: string;
  title: string;
  mediaUrl: string;
  mandatoryCriteria: {
    location: string[];
    language: string[];
  };
  optionalCriteria?: {
    ageGroup?: string[];
    interests?: string[];
    minEngagementScore?: number;
  };
}

@Injectable()
export class AdMatcherService {
  matchAds(ads: Advertisement[], criteria: AdCriteria): Advertisement[] {
    return ads
      .filter((ad) => this.isMandatoryMatch(ad, criteria))
      .sort((a, b) => this.calculateMatchScore(b, criteria) - this.calculateMatchScore(a, criteria));
  }

  private isMandatoryMatch(ad: Advertisement, criteria: AdCriteria): boolean {
    const locationMatch = ad.mandatoryCriteria.location.includes(criteria.location);
    const languageMatch = ad.mandatoryCriteria.language.includes(criteria.language);
    return locationMatch && languageMatch;
  }

  private calculateMatchScore(ad: Advertisement, criteria: AdCriteria): number {
    let score = 0;
    if (!ad.optionalCriteria) return score;

    // Age Group Match (+10 points)
    if (criteria.ageGroup && ad.optionalCriteria.ageGroup?.includes(criteria.ageGroup)) {
      score += 10;
    }

    // Interests Match (+5 points per interest)
    if (criteria.interests && ad.optionalCriteria.interests) {
      const matchingInterests = criteria.interests.filter((i) =>
        ad.optionalCriteria?.interests?.includes(i),
      );
      score += matchingInterests.length * 5;
    }

    // Engagement Score Match (+ engagement value)
    if (
      criteria.engagementScore &&
      ad.optionalCriteria.minEngagementScore &&
      criteria.engagementScore >= ad.optionalCriteria.minEngagementScore
    ) {
      score += criteria.engagementScore;
    }

    return score;
  }
}
