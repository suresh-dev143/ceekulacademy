import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Infrastructure } from '../../../services/partner.service';
import { InfrastructureFormComponent } from '../infrastructure-form/infrastructure-form';

@Component({
  selector: 'app-infrastructure-manager',
  standalone: true,
  imports: [CommonModule, InfrastructureFormComponent],
  template: `
    <div class="mgmt-section">
      <div class="section-header">
        <h3 class="section-title"><i class="fas fa-building"></i> Infrastructure & Venues</h3>
        @if (!isAddingResource()) {
            <button class="btn-outline-sm" (click)="toggleAddResource()">Add Resource</button>
        }
      </div>

      @if (isAddingResource()) {
        <app-infrastructure-form (close)="toggleAddResource()"></app-infrastructure-form>
      } @else {
        <div class="infra-list">
            <div class="infra-item" *ngFor="let item of infrastructure">
            <div class="infra-main">
                <div class="infra-type-icon">{{ item.type === 'Lab' ? '🧪' : '🏫' }}</div>
                <div class="infra-info">
                <h4 class="infra-name">{{ item.name }}</h4>
                <div class="infra-tags">
                    <span class="tag" *ngFor="let tag of item.tags">{{ tag }}</span>
                </div>
                </div>
            </div>
            <div class="infra-capacity">
                <span class="cap-val">{{ item.capacity }}</span>
                <span class="cap-label">Capacity</span>
            </div>
            <div class="infra-actions">
                <button class="icon-btn"><i class="fas fa-edit"></i></button>
                <button class="icon-btn"><i class="fas fa-calendar-check"></i></button>
            </div>
            </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .mgmt-section { padding: 2.5rem; background: #000000; border: 1px solid var(--accent-primary); border-radius: 0; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; i { color: var(--accent-primary); } }
    
    .infra-list { display: flex; flex-direction: column; gap: 1rem; }
    .infra-item {
      background: #050505; border: 1px solid var(--row-border); border-radius: 0;
      padding: 1.5rem; display: flex; align-items: center; justify-content: space-between; transition: 0.2s;
      &:hover { border-color: var(--accent-primary); background: #0a0a0a; }
    }

    .infra-main { display: flex; align-items: center; gap: 1.2rem; flex: 2; }
    .infra-type-icon { width: 44px; height: 44px; background: #000000; border: 1px solid var(--row-border); border-radius: 0; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; filter: grayscale(1); }
    .infra-name { font-weight: 800; color: #fff; margin: 0 0 0.4rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .infra-tags { display: flex; gap: 0.5rem; }
    .tag { font-size: 0.65rem; font-weight: 900; color: #000000; background: var(--accent-primary); border: 1px solid var(--accent-primary); padding: 0.2rem 0.6rem; border-radius: 0; text-transform: uppercase; letter-spacing: 0.5px; }

    .infra-capacity { text-align: center; flex: 1; }
    .cap-val { display: block; font-size: 1.5rem; font-weight: 900; color: #fff; }
    .cap-label { font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }

    .infra-actions { display: flex; gap: 0.8rem; }
    .icon-btn { background: none; border: 1px solid var(--row-border); color: var(--text-secondary); width: 34px; height: 34px; border-radius: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; transition: 0.2s; &:hover { color: var(--accent-primary); border-color: var(--accent-primary); } }
    .btn-outline-sm { background: #000000; border: 1px solid var(--accent-primary); color: var(--text-primary); padding: 0.6rem 1.25rem; border-radius: 0; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; &:hover { background: var(--accent-primary); color: #000000; } }
  `]
})
export class InfrastructureManagerComponent {
  @Input() infrastructure: Infrastructure[] = [];
  isAddingResource = signal(false);

  toggleAddResource() {
    this.isAddingResource.update(v => !v);
  }
}
