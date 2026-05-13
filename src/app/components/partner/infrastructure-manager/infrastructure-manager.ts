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
import { PartnerActivityComponent } from '../partner-activity/partner-activity';
import { PartnerService } from '../../../services/partner.service';
import { finalize } from 'rxjs';
@Component({
  selector: 'app-infrastructure-manager',
  standalone: true,
  imports: [CommonModule, InfrastructureFormComponent, ClassroomFormComponent, ComputerLabFormComponent, FacilityFormComponent, PartnerActivityComponent],
  template: `
    <div class="control-center">
      <!-- Dashboard Navigation -->
      <div class="cc-navigation">
          <div class="nav-brand">
              <i class="fas fa-shield-alt"></i>
              <span>Partner Control Center</span>
          </div>
          <div class="nav-tabs">
              <button class="nav-tab" [class.active]="activeTab() === 'inventory'" (click)="activeTab.set('inventory')">
                  <i class="fas fa-boxes"></i> Assets & Sites
              </button>
              <button class="nav-tab" [class.active]="activeTab() === 'bookings'" (click)="activeTab.set('bookings')">
                  <i class="fas fa-history"></i> 
                  Recent Bookings
                  @if (partnerService.requests().length > 0) { <span class="badge">{{ partnerService.requests().length }}</span> }
              </button>
              <button class="nav-tab" [class.active]="activeTab() === 'availability'" (click)="activeTab.set('availability')">
                  <i class="fas fa-calendar-check"></i> Availability Grid
              </button>
              <button class="nav-tab" [class.active]="activeTab() === 'monitor'" (click)="activeTab.set('monitor')">
                  <i class="fas fa-desktop"></i> Activity Monitor
              </button>
          </div>
      </div>

      <div class="cc-content animate-fade-in">
        
        <!-- ── TAB: INVENTORY ────────────────────────────────────────────── -->
        @if (activeTab() === 'inventory') {
        <div>
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
                    <span>Loading inventory...</span>
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
                                        </div>
                                    </div>

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
                                        </div>
                                    </div>

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
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            </div>
          }
        </div>
        }

        <!-- ── TAB: BOOKINGS ─────────────────────────────────────────────── -->
        @if (activeTab() === 'bookings') {
        <div>
            <div class="section-header">
                <div class="header-left">
                    <h3 class="section-title"><i class="fas fa-history"></i> Recent Booking Activity</h3>
                    <p class="section-subtitle">Track requested facility sessions from instructors.</p>
                </div>
                <div class="header-actions">
                  <span class="badge-success" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; text-transform: uppercase;"><i class="fas fa-bolt"></i> Auto-Approval Active</span>
                </div>
            </div>

            <div class="requests-grid">
                @for (req of partnerService.requests(); track req.sessionId) {
                <div class="request-card glass-card" style="border-left-color: #10b981;">
                    <div class="request-main">
                        <div class="req-header">
                            <span class="req-type-badge">{{ req.resourceType }}</span>
                            <span class="req-id">REF #{{ req.sessionId }}</span>
                        </div>
                        <h4 class="req-course">{{ req.courseName }}</h4>
                        <div class="req-details">
                            <div class="detail-item"><i class="fas fa-user-tie"></i> {{ req.teacherName }}</div>
                            <div class="detail-item"><i class="fas fa-calendar-day"></i> {{ req.date | date:'EEE, MMM d' }}</div>
                            <div class="detail-item"><i class="fas fa-clock"></i> {{ req.startTime }} - {{ req.endTime }}</div>
                            <div class="detail-item"><i class="fas fa-door-open"></i> {{ req.roomName }}</div>
                        </div>

                        <!-- Granular Slot Synchronization -->
                        @if (req.selectedSlots && req.selectedSlots.length > 0) {
                        <div class="req-slots-sync">
                            <label><i class="fas fa-layer-group"></i> Granular Slots</label>
                            <div class="sync-slot-grid">
                                @for (slot of req.selectedSlots; track slot) {
                                <span class="sync-slot-chip">{{ slot.split(':')[0] }}</span>
                                }
                            </div>
                        </div>
                        }
                    </div>
                    <div class="request-actions" style="grid-template-columns: 1fr;">
                        <button class="btn-cc-outline" style="color: #10b981; border-color: rgba(16, 185, 129, 0.3); cursor: default; justify-content: center;">
                           <i class="fas fa-check-circle" style="margin-right: 0.5rem;"></i> Auto-Approved
                        </button>
                    </div>
                </div>
                }

                @if (partnerService.requests().length === 0) {
                <div class="empty-placeholder">
                    <i class="fas fa-check-circle" style="color: #10b981; font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h4>All Caught Up!</h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem;">No recent booking activity found.</p>
                </div>
                }
            </div>
        </div>
        }

        <!-- ── TAB: AVAILABILITY ─────────────────────────────────────────── -->
        @if (activeTab() === 'availability') {
        <div>
            <div class="section-header">
                <div class="header-left">
                    <h3 class="section-title"><i class="fas fa-calendar-check"></i> Site Availability Grid</h3>
                    <p class="section-subtitle">Real-time control over hourly availability and room status</p>
                </div>
                <div class="header-actions">
                  <span class="status-indicator live">Real-time Mode</span>
                </div>
            </div>

            <div class="availability-grid-wrap">
                <table class="cc-table">
                    <thead>
                        <tr>
                            <th>Location / Asset</th>
                            <th>Status Now</th>
                            <th>Upcoming Slot</th>
                            <th>Quick Load</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        @for (infra of infraList(); track infra._id) {
                        <tr>
                            <td class="primary-cell">
                                <span class="loc-name">{{ infra.generalInfo.schoolName }}</span>
                                <span class="loc-sub">All Rooms</span>
                            </td>
                            <td><span class="badge badge-success">Operational</span></td>
                            <td>09:00 - 10:00</td>
                            <td>85%</td>
                            <td>
                                <button class="btn-cc-outline">
                                    <i class="fas fa-external-link-alt"></i> Manage Grid
                                </button>
                            </td>
                        </tr>
                        }
                    </tbody>
                </table>
                <div class="grid-placeholder">
                    <p><i class="fas fa-info-circle"></i> Selecting a room above will open the granular hourly grid for instant status overrides.</p>
                </div>
            </div>
        </div>
        }

        <!-- ── TAB: MONITOR ──────────────────────────────────────────────── -->
        @if (activeTab() === 'monitor') {
        <div>
            <app-partner-activity></app-partner-activity>
        </div>
        }

      </div>

      <!-- Existing Modals -->
      @if (isAddingClassroom() && selectedInfraId()) {
      <div class="modal-layer">
          <div class="modal-window"><app-classroom-form [infraId]="selectedInfraId()!" [editData]="editClassroomData() || undefined" (close)="onClassroomFormClose()"></app-classroom-form></div>
      </div>
      }
      @if (isAddingComputerLab() && selectedInfraId()) {
      <div class="modal-layer">
          <div class="modal-window"><app-computer-lab-form [infraId]="selectedInfraId()!" [editData]="editLabData() || undefined" (close)="onLabFormClose()"></app-computer-lab-form></div>
      </div>
      }
      @if (isAddingFacility() && selectedInfraId()) {
      <div class="modal-layer">
          <div class="modal-window"><app-facility-form [infraId]="selectedInfraId()!" [editData]="editFacilityData() || undefined" (close)="onFacilityFormClose()"></app-facility-form></div>
      </div>
      }
    </div>
  `,
  styles: [`
    :host { 
        --accent: #8b5cf6; 
        --accent-secondary: #3b82f6;
        --bg-card: rgba(25, 25, 35, 0.4); 
        --bg-header: rgba(15, 15, 20, 0.5); 
        --border-color: rgba(255, 255, 255, 0.08); 
        --text-muted: #9ca3af; 
    }
    
    .control-center { padding: 0; min-height: 100%; color: #fff; border-radius: 24px; background: rgba(10, 10, 15, 0.3); backdrop-filter: blur(10px); border: 1px solid var(--border-color); box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); overflow: hidden; }
    
    /* ── NAVIGATION ────────────────────────────────────────────────────── */
    .cc-navigation {
        display: flex; justify-content: space-between; align-items: center;
        background: var(--bg-header); border-bottom: 1px solid var(--border-color); padding: 0 1.5rem;
        position: sticky; top: 0; z-index: 100; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    }
    .nav-brand {
        display: flex; align-items: center; gap: 0.8rem;
        i { color: var(--accent); font-size: 1.2rem; background: linear-gradient(135deg, var(--accent), var(--accent-secondary)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        span { font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; font-size: 0.85rem; }
    }
    .nav-tabs { display: flex; gap: 0.5rem; }
    .nav-tab {
        background: transparent; border: none; border-bottom: 3px solid transparent;
        color: var(--text-muted); padding: 1.5rem 1rem; cursor: pointer;
        font-weight: 800; font-size: 0.75rem; text-transform: uppercase;
        display: flex; align-items: center; gap: 0.6rem; transition: 0.3s ease;
        position: relative;
        &:hover { color: #fff; }
        &.active { color: #fff; border-bottom-color: var(--accent); text-shadow: 0 0 10px rgba(139, 92, 246, 0.5); }
        .badge {
            background: linear-gradient(135deg, #f87171, #ef4444); color: #fff; border-radius: 12px;
            padding: 0.1rem 0.4rem; font-size: 0.65rem; font-weight: 800; border: 1px solid rgba(255,255,255,0.2);
            position: absolute; top: 0.8rem; right: -4px;
        }
    }

    .cc-content { padding: 2rem; }
    
    /* ── BOOKING REQUESTS / RECENT ACTIVITY ────────────────────────────── */
    .requests-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
    .request-card {
        background: var(--bg-card); border: 1px solid var(--border-color); padding: 1.5rem; border-radius: 20px;
        display: flex; flex-direction: column; justify-content: space-between; backdrop-filter: blur(12px); box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        transition: transform 0.3s ease, border-color 0.3s ease;
        &:hover { transform: translateY(-3px); border-color: rgba(16, 185, 129, 0.4); }
    }
    .req-header { display: flex; justify-content: space-between; margin-bottom: 1rem; }
    .req-type-badge { font-size: 0.65rem; font-weight: 900; background: rgba(139, 92, 246, 0.15); color: #c4b5fd; border: 1px solid rgba(139, 92, 246, 0.3); padding: 0.2rem 0.6rem; border-radius: 12px; text-transform: uppercase; }
    .req-id { font-size: 0.65rem; color: var(--text-muted); font-weight: 800; letter-spacing: 0.5px; }
    .req-course { font-size: 1.1rem; font-weight: 800; text-transform: uppercase; margin-bottom: 1.2rem; color: #fff; letter-spacing: 0.5px; }
    .req-details { display: grid; gap: 0.6rem; margin-bottom: 2rem; }
    .detail-item { font-size: 0.8rem; color: #888; display: flex; align-items: center; gap: 0.8rem; i { color: var(--accent); width: 14px; } }
    .request-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
    .btn-cc-primary { background: linear-gradient(135deg, var(--accent), var(--accent-secondary)); color: #fff; border: none; padding: 0.8rem; font-weight: 900; text-transform: uppercase; cursor: pointer; font-size: 0.75rem; border-radius: 12px; transition: transform 0.2s; &:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); } }
    .btn-cc-outline { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.8rem; font-weight: 800; text-transform: uppercase; cursor: pointer; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; border-radius: 12px; transition: 0.3s; &:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); } &.danger:hover { color: #f87171; border-color: rgba(248, 113, 113, 0.4); } }
    
    .req-slots-sync {
        margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05);
        label { display: block; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; color: var(--accent); margin-bottom: 0.6rem; letter-spacing: 0.5px; }
    }
    .sync-slot-grid { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .sync-slot-chip { 
        font-size: 0.65rem; font-weight: 800; color: #fff; background: rgba(139, 92, 246, 0.1); 
        border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 6px; padding: 0.2rem 0.5rem; 
    }

    /* ── UTILITIES ─────────────────────────────────────────────────────── */
    .section-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; }
    .section-title { font-size: 1.35rem; font-weight: 900; margin: 0; color: #fff; display: flex; align-items: center; gap: 1rem; text-transform: uppercase; letter-spacing: 1px; i { color: var(--accent); } }
    .section-subtitle { font-size: 0.8rem; color: var(--text-muted); margin: 0.3rem 0 0; }
    .btn-primary-sm { background: linear-gradient(135deg, var(--accent), var(--accent-secondary)); color: #fff; border: none; padding: 0.7rem 1.2rem; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; border-radius: 10px; transition: 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.2); &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4); } }
    .badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 4px 10px; font-size: 0.65rem; font-weight: 800; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; }
    .status-indicator { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #34d399; &.live::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 1.5s infinite; box-shadow: 0 0 10px rgba(16, 185, 129, 0.6); } }
    
    /* ── TABLES ────────────────────────────────────────────────────────── */
    .cc-table { width: 100%; border-collapse: collapse; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden; backdrop-filter: blur(12px); }
    .cc-table th { text-align: left; padding: 1.2rem; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; color: #cbd5e1; border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.2); }
    .cc-table td { padding: 1.2rem; font-size: 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .loc-name { display: block; font-weight: 800; color: #fff; }
    .loc-sub { font-size: 0.7rem; color: var(--text-muted); }
    .grid-placeholder { padding: 2rem; background: rgba(139, 92, 246, 0.05); border: 1px dashed rgba(139, 92, 246, 0.3); margin-top: 1rem; border-radius: 16px; text-align: center; color: #c4b5fd; font-size: 0.85rem; font-weight: 600; }

    /* Glass Effect */
    .glass-card { background: rgba(255,255,255,0.02); backdrop-filter: blur(16px); }
    @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }

    /* Reuse existing manager styles */
    .infra-container { display: flex; flex-direction: column; gap: 1.2rem; }
    .infra-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; position: relative; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(16px);
        &:hover { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.03); }
        &.expanded { border-color: rgba(139, 92, 246, 0.5); box-shadow: 0 10px 40px rgba(0,0,0,0.2); background: rgba(30, 30, 45, 0.5); }
    }
    .card-header { padding: 1.5rem; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; }
    .header-main { display: flex; align-items: center; gap: 2rem; flex: 1; }
    .school-brand { display: flex; align-items: center; gap: 1.2rem; min-width: 250px; }
    .brand-icon { width: 56px; height: 56px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2)); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: #c4b5fd; }
    .school-name { font-size: 1.25rem; font-weight: 800; margin: 0; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }
    .school-address { font-size: 0.75rem; color: var(--text-muted); margin: 0.4rem 0 0; display: flex; align-items: center; gap: 0.4rem; font-weight: 600; }
    .quick-stats { display: flex; align-items: center; gap: 2rem; }
    .stat-pill { background: rgba(255,255,255,0.03); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; color: #cbd5e1; display: flex; align-items: center; gap: 0.6rem; border: 1px solid rgba(255,255,255,0.08); }
    .stat-group { display: flex; gap: 1.5rem; padding-left: 1.5rem; border-left: 1px solid rgba(255,255,255,0.1); }
    .stat { display: flex; flex-direction: column; align-items: center;
        .count { font-size: 1.2rem; font-weight: 900; color: #fff; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .label { font-size: 0.65rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-top: 0.3rem; letter-spacing: 0.5px; }
    }
    .card-content { max-height: 0; overflow: hidden; visibility: hidden; transition: all 0.4s ease-in-out; background: rgba(0,0,0,0.2);
        &.show { max-height: 2500px; visibility: visible; }
    }
    .content-inner { padding: 1.5rem; border-top: 1px solid rgba(255,255,255,0.04); }
    .site-actions-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1.2rem; border-bottom: 1px dashed rgba(255,255,255,0.08); }
    .action-group { display: flex; gap: 0.8rem; }
    .site-danger-zone { display: flex; gap: 0.8rem; align-items: center; }
    .btn-action { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; padding: 0.7rem 1.2rem; font-size: 0.75rem; font-weight: 800; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 0.6rem; transition: 0.3s; &:hover { border-color: var(--accent); color: #fff; background: rgba(139, 92, 246, 0.1); } }
    .btn-edit-site { background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); color: #c4b5fd; padding: 0.7rem 1.2rem; font-size: 0.75rem; font-weight: 800; border-radius: 12px; cursor: pointer; text-transform: uppercase; display: flex; align-items: center; gap: 0.6rem; transition: 0.3s; &:hover { background: var(--accent); color: #fff; } }
    .btn-delete-site { background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.3); color: #fca5a5; padding: 0.7rem 1.2rem; font-size: 0.75rem; font-weight: 800; border-radius: 12px; cursor: pointer; text-transform: uppercase; display: flex; align-items: center; gap: 0.6rem; transition: 0.3s; &:hover { background: #ef4444; color: #fff; } }
    .resource-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .resource-section { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 1.5rem; }
    .res-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; 
        h5 { margin: 0; font-size: 0.9rem; font-weight: 800; text-transform: uppercase; color: #cbd5e1; display: flex; align-items: center; gap: 0.8rem; i { color: #8b5cf6; font-size: 1rem; } }
    }
    .res-list { display: flex; flex-direction: column; gap: 0.8rem; }
    .res-item { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; transition: 0.2s; &:hover { border-color: rgba(139, 92, 246, 0.4); background: rgba(255,255,255,0.04); } }
    .res-name { display: block; font-size: 0.95rem; font-weight: 800; color: #fff; margin-bottom: 0.4rem; letter-spacing: 0.5px; }
    .res-meta { display: flex; gap: 0.6rem; flex-wrap: wrap; }
    .res-tag { font-size: 0.65rem; color: #9ca3af; background: rgba(0,0,0,0.4); padding: 0.2rem 0.6rem; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; display: flex; align-items: center; gap: 0.4rem; font-weight: 700; text-transform: uppercase; }
    .pricing-tag { color: #a78bfa; border-color: rgba(139, 92, 246, 0.3); background: rgba(139, 92, 246, 0.1); &.free { color: #34d399; border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.1); } }
    .res-actions { display: flex; gap: 0.6rem; }
    .mini-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.8rem; transition: 0.2s; &:hover { color: #fff; background: rgba(139, 92, 246, 0.6); border-color: #8b5cf6; } &.danger:hover { color: #fff; background: rgba(239, 68, 68, 0.8); border-color: #ef4444; } }

    @media (max-width: 768px) {
        .control-center { border-radius: 16px; }
        .mgmt-section { padding: 1rem; }
        .section-header { flex-direction: column; gap: 1.5rem; }
        .header-actions { width: 100%; justify-content: space-between; }
        .quick-stats { flex-direction: column; align-items: flex-start; gap: 1rem; }
        .stat-group { width: 100%; justify-content: space-between; }
        .site-actions-bar { flex-direction: column; gap: 1.2rem; align-items: stretch; }
        .action-group { flex-direction: column; }
        .btn-edit-site { justify-content: center; }
    }

    .modal-layer { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.9); z-index: 2000; backdrop-filter: blur(5px); }
    .modal-window { width: 95%; max-width: 1000px; max-height: 90vh; overflow-y: auto; background: #000; border: 1px solid var(--accent); position: relative; }
  `]
})
export class InfrastructureManagerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private infraService = inject(InfrastructureService);
  private toastService = inject(ToastService);
  private platformId = inject(PLATFORM_ID);
  public partnerService = inject(PartnerService);

  infraList = signal<InfrastructureData[]>([]);
  isLoading = signal(false);
  activeTab = signal<'inventory' | 'bookings' | 'availability' | 'monitor'>('inventory');
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
    return schedule.every(day =>
      !day.slots || day.slots.every(slot => !slot.pricing || slot.pricing.type === 'Free')
    );
  }

  formatPricing(schedule: Classroom['availabilitySchedule'] | ComputerLab['availabilitySchedule'] | OtherFacility['availabilitySchedule']): string {
    if (!schedule || schedule.length === 0) return 'Free';

    const allSlots = schedule.flatMap(day => day.slots || []);
    const slotsWithPricing = allSlots.filter(s => s.pricing && s.pricing.type !== 'Free');

    if (slotsWithPricing.length === 0) return 'Free';

    const types = new Set(slotsWithPricing.map(s => s.pricing.type));
    if (types.size === 1) {
      const type = Array.from(types)[0];
      const amounts = new Set(slotsWithPricing.map(s => s.pricing.amount));

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
