import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { DemandService, DemandProfile } from './demand.service';

export interface EvaluateDemandDto {
  user_input: string;
  context?: string;
  user_profile?: DemandProfile;
}

@Controller('api/demand')
export class DemandController {
  constructor(private readonly demandService: DemandService) {}

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  async evaluate(@Body() dto: EvaluateDemandDto) {
    return this.demandService.evaluate(dto.user_input, dto.context || '', dto.user_profile);
  }
}
