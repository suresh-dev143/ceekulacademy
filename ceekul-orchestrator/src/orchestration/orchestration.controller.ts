import { Controller, Get, Query } from '@nestjs/common';
import { OrchestrationService } from './orchestration.service';
import { AdCriteria } from './ad-matcher.service';

@Controller('v1/schedule')
export class OrchestrationController {
  constructor(private readonly orchestrationService: OrchestrationService) {}

  @Get('current')
  getCurrentStatus(
    @Query('location') location: string = 'IN',
    @Query('language') language: string = 'en',
    @Query('ageGroup') ageGroup?: string,
    @Query('interests') interests?: string,
    @Query('engagementScore') engagementScore?: string,
  ) {
    const criteria: AdCriteria = {
      location,
      language,
      ageGroup,
      interests: interests ? interests.split(',') : [],
      engagementScore: engagementScore ? parseFloat(engagementScore) : 0,
    };

    return this.orchestrationService.getCurrentSegment(criteria);
  }
}
