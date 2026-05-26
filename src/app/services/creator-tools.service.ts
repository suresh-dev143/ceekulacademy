import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface CreatorUpdateEvent {
  segmentId: string;
  replacement: string;
}

@Injectable({ providedIn: 'root' })
export class CreatorToolsService {
  readonly sessionTitle = signal('');
  readonly sessionContentTitle = signal('');
  readonly hasActiveCanvas = signal(false);
  readonly applyUpdate$ = new Subject<CreatorUpdateEvent>();
}
