import { Component, Input, Output, EventEmitter, signal, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { InfrastructurePayload, InfrastructureResponse, InfrastructureData, Classroom, ComputerLab, OtherFacility, ComputerLabResponse } from '../../../core/models/infrastructure.model';
import { InfrastructureService } from '../../../core/services/infrastructure.service';
import { ToastService } from '../../../core/services/toast.service';
import { InfrastructureFormComponent } from '../infrastructure-form/infrastructure-form';
import { ClassroomFormComponent } from '../classroom-form/classroom-form.component';
import { ComputerLabFormComponent } from '../computer-lab-form/computer-lab-form.component';
import { FacilityFormComponent } from '../facility-form/facility-form.component';
import { finalize } from 'rxjs';
@Component({
  selector: 'app-infrastructure-manager',
  standalone: true,
  imports: [CommonModule, InfrastructureFormComponent, ClassroomFormComponent, ComputerLabFormComponent, FacilityFormComponent],
  template: `
    <div class="mgmt-section">
      <div class="section-header">
        <div class="header-left">
          <h3 class="section-title"><i class="fas fa-building"></i> Infrastructure & Venues</h3>
          <p class="section-subtitle">Manage your institutional facilities and learning spaces</p>
        </div>
        @if (!isAddingResource() && !isEditingResource()) {
            <div class="header-actions">
                <button class="btn-primary-sm" (click)="toggleAddResource()"><i class="fas fa-plus"></i> Add Site</button>
            </div>
        }
      </div>

      @if (isAddingResource() || isEditingResource()) {
        <app-infrastructure-form [initialData]="editData()" (close)="onFormClose()"></app-infrastructure-form>
      } @else if (isLoading()) {
        <div class="loading-state">
            <div class="spinner-container">
                <i class="fas fa-circle-notch fa-spin"></i>
                <span>Loading infrastructure...</span>
            </div>
        </div>
      } @else {
        <div class="infra-container">
            @for (infra of infraList(); track infra._id) {
                <div class="infra-card" [class.expanded]="expandedInfraId() === infra._id">
                    <div class="card-header" (click)="toggleExpand(infra._id)">
                        <div class="header-main">
                            <div class="school-brand">
                              <div class="brand-icon"><i class="fas fa-university"></i></div>
                              <div class="school-details">
                                  <h4 class="school-name">{{ infra.generalInfo.schoolName }}</h4>
                                  <p class="school-address"><i class="fas fa-map-marker-alt"></i> {{ formatAddress(infra.generalInfo.address) }}</p>
                              </div>
                            </div>
                            
                            <div class="quick-stats">
                                <div class="stat-pill">
                                    <i class="fas fa-user-tie"></i>
                                    <span>{{ infra.generalInfo.contactName }}</span>
                                </div>
                                <div class="stat-group">
                                    <div class="stat" title="Classrooms">
                                        <span class="count">{{ infra.classrooms.length }}</span>
                                        <span class="label">Classrooms</span>
                                    </div>
                                    <div class="stat" title="Computer Labs">
                                        <span class="count">{{ infra.computerLabs.length }}</span>
                                        <span class="label">Labs</span>
                                    </div>
                                    <div class="stat" title="Other Facilities">
                                        <span class="count">{{ infra.otherFacilities.length }}</span>
                                        <span class="label">Facilities</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="header-indicator">
                            <i class="fas" [class.fa-chevron-down]="expandedInfraId() !== infra._id" [class.fa-chevron-up]="expandedInfraId() === infra._id"></i>
                        </div>
                    </div>

                    <div class="card-content" [class.show]="expandedInfraId() === infra._id">
                        <div class="content-inner">
                            <div class="site-actions-bar">
                                <div class="action-group">
                                    <button class="btn-action" (click)="toggleAddClassroom(infra._id); $event.stopPropagation()">
                                        <i class="fas fa-chalkboard-teacher"></i> Add Classroom
                                    </button>
                                    <button class="btn-action" (click)="toggleAddComputerLab(infra._id); $event.stopPropagation()">
                                        <i class="fas fa-desktop"></i> Add Lab
                                    </button>
                                    <button class="btn-action" (click)="toggleAddFacility(infra._id); $event.stopPropagation()">
                                        <i class="fas fa-building"></i> Add Facility
                                    </button>
                                </div>
                                <div class="site-danger-zone">
                                    <button class="btn-edit-site" (click)="editResource(infra); $event.stopPropagation()">
                                        <i class="fas fa-cog"></i> Edit Site Details
                                    </button>
                                    <button class="btn-delete-site" (click)="confirmDeleteSite(infra._id); $event.stopPropagation()">
                                        <i class="fas fa-trash-alt"></i> Delete Site
                                    </button>
                                </div>
                            </div>

                            <div class="resource-grid">
                                <!-- Classrooms Section -->
                                <div class="resource-section">
                                    <div class="res-header">
                                        <h5><i class="fas fa-school"></i> Classrooms</h5>
                                        <span class="res-count">{{ infra.classrooms.length }}</span>
                                    </div>
                                    <div class="res-list">
                                        @for (item of infra.classrooms; track item.name) {
                                            <div class="res-item">
                                                <div class="res-info">
                                                    <span class="res-name">{{ item.name }}</span>
                                                    <div class="res-meta">
                                                      <span class="res-tag">{{ item.type }}</span>
                                                      <span class="res-tag"><i class="fas fa-users"></i> {{ item.capacity }}</span>
                                                      <span class="res-tag pricing-tag" [class.free]="isFree(item.availabilitySchedule)">
                                                        <i class="fas fa-tag"></i> {{ formatPricing(item.availabilitySchedule) }}
                                                      </span>
                                                  </div>
                                                </div>
                                                <div class="res-actions">
                                                    <button class="mini-btn" (click)="editClassroom(item, infra._id); $event.stopPropagation()"><i class="fas fa-pen"></i></button>
                                                    <button class="mini-btn danger" (click)="confirmDelete('classrooms', item.name, infra); $event.stopPropagation()"><i class="fas fa-trash"></i></button>
                                                </div>
                                            </div>
                                        }
                                        @if (infra.classrooms.length === 0) {
                                            <div class="res-empty">No classrooms added</div>
                                        }
                                    </div>
                                </div>

                                <!-- Labs Section -->
                                <div class="resource-section">
                                    <div class="res-header">
                                        <h5><i class="fas fa-desktop"></i> Computer Labs</h5>
                                        <span class="res-count">{{ infra.computerLabs.length }}</span>
                                    </div>
                                    <div class="res-list">
                                        @for (item of infra.computerLabs; track item.name) {
                                            <div class="res-item">
                                                <div class="res-info">
                                                    <span class="res-name">{{ item.name }}</span>
                                                    <div class="res-meta">
                                                      <span class="res-tag"><i class="fas fa-desktop"></i> {{ item.workstations }} Units</span>
                                                      <span class="res-tag"><i class="fas fa-wifi"></i> {{ item.internetSpeed }}</span>
                                                      <span class="res-tag pricing-tag" [class.free]="isFree(item.availabilitySchedule)">
                                                        <i class="fas fa-tag"></i> {{ formatPricing(item.availabilitySchedule) }}
                                                      </span>
                                                  </div>
                                                </div>
                                                <div class="res-actions">
                                                    <button class="mini-btn" (click)="editLab(item, infra._id); $event.stopPropagation()"><i class="fas fa-pen"></i></button>
                                                    <button class="mini-btn danger" (click)="confirmDelete('computerLabs', item.name, infra); $event.stopPropagation()"><i class="fas fa-trash"></i></button>
                                                </div>
                                            </div>
                                        }
                                        @if (infra.computerLabs.length === 0) {
                                            <div class="res-empty">No labs added</div>
                                        }
                                    </div>
                                </div>

                                <!-- Facilities Section -->
                                <div class="resource-section">
                                    <div class="res-header">
                                        <h5><i class="fas fa-building"></i> Other Facilities</h5>
                                        <span class="res-count">{{ infra.otherFacilities.length }}</span>
                                    </div>
                                    <div class="res-list">
                                        @for (item of infra.otherFacilities; track item.name) {
                                            <div class="res-item">
                                                <div class="res-info">
                                                    <span class="res-name">{{ item.name }}</span>
                                                    <div class="res-meta">
                                                      <span class="res-tag">{{ item.type }}</span>
                                                      @if (item.capacity) { <span class="res-tag"><i class="fas fa-users"></i> {{ item.capacity }}</span> }
                                                      <span class="res-tag pricing-tag" [class.free]="isFree(item.availabilitySchedule)">
                                                        <i class="fas fa-tag"></i> {{ formatPricing(item.availabilitySchedule) }}
                                                      </span>
                                                  </div>
                                                </div>
                                                <div class="res-actions">
                                                    <button class="mini-btn" (click)="editFacility(item, infra._id); $event.stopPropagation()"><i class="fas fa-pen"></i></button>
                                                    <button class="mini-btn danger" (click)="confirmDelete('otherFacilities', item.name, infra); $event.stopPropagation()"><i class="fas fa-trash"></i></button>
                                                </div>
                                            </div>
                                        }
                                        @if (infra.otherFacilities.length === 0) {
                                            <div class="res-empty">No facilities added</div>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }

            @if (infraList().length === 0) {
                <div class="empty-placeholder">
                    <i class="fas fa-city"></i>
                    <h4>No Infrastructure Found</h4>
                    <p>Get started by adding your first school or venue site.</p>
                    <button class="btn-primary" (click)="toggleAddResource()">Add Your First Site</button>
                </div>
            }
        </div>
      }

      @if (isAddingClassroom() && selectedInfraId()) {
        <div class="modal-layer">
          <div class="modal-window">
            <app-classroom-form 
              [infraId]="selectedInfraId()!" 
              [editData]="editClassroomData() || undefined"
              (close)="onClassroomFormClose()"
              (saved)="onClassroomSaved()">
            </app-classroom-form>
          </div>
        </div>
      }
      
      @if (isAddingComputerLab() && selectedInfraId()) {
        <div class="modal-layer">
          <div class="modal-window">
            <app-computer-lab-form 
              [infraId]="selectedInfraId()!" 
              [editData]="editLabData() || undefined"
              (close)="onLabFormClose()"
              (saved)="onLabSaved()">
            </app-computer-lab-form>
          </div>
        </div>
      }

      @if (isAddingFacility() && selectedInfraId()) {
        <div class="modal-layer">
          <div class="modal-window">
            <app-facility-form 
              [infraId]="selectedInfraId()!" 
              [editData]="editFacilityData() || undefined"
              (close)="onFacilityFormClose()"
              (saved)="onFacilitySaved()">
            </app-facility-form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { --accent: #ffd700; --bg-card: #0a0a0a; --bg-header: #111111; --border-color: #222; --text-muted: #888; }
    
    .mgmt-section { padding: 1rem; background: #010101; min-height: 100%; color: #fff; }
    
    .section-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; }
    .section-title { font-size: 1.5rem; font-weight: 900; margin: 0; color: #fff; display: flex; align-items: center; gap: 1rem; text-transform: uppercase; letter-spacing: 1px; i { color: var(--accent); } }
    .section-subtitle { font-size: 0.85rem; color: var(--text-muted); margin: 0.3rem 0 0; }
    
    .header-actions { display: flex; gap: 1rem; }
    .btn-primary-sm { background: var(--accent); color: #000; border: none; padding: 0.7rem 1.2rem; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: 0.2s; &:hover { transform: translateY(-2px); filter: brightness(1.1); } }
    .btn-danger-sm { background: transparent; border: 1px solid #ff4444; color: #ff4444; padding: 0.7rem 1.2rem; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; cursor: pointer; transition: 0.2s; &:hover { background: #ff4444; color: #fff; } }

    .infra-container { display: flex; flex-direction: column; gap: 1.2rem; }
    
    .infra-card { background: var(--bg-card); border: 1px solid var(--border-color); position: relative; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        &:hover { border-color: #444; }
        &.expanded { border-color: var(--accent); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    }

    .card-header { padding: 1.2rem 1.5rem; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; }
    .header-main { display: flex; align-items: center; gap: 2rem; flex: 1; }
    
    .school-brand { display: flex; align-items: center; gap: 1.2rem; min-width: 250px; }
    .brand-icon { width: 48px; height: 48px; background: #000; border: 1px solid #333; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: var(--accent); }
    .school-name { font-size: 1.1rem; font-weight: 800; margin: 0; color: #fff; text-transform: uppercase; }
    .school-address { font-size: 0.75rem; color: var(--text-muted); margin: 0.2rem 0 0; display: flex; align-items: center; gap: 0.4rem; i { font-size: 0.7rem; } }

    .quick-stats { display: flex; align-items: center; gap: 2rem; }
    .stat-pill { background: #1a1a1a; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.75rem; color: #ccc; display: flex; align-items: center; gap: 0.6rem; border: 1px solid #333; }
    .stat-group { display: flex; gap: 1.5rem; padding-left: 1.5rem; border-left: 1px solid #333; }
    .stat { display: flex; flex-direction: column; align-items: center;
        .count { font-size: 1rem; font-weight: 900; color: #fff; line-height: 1; }
        .label { font-size: 0.6rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-top: 0.2rem; }
    }

    .header-indicator { color: var(--text-muted); font-size: 0.9rem; transition: 0.3s; }
    .infra-card.expanded .header-indicator { color: var(--accent); }

    .card-content { max-height: 0; overflow: hidden; visibility: hidden; transition: all 0.3s ease-in-out; background: #050505;
        &.show { max-height: 2000px; visibility: visible; }
    }
    .content-inner { padding: 1.5rem; border-top: 1px solid #222; }

    .site-actions-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1.2rem; border-bottom: 1px dashed #333; }
    .action-group { display: flex; gap: 0.8rem; }
    .site-danger-zone { display: flex; gap: 0.8rem; align-items: center; }
    .btn-action { background: #111; border: 1px solid #333; color: #fff; padding: 0.6rem 1rem; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.6rem; transition: 0.2s; &:hover { border-color: var(--accent); color: var(--accent); } }
    .btn-edit-site { background: transparent; border: 1px solid var(--accent); color: var(--accent); padding: 0.6rem 1rem; font-size: 0.75rem; font-weight: 800; cursor: pointer; text-transform: uppercase; display: flex; align-items: center; gap: 0.6rem; &:hover { background: var(--accent); color: #000; } }
    .btn-delete-site { background: transparent; border: 1px solid #ff4444; color: #ff4444; padding: 0.6rem 1rem; font-size: 0.75rem; font-weight: 800; cursor: pointer; text-transform: uppercase; display: flex; align-items: center; gap: 0.6rem; &:hover { background: #ff4444; color: #fff; } }

    .resource-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .resource-section { background: #000; border: 1px solid #222; padding: 1.2rem; }
    .res-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; 
        h5 { margin: 0; font-size: 0.85rem; font-weight: 900; text-transform: uppercase; color: #eee; display: flex; align-items: center; gap: 0.6rem; i { color: var(--accent); font-size: 0.8rem; } }
        .res-count { background: #222; color: #fff; font-size: 0.7rem; font-weight: 900; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    }

    .res-list { display: flex; flex-direction: column; gap: 0.6rem; }
    .res-item { background: #0a0a0a; border: 1px solid #1a1a1a; padding: 0.8rem 1rem; display: flex; justify-content: space-between; align-items: center; transition: 0.2s; &:hover { border-color: #333; } }
    .res-name { display: block; font-size: 0.85rem; font-weight: 700; color: #fff; margin-bottom: 0.2rem; }
    .res-meta { display: flex; gap: 0.6rem; }
    .res-tag { font-size: 0.6rem; color: var(--text-muted); background: #111; padding: 0.15rem 0.5rem; border: 1px solid #222; display: flex; align-items: center; gap: 0.3rem; }
    .pricing-tag { color: var(--accent); border-color: rgba(255, 215, 0, 0.3); font-weight: 700;
        &.free { color: #2ecc71; border-color: rgba(46, 204, 113, 0.3); }
    }

    .res-actions { display: flex; gap: 0.4rem; }
    .mini-btn { background: none; border: 1px solid #333; color: #666; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.75rem; transition: 0.2s; &:hover { color: var(--accent); border-color: var(--accent); } &.danger:hover { color: #ff4444; border-color: #ff4444; } }
    .res-empty { padding: 1.5rem; text-align: center; color: #444; font-size: 0.75rem; border: 1px dashed #222; }

    .empty-placeholder { padding: 5rem 2rem; text-align: center; border: 1px dashed #333; color: #555;
        i { font-size: 3rem; margin-bottom: 1.5rem; color: #222; }
        h4 { color: #fff; margin: 0 0 0.5rem; font-weight: 800; text-transform: uppercase; }
        p { margin-bottom: 2rem; font-size: 0.9rem; }
        .btn-primary { background: var(--accent); color: #000; border: none; padding: 1rem 2rem; font-weight: 900; text-transform: uppercase; cursor: pointer; }
    }

    .loading-state { padding: 5rem; display: flex; justify-content: center;
        .spinner-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--accent); font-weight: 800; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px;
            i { font-size: 2rem; }
        }
    }

    @media (max-width: 1024px) {
        .header-main { flex-direction: column; align-items: flex-start; gap: 1rem; }
        .quick-stats { width: 100%; border-top: 1px solid #222; padding-top: 1rem; justify-content: space-between; }
        .stat-group { border: none; padding: 0; }
    }

    @media (max-width: 768px) {
        .mgmt-section { padding: 1rem; }
        .section-header { flex-direction: column; gap: 1.5rem; }
        .header-actions { width: 100%; justify-content: space-between; }
        .quick-stats { flex-direction: column; align-items: flex-start; gap: 1rem; }
        .stat-group { width: 100%; justify-content: space-between; }
        .site-actions-bar { flex-direction: column; gap: 1.2rem; align-items: stretch; }
        .action-group { flex-direction: column; }
        .btn-edit-site { justify-content: center; }
    }

    .modal-layer { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
    .modal-window { width: 95%; max-width: 1000px; max-height: 90vh; overflow-y: auto; background: #000; border: 1px solid var(--accent); position: relative; }
  `]
})
export class InfrastructureManagerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private infraService = inject(InfrastructureService);
  private toastService = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  infraList = signal<InfrastructureData[]>([]);
  isLoading = signal(false);
  isAddingResource = signal(false);
  isEditingResource = signal(false);
  editData = signal<InfrastructureData | null>(null);
  expandedInfraId = signal<string | null>(null);

  toggleExpand(id: string) {
    this.expandedInfraId.update(current => current === id ? null : id);
  }

  isAddingClassroom = signal(false);
  isAddingComputerLab = signal(false);
  isAddingFacility = signal(false);
  selectedInfraId = signal<string | null>(null);
  editClassroomData = signal<Classroom | null>(null);
  editLabData = signal<ComputerLab | null>(null);
  editFacilityData = signal<OtherFacility | null>(null);

  formatAddress(address: any): string {
    if (typeof address === 'string') return address;
    if (!address) return '';
    return [address.addressLine1, address.city, address.state].filter(x => x).join(', ');
  }

  isFree(schedule: Classroom['availabilitySchedule'] | ComputerLab['availabilitySchedule'] | OtherFacility['availabilitySchedule']): boolean {
    if (!schedule || schedule.length === 0) return true;
    return schedule.every(s => !s.pricing || s.pricing.type === 'Free');
  }

  formatPricing(schedule: Classroom['availabilitySchedule'] | ComputerLab['availabilitySchedule'] | OtherFacility['availabilitySchedule']): string {
    if (!schedule || schedule.length === 0) return 'Free';

    const slotsWithPricing = schedule.filter(s => s.pricing && s.pricing.type !== 'Free');
    if (slotsWithPricing.length === 0) return 'Free';

    const types = new Set(slotsWithPricing.map(s => s.pricing!.type));
    if (types.size === 1) {
      const type = Array.from(types)[0];
      const amounts = new Set(slotsWithPricing.map(s => s.pricing!.amount));

      if (amounts.size === 1) {
        const amt = Array.from(amounts)[0];
        return type === 'Share' ? `${amt}% Share` : `₹${amt}/hr`;
      }
      return `Varies (${type})`;
    }

    return 'Varies by Slot';
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchInfrastructure();
    }
  }

  fetchInfrastructure() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isLoading.set(true);
    this.infraService.getInfrastructure()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: InfrastructureResponse) => {
          if (res.status && res.data) {
            const data = res.data as any;
            this.infraList.set(Array.isArray(data) ? data : [data]);
          }
        },
        error: (err: any) => {
          console.error('Failed to fetch infrastructure:', err);
        }
      });
  }

  toggleAddResource() {
    this.editData.set(null);
    this.isEditingResource.set(false);
    this.isAddingResource.update(v => !v);
  }

  editResource(infra: InfrastructureData) {
    this.editData.set(infra);
    this.isAddingResource.set(false);
    this.isEditingResource.set(true);
  }

  confirmDelete(type: string, id: string, infra: InfrastructureData) {
    if (confirm(`Are you sure you want to delete this ${type} item?`)) {
      this.deleteResource(type, id, infra);
    }
  }

  deleteResource(type: string, name: string, infra: InfrastructureData) {
    this.isLoading.set(true);

    if (type === 'classrooms') {
      // Find the classroom object to get its internal ID
      const classroom = (infra.classrooms as Classroom[]).find(c => c.name === name);
      const classroomId = classroom?._id || classroom?.id;

      if (!classroomId) {
        this.toastService.error('Could not identify classroom for deletion.');
        this.isLoading.set(false);
        return;
      }

      this.infraService.deleteClassroom(infra._id, classroomId)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: () => {
            this.toastService.success('Classroom deleted successfully!');
            this.fetchInfrastructure();
          },
          error: (err) => {
            console.error('Classroom delete failed:', err);
            this.toastService.error(err.error?.message || 'Failed to delete classroom.');
          }
        });
      return;
    }

    if (type === 'computerLabs') {
      const lab = (infra.computerLabs as ComputerLab[]).find(l => l.name === name);
      const labId = lab?._id || lab?.id;

      if (!labId) {
        this.toastService.error('Could not identify computer lab for deletion.');
        this.isLoading.set(false);
        return;
      }

      this.infraService.deleteComputerLab(infra._id, labId)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: () => {
            this.toastService.success('Computer lab deleted successfully!');
            this.fetchInfrastructure();
          },
          error: (err) => {
            console.error('Computer lab delete failed:', err);
            this.toastService.error(err.error?.message || 'Failed to delete computer lab.');
          }
        });
      return;
    }

    if (type === 'otherFacilities') {
      const facility = (infra.otherFacilities as OtherFacility[]).find(f => f.name === name);
      const facilityId = facility?._id || facility?.id;

      if (!facilityId) {
        this.toastService.error('Could not identify facility for deletion.');
        this.isLoading.set(false);
        return;
      }

      this.infraService.deleteFacility(infra._id, facilityId)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: () => {
            this.toastService.success('Facility deleted successfully!');
            this.fetchInfrastructure();
          },
          error: (err) => {
            console.error('Facility delete failed:', err);
            this.toastService.error(err.error?.message || 'Failed to delete facility.');
          }
        });
      return;
    }
  }

  confirmDeleteSite(infraId: string) {
    if (confirm('Are you sure you want to delete this entire site? This will remove all classrooms, labs, and facilities associated with it. This action cannot be undone.')) {
      this.deleteSite(infraId);
    }
  }

  deleteSite(infraId: string) {
    this.isLoading.set(true);
    this.infraService.deleteInfrastructure(infraId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.toastService.success('Infrastructure site deleted successfully!');
          this.fetchInfrastructure();
        },
        error: (err) => {
          console.error('Site delete failed:', err);
          this.toastService.error(err.error?.message || 'Failed to delete site.');
        }
      });
  }

  onFormClose() {
    this.isAddingResource.set(false);
    this.isEditingResource.set(false);
    this.editData.set(null);
    this.fetchInfrastructure();
  }

  toggleAddClassroom(infraId: string) {
    this.selectedInfraId.set(infraId);
    this.editClassroomData.set(null);
    this.isAddingClassroom.set(true);
  }

  editClassroom(classroom: Classroom, infraId: string) {
    this.selectedInfraId.set(infraId);
    this.editClassroomData.set(classroom);
    this.isAddingClassroom.set(true);
  }

  onClassroomFormClose() {
    this.isAddingClassroom.set(false);
    this.selectedInfraId.set(null);
    this.editClassroomData.set(null);
  }

  onClassroomSaved() {
    this.fetchInfrastructure();
  }

  toggleAddComputerLab(infraId: string) {
    this.selectedInfraId.set(infraId);
    this.editLabData.set(null);
    this.isAddingComputerLab.set(true);
  }

  editLab(lab: ComputerLab, infraId: string) {
    this.selectedInfraId.set(infraId);
    this.editLabData.set(lab);
    this.isAddingComputerLab.set(true);
  }

  onLabFormClose() {
    this.isAddingComputerLab.set(false);
    this.selectedInfraId.set(null);
    this.editLabData.set(null);
  }

  onLabSaved() {
    this.fetchInfrastructure();
  }

  toggleAddFacility(infraId: string) {
    this.selectedInfraId.set(infraId);
    this.editFacilityData.set(null);
    this.isAddingFacility.set(true);
  }

  editFacility(facility: OtherFacility, infraId: string) {
    this.selectedInfraId.set(infraId);
    this.editFacilityData.set(facility);
    this.isAddingFacility.set(true);
  }

  onFacilityFormClose() {
    this.isAddingFacility.set(false);
    this.selectedInfraId.set(null);
    this.editFacilityData.set(null);
  }

  onFacilitySaved() {
    this.fetchInfrastructure();
  }
}
