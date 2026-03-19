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
        <h3 class="section-title"><i class="fas fa-building"></i> Infrastructure & Venues</h3>
        @if (!isAddingResource() && !isEditingResource()) {
            <div class="header-actions">
                @if (infraList().length > 0) {
                    <button class="btn-danger-sm" (click)="confirmReset()"><i class="fas fa-trash-alt"></i> Reset All</button>
                }
                <button class="btn-outline-sm" (click)="toggleAddResource()">Add Site</button>
            </div>
        }
      </div>

      @if (isAddingResource() || isEditingResource()) {
        <app-infrastructure-form [initialData]="editData()" (close)="onFormClose()"></app-infrastructure-form>
      } @else if (isLoading()) {
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i> Loading infrastructure...
        </div>
      } @else {
        <div class="infra-list-container">
            @for (infra of infraList(); track infra._id) {
                <div class="site-group">
                    <div class="site-header">
                        <div class="site-info">
                            <h4 class="site-name">{{ infra.generalInfo.schoolName }}</h4>
                            <p class="site-address">{{ infra.generalInfo.address }}</p>
                        </div>
                        <div class="site-actions">
                            <button class="btn-outline-sm" (click)="toggleAddClassroom(infra._id)"><i class="fas fa-plus"></i> Add Classroom</button>
                            <button class="btn-outline-sm" (click)="toggleAddComputerLab(infra._id)"><i class="fas fa-plus"></i> Add Lab</button>
                            <button class="btn-outline-sm" (click)="toggleAddFacility(infra._id)"><i class="fas fa-plus"></i> Add Facility</button>
                            <button class="btn-outline-sm" (click)="editResource(infra)"><i class="fas fa-edit"></i> Edit Site</button>
                        </div>
                    </div>

                    <div class="infra-list">
                        <!-- Classrooms -->
                        @for (item of infra.classrooms; track item.name) {
                            <div class="infra-item">
                                <div class="infra-main">
                                    <div class="infra-type-icon">🏫</div>
                                    <div class="infra-info">
                                        <h4 class="infra-name">{{ item.name }} - {{ item.type }}</h4>
                                        <div class="infra-tags">
                                            <span class="tag">Capacity: {{ item.capacity }}</span>
                                            <span class="tag">{{ item.primaryUsage }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="infra-actions">
                                    <button class="icon-btn" (click)="editClassroom(item, infra._id)"><i class="fas fa-edit"></i></button>
                                    <button class="icon-btn danger" (click)="confirmDelete('classrooms', item.name, infra)"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                        }

                        <!-- Labs -->
                        @for (item of infra.computerLabs; track item.name) {
                            <div class="infra-item">
                                <div class="infra-main">
                                    <div class="infra-type-icon">🧪</div>
                                    <div class="infra-info">
                                        <h4 class="infra-name">{{ item.name }}</h4>
                                        <div class="infra-tags">
                                            <span class="tag">Workstations: {{ item.workstations }}</span>
                                            <span class="tag">{{ item.internetSpeed }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="infra-actions">
                                    <button class="icon-btn" (click)="editLab(item, infra._id)"><i class="fas fa-edit"></i></button>
                                    <button class="icon-btn danger" (click)="confirmDelete('computerLabs', item.name, infra)"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                        }

                        <!-- Other Facilities -->
                        @for (item of infra.otherFacilities; track item.name) {
                            <div class="infra-item">
                                <div class="infra-main">
                                    <div class="infra-type-icon">🏗️</div>
                                    <div class="infra-info">
                                        <h4 class="infra-name">{{ item.name }} - {{ item.type }}</h4>
                                        <div class="infra-tags">
                                            <span class="tag">Capacity: {{ item.capacity }}</span>
                                            <span class="tag">{{ item.type }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="infra-actions">
                                    <button class="icon-btn" (click)="editFacility(item, infra._id)"><i class="fas fa-edit"></i></button>
                                    <button class="icon-btn danger" (click)="confirmDelete('otherFacilities', item.name, infra)"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            }

            @if (infraList().length === 0) {
                <div class="empty-state">No infrastructure found. Click "Add Site" to create one.</div>
            }
        </div>
      }

      @if (isAddingClassroom() && selectedInfraId()) {
        <div class="modal-backdrop">
          <div class="modal-content">
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
        <div class="modal-backdrop">
          <div class="modal-content">
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
        <div class="modal-backdrop">
          <div class="modal-content">
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
    .mgmt-section { padding: 2.5rem; background: #010101;  border-radius: 0; margin-bottom: 0.5rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; i { color: var(--accent-primary); } }
    
    .infra-list-container { display: flex; flex-direction: column; gap: 2.5rem; }
    .site-group { border-top: 1px solid #333; padding-top: 1.5rem; }
    .site-group:first-child { border-top: none; padding-top: 0; }
    .site-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .site-name { font-size: 1.1rem; font-weight: 800; color: var(--accent-primary); margin: 0 0 0.25rem; text-transform: uppercase; }
    .site-address { font-size: 0.8rem; color: #888; margin: 0; }
    
    .infra-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .infra-item {
      background: #050505; border: 1px solid var(--row-border); border-radius: 0;
      padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; transition: 0.2s;
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
    .icon-btn { background: none; border: 1px solid var(--row-border); color: var(--text-secondary); width: 34px; height: 34px; border-radius: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; transition: 0.2s; 
        &:hover { color: var(--accent-primary); border-color: var(--accent-primary); }
        &.danger:hover { color: #ff4d4d; border-color: #ff4d4d; }
    }
    .btn-outline-sm { background: #000000; border: 1px solid var(--accent-primary); color: var(--text-primary); padding: 0.6rem 1.25rem; border-radius: 0; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; &:hover { background: var(--accent-primary); color: #000000; } }
    .btn-danger-sm { background: transparent; border: 1px solid #ff4d4d; color: #ff4d4d; padding: 0.6rem 1.25rem; border-radius: 0; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; &:hover { background: #ff4d4d; color: #fff; } }
    .header-actions { display: flex; gap: 1rem; align-items: center; }
    
    .loading-state, .empty-state { padding: 2rem; text-align: center; color: #888; font-size: 0.9rem; border: 1px dashed #333; }

    @media (max-width: 768px) {
      .mgmt-section { padding: 1.5rem; }
      .section-header { flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem; }
      .infra-item { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .infra-main { flex: unset; width: 100%; }
      .infra-capacity { display: flex; align-items: center; gap: 0.75rem; text-align: left;
        .cap-val { font-size: 1.2rem; }
        .cap-label { margin: 0; }
      }
      .infra-actions { align-self: flex-end; }
    }

    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal-content { width: 100%; max-width: 900px; max-height: 90vh; overflow-y: auto; background: #000; border: 1px solid var(--accent-primary); }

    @media (max-width: 480px) {
      .mgmt-section { padding: 1rem; }
      .section-title { font-size: 1rem; letter-spacing: 1px; }
      .modal-content { max-width: 95%; max-height: 95vh; }
    }
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

  isAddingClassroom = signal(false);
  isAddingComputerLab = signal(false);
  isAddingFacility = signal(false);
  selectedInfraId = signal<string | null>(null);
  editClassroomData = signal<Classroom | null>(null);
  editLabData = signal<ComputerLab | null>(null);
  editFacilityData = signal<OtherFacility | null>(null);

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

  confirmReset() {
      if (confirm('CRITICAL: This will permanently delete ALL infrastructure and venue records for your institution. This action cannot be undone. Are you sure?')) {
          this.resetInfrastructure();
      }
  }

  resetInfrastructure() {
      // This resets ALL infrastructures. 
      // In a multi-infra scenario, we might want to delete just one site, 
      // but 'Reset All' should probably delete everything of the partner.
      // However, the current deleteInfrastructure takes an ID.
      // We'll loop through all and delete them, or just delete the first one if that's the logic.
      // For now, let's keep it simple and delete all sites.
      
      const ids = this.infraList().map(i => i._id);
      if (ids.length === 0) return;

      this.isLoading.set(true);
      // We can't easily do parallel deletes with the current service without more logic,
      // so we'll just delete the first one for now or rethink this.
      // Actually, let's just delete the one by one or assume a backend "Reset All" exists.
      // Since we don't have "Reset All" in backend, we'll just delete them.
      
      const deleteNext = (index: number) => {
          if (index >= ids.length) {
              this.infraList.set([]);
              this.isLoading.set(false);
              this.fetchInfrastructure();
              return;
          }
          this.infraService.deleteInfrastructure(ids[index]).subscribe({
              next: () => deleteNext(index + 1),
              error: (err) => {
                  console.error('Reset failed at index', index, err);
                  this.isLoading.set(false);
              }
          });
      };

      deleteNext(0);
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
