import { Module } from '@nestjs/common';
import { NeuronController } from './neuron.controller';
import { NeuronService } from './neuron.service';

@Module({
  controllers: [NeuronController],
  providers: [NeuronService],
  exports: [NeuronService], // Exported so other modules can call earnNeurons()
})
export class NeuronModule {}
