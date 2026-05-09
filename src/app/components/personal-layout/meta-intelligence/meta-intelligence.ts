import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LifeOrchestratorService } from '../../../services/life-orchestrator.service';

@Component({
  selector: 'app-meta-intelligence',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meta-intelligence.html',
  styleUrl: './meta-intelligence.scss'
})
export class MetaIntelligenceComponent {
  readonly orc = inject(LifeOrchestratorService);

  readonly block = computed(() => this.orc.currentBlock());

  readonly metrics = computed(() => {
    const data = this.block()?.left_box?.data;
    if (!data) return [];
    return Object.entries(data).map(([key, value]) => ({ key, value }));
  });

  readonly dynamicTitle = computed((): string => {
    const b = this.block();
    if (!b) return 'Contextual Intelligence';

    const text = [b.intent, b.middle_box?.activity, b.phase].join(' ').toLowerCase();

    if (/research|reading|deep read|study|emergi|analysis|knowledge/.test(text))
      return 'Emerging Research';
    if (/meditat|yoga|breath|pranayama|mindful|inner/.test(text))
      return 'Inner Monitoring';
    if (/civic|community|social|local|participat|ward/.test(text))
      return 'Social Intelligence';
    if (/creat|art|express|writ|compos|music|paint/.test(text))
      return 'Creative Pulse';
    if (/teach|lesson|neuron|publish|peer/.test(text))
      return 'Knowledge Creation';
    if (/health|nutri|food|diet|exercise|fitness|detox/.test(text))
      return 'Health Signals';
    if (/finance|invest|budget|money|financial/.test(text))
      return 'Financial Intelligence';
    if (/focus|deep work|single.task|uninterrupt/.test(text))
      return 'Meta Analysis';
    if (/recov|rest|relax|slow|unwind/.test(text))
      return 'Recovery Monitoring';
    if (/wind.down|evening/.test(text))
      return 'Wind-Down Signals';

    switch ((b.phase ?? '').toLowerCase()) {
      case 'peak':      return 'Peak Intelligence';
      case 'flow':      return 'Flow Analysis';
      case 'recovery':  return 'Recovery Monitoring';
      case 'wind-down': return 'Wind-Down Signals';
      default:          return 'Contextual Intelligence';
    }
  });
}
