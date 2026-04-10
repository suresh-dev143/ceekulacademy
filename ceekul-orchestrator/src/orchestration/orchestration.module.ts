import { Module } from '@nestjs/common';
import { OrchestrationController } from './orchestration.controller';
import { OrchestrationService } from './orchestration.service';
import { AdMatcherService } from './ad-matcher.service';

@Module({
  controllers: [OrchestrationController],
  providers: [OrchestrationService, AdMatcherService],
  exports: [OrchestrationService],
})
export class OrchestrationModule {}
