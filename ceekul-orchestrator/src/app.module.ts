import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrchestrationModule } from './orchestration/orchestration.module';
import { EvolutionModule } from './evolution/evolution.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { NeuronModule } from './neurons/neuron.module';
import { DemandModule } from './demand/demand.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    OrchestrationModule,
    EvolutionModule,
    CollaborationModule,
    NeuronModule,
    DemandModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
