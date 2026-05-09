import { Injectable, signal, computed } from '@angular/core';

const PREFIX = 'CB100000';
const BLOCK_SIZE = 100_000;
const BLOCK_START_OFFSET = 100_001; // first ID in block 1
const STORAGE_KEY = 'cbid_seq';

@Injectable({ providedIn: 'root' })
export class CeebrainIdService {
  private seq = signal<number>(this.loadSeq());

  readonly blockInfo = computed(() => {
    const s = this.seq();
    const blockNum   = Math.floor((s - BLOCK_START_OFFSET) / BLOCK_SIZE) + 1;
    const blockStart = BLOCK_START_OFFSET + (blockNum - 1) * BLOCK_SIZE;
    const blockEnd   = blockStart + BLOCK_SIZE - 1;
    return { blockNum, blockStart, blockEnd, used: s - blockStart, remaining: blockEnd - s + 1 };
  });

  peek(): string {
    return this.format(this.seq());
  }

  allocate(): string {
    const id = this.format(this.seq());
    this.seq.update(n => n + 1);
    this.persist();
    return id;
  }

  private format(n: number): string {
    return `${PREFIX}${String(n).padStart(6, '0')}`;
  }

  private loadSeq(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (!isNaN(n) && n >= BLOCK_START_OFFSET) return n;
      }
    } catch {}
    return BLOCK_START_OFFSET;
  }

  private persist(): void {
    try { localStorage.setItem(STORAGE_KEY, String(this.seq())); } catch {}
  }
}
