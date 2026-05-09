import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CuapService } from '../../../services/cuap.service';

@Component({
  selector: 'app-cid-explorer',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="cuap-module">
  <div class="cuap-module__header">
    <span class="cuap-module__label">MODULE — CID EXPLORER</span>
    <h2 class="cuap-module__title">Universal Content ID Resolver</h2>
    <p class="cuap-module__sub">Deterministic SHA-256 · Version chains · O(1) lookup · Immutable audit log</p>
  </div>

  <div class="cidex-search">
    <span class="cidex-search__prefix">⟐</span>
    <input class="cidex-search__input"
      type="text" placeholder="Enter CID (ck_…) or CBID (CB…)"
      [value]="query()"
      (input)="query.set($any($event.target).value)"
      (keydown.enter)="resolve()" />
    <button class="cidex-search__btn" (click)="resolve()" [disabled]="!query().trim()">RESOLVE</button>
  </div>

  @if (cuap.cidResolving()) {
  <div class="cidex-state">Resolving CID from commit ledger…</div>
  } @else if (cuap.cidError()) {
  <div class="cidex-state cidex-state--error">⚠ CID not found. Verify format: ck_[8 hex chars] or CB[12 digits]</div>
  } @else if (cuap.cidResult(); as r) {
  <div class="cidex-result">
    <div class="cidex-result__header">
      <code class="cidex-result__cid">{{ r.cid }}</code>
      <span class="cidex-result__status cidex-result__status--{{ r.status }}">{{ r.status }}</span>
    </div>
    <div class="cidex-result__grid">
      <span>Type</span>        <span>{{ r.type }}</span>
      <span>Logical ID</span>  <code>{{ r.logicalId }}</code>
      <span>Version</span>     <span>v{{ r.version }}</span>
      <span>Parent CID</span>  <code>{{ r.parentCid ?? '— (root commit)' }}</code>
      <span>References</span>  <span>{{ r.references }} objects</span>
      <span>Size</span>        <span>{{ r.sizeBytes }} bytes</span>
      <span>Trusted</span>     <span>{{ r.trusted ? '✓ Yes' : '✗ No' }}</span>
      <span>Committed</span>   <span>{{ r.timestamp | date:'medium' }}</span>
    </div>
    <div class="cidex-result__chain">
      <p class="cidex-result__chain-label">Version Chain (Universal Commit Engine)</p>
      <div class="cidex-chain">
        @for (v of [1,2,3].slice(0, r.version); track v) {
        <div class="cidex-chain__node" [class.cidex-chain__node--current]="v === r.version">
          <span class="cidex-chain__v">v{{ v }}</span>
          <span class="cidex-chain__dot"></span>
        </div>
        @if (v < r.version) { <div class="cidex-chain__line"></div> }
        }
      </div>
    </div>
  </div>
  }

  <div class="cidex-info">
    <div class="cidex-info__card">
      <p class="cidex-info__label">CID Structure</p>
      <code class="cidex-info__code">ck_[48-bit SHA-256 of canonical payload]</code>
      <p class="cidex-info__desc">Deterministic — same content always yields same CID. Deduplication gate prevents re-processing identical commits.</p>
    </div>
    <div class="cidex-info__card">
      <p class="cidex-info__label">Version Chaining</p>
      <code class="cidex-info__code">logicalId + parentCid → immutable chain</code>
      <p class="cidex-info__desc">Every update creates a new CID pointing to its parent. Full audit trail. Instant rollback to any version.</p>
    </div>
    <div class="cidex-info__card">
      <p class="cidex-info__label">Reference System</p>
      <code class="cidex-info__code">content → ad → session → chat</code>
      <p class="cidex-info__desc">CIDs reference other CIDs. Zero data duplication across the platform. O(1) lookup via inverted index.</p>
    </div>
  </div>
</div>`,
  styles: [`
.cuap-module { display: flex; flex-direction: column; gap: 1.25rem; }
.cuap-module__label { font-size: .55rem; font-weight: 800; letter-spacing: .22em; color: #3a4a6a; display: block; margin-bottom: .25rem; }
.cuap-module__title { font-size: 1.25rem; font-weight: 700; color: #c8d8f0; margin: 0 0 .2rem; }
.cuap-module__sub   { font-size: .65rem; color: #3a4a6a; margin: 0; }
.cidex-search { display: flex; align-items: center; gap: .5rem; background: #080c15; border: 1px solid rgba(0,245,255,.15); border-radius: 8px; padding: .75rem 1rem; }
.cidex-search__prefix { font-size: 1.1rem; color: #3a4a6a; flex-shrink: 0; }
.cidex-search__input  { flex: 1; background: transparent; border: none; color: #c8d8f0; font-family: 'Courier New', monospace; font-size: .85rem; outline: none; }
.cidex-search__input::placeholder { color: #3a4a6a; }
.cidex-search__btn    { background: rgba(0,245,255,.1); border: 1px solid rgba(0,245,255,.3); border-radius: 5px; color: #00f5ff; font-size: .65rem; font-weight: 700; letter-spacing: .12em; padding: .4rem .875rem; cursor: pointer; white-space: nowrap; transition: all .15s; }
.cidex-search__btn:hover:not(:disabled) { background: rgba(0,245,255,.18); }
.cidex-search__btn:disabled { opacity: .35; cursor: not-allowed; }
.cidex-state        { font-size: .78rem; color: #3a4a6a; padding: 1rem 0; }
.cidex-state--error { color: #ff3366; }
.cidex-result       { background: #080c15; border: 1px solid rgba(0,245,255,.15); border-radius: 10px; overflow: hidden; }
.cidex-result__header { display: flex; align-items: center; justify-content: space-between; padding: .875rem 1.1rem; border-bottom: 1px solid rgba(0,245,255,.08); }
.cidex-result__cid    { font-family: 'Courier New', monospace; font-size: .85rem; color: #00f5ff; }
.cidex-result__status { font-size: .6rem; font-weight: 800; letter-spacing: .12em; padding: .2rem .6rem; border-radius: 4px; }
.cidex-result__status--active  { color: #22c55e; background: rgba(34,197,94,.1); }
.cidex-result__status--flagged { color: #ff3366; background: rgba(255,51,102,.1); }
.cidex-result__status--pending { color: #ff9900; background: rgba(255,153,0,.1); }
.cidex-result__grid { display: grid; grid-template-columns: 100px 1fr; gap: .35rem .75rem; padding: .875rem 1.1rem; font-size: .72rem; align-items: center; border-bottom: 1px solid rgba(0,245,255,.06); }
.cidex-result__grid span:nth-child(odd) { color: #3a4a6a; }
.cidex-result__grid span:nth-child(even) { color: #c8d8f0; }
.cidex-result__grid code { font-family: 'Courier New', monospace; font-size: .65rem; color: #00f5ff; opacity: .8; }
.cidex-result__chain { padding: .875rem 1.1rem; }
.cidex-result__chain-label { font-size: .58rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #3a4a6a; margin: 0 0 .625rem; }
.cidex-chain { display: flex; align-items: center; gap: 0; }
.cidex-chain__node { display: flex; flex-direction: column; align-items: center; gap: .2rem; }
.cidex-chain__v    { font-size: .58rem; font-weight: 700; color: #3a4a6a; }
.cidex-chain__dot  { width: 10px; height: 10px; border-radius: 50%; background: #1a2a3a; border: 1px solid rgba(0,245,255,.2); }
.cidex-chain__node--current .cidex-chain__dot { background: #00f5ff; box-shadow: 0 0 8px rgba(0,245,255,.5); }
.cidex-chain__node--current .cidex-chain__v { color: #00f5ff; }
.cidex-chain__line { flex: 1; max-width: 40px; height: 1px; background: rgba(0,245,255,.2); }
.cidex-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; }
.cidex-info__card { background: #080c15; border: 1px solid rgba(0,245,255,.07); border-radius: 8px; padding: 1rem; }
.cidex-info__label { font-size: .6rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #3a4a6a; margin: 0 0 .4rem; }
.cidex-info__code  { font-family: 'Courier New', monospace; font-size: .62rem; color: #00f5ff; opacity: .7; display: block; margin-bottom: .5rem; }
.cidex-info__desc  { font-size: .68rem; color: #3a4a6a; line-height: 1.55; margin: 0; }
  `],
})
export class CidExplorer {
  readonly cuap  = inject(CuapService);
  readonly query = signal('');

  resolve(): void {
    const q = this.query().trim();
    if (q) this.cuap.resolveCid(q);
  }
}
