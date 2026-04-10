import { Controller, Post, Body } from '@nestjs/common';
import { EvolutionService } from './evolution.service';

@Controller('v1/content')
export class EvolutionController {
  constructor(private readonly evolutionService: EvolutionService) {}

  @Post('evolve')
  async evolve(@Body() body: any) {
    return this.evolutionService.evolveContent(body.contentId, body.context);
  }
}

// Module definition
import { Module } from '@nestjs/common';

@Module({
  controllers: [EvolutionController],
  providers: [EvolutionService],
  exports: [EvolutionService],
})
export class EvolutionModule {}
