import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../components/layout/layout';

// ── Data interfaces ────────────────────────────────────────────────────────
interface CampLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  pinCode: string;
  distance: number;
  slotsAvailable: number;
}

interface HealthCamp {
  id: number;
  name: string;
  specialty: string;
  mode: 'Online' | 'Offline';
  date: string;
  time: string;
  duration: string;
  doctor: string;
  description: string;
  totalSlots: number;
  bookedSlots: number;
  tags: string[];
  meetLink?: string;
  locations?: CampLocation[];
}

@Component({
  selector: 'app-health-connect',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="hc-page">

        <!-- ── Hero ─────────────────────────────────────────────── -->
        <div class="hc-hero">
          <div class="hero-label">Ceekul Health Connect</div>
          <h1 class="hero-title">Your Automated Path to<br>Care &amp; Well-being</h1>
          <p class="hero-desc">Digital convenience or in-person support — we guide your health journey from initial care to cure, with automated processes ensuring accuracy every step of the way.</p>

          <!-- Main Tab Bar -->
          <div class="main-tabs">
            <button class="main-tab" [class.active]="activePage() === 'care'" (click)="activePage.set('care')">
              Care Registration
            </button>
            <button class="main-tab" [class.active]="activePage() === 'camps'" (click)="activePage.set('camps')">
              Health Camps
              <span class="tab-badge">{{ camps.length }}</span>
            </button>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             PAGE: HEALTH CAMPS
        ══════════════════════════════════════════════════════════ -->
        <div *ngIf="activePage() === 'camps'">

          <!-- Filters Bar -->
          <div class="camps-filters">
            <div class="filter-search">
              <input type="text" class="fi" [(ngModel)]="campSearch" placeholder="Search camp name, specialty, doctor...">
            </div>
            <div class="filter-row-inline">
              <div class="filter-pill-group">
                <span class="filter-lbl">Mode</span>
                <button class="fpill" [class.on]="campModeFilter === 'All'" (click)="campModeFilter = 'All'">All</button>
                <button class="fpill online" [class.on]="campModeFilter === 'Online'" (click)="campModeFilter = 'Online'">Online</button>
                <button class="fpill offline" [class.on]="campModeFilter === 'Offline'" (click)="campModeFilter = 'Offline'">Offline</button>
              </div>
              <div class="filter-pill-group">
                <span class="filter-lbl">Specialty</span>
                <button class="fpill" [class.on]="campSpecFilter === s"
                  *ngFor="let s of campSpecialties" (click)="campSpecFilter = s">{{ s }}</button>
              </div>
              <div class="filter-pill-group">
                <span class="filter-lbl">City</span>
                <button class="fpill" [class.on]="campCityFilter === c"
                  *ngFor="let c of campCities" (click)="campCityFilter = c">{{ c }}</button>
              </div>
            </div>
          </div>

          <!-- Results Header -->
          <div class="camps-result-header">
            <span class="result-count">{{ filteredCamps().length }} camps available</span>
            <span class="result-hint">* Slots update in real time</span>
          </div>

          <!-- Camp Cards Grid -->
          <div class="camps-grid" *ngIf="filteredCamps().length > 0">
            <div class="camp-card" *ngFor="let camp of filteredCamps()"
              [class.online-card]="camp.mode === 'Online'"
              [class.offline-card]="camp.mode === 'Offline'">

              <!-- Card Top -->
              <div class="cc-top">
                <div class="cc-mode-badge" [class.online]="camp.mode === 'Online'" [class.offline]="camp.mode === 'Offline'">
                  {{ camp.mode }}
                </div>
                <div class="cc-slots" [class.full]="slotsLeft(camp) === 0" [class.low]="slotsLeft(camp) > 0 && slotsLeft(camp) <= 5">
                  {{ slotsLeft(camp) === 0 ? 'Full' : slotsLeft(camp) + ' slots left' }}
                </div>
              </div>

              <!-- Camp Info -->
              <h3 class="cc-name">{{ camp.name }}</h3>
              <span class="cc-specialty">{{ camp.specialty }}</span>

              <div class="cc-meta-grid">
                <div class="cc-meta-item">
                  <span class="cc-meta-lbl">Date</span>
                  <span class="cc-meta-val">{{ camp.date }}</span>
                </div>
                <div class="cc-meta-item">
                  <span class="cc-meta-lbl">Time</span>
                  <span class="cc-meta-val">{{ camp.time }}</span>
                </div>
                <div class="cc-meta-item">
                  <span class="cc-meta-lbl">Duration</span>
                  <span class="cc-meta-val">{{ camp.duration }}</span>
                </div>
                <div class="cc-meta-item">
                  <span class="cc-meta-lbl">Doctor</span>
                  <span class="cc-meta-val">{{ camp.doctor }}</span>
                </div>
              </div>

              <p class="cc-desc">{{ camp.description }}</p>

              <!-- Tags -->
              <div class="cc-tags">
                <span class="cc-tag" *ngFor="let t of camp.tags">{{ t }}</span>
              </div>

              <!-- Slots bar -->
              <div class="slots-bar-wrap">
                <div class="slots-bar-fill" [style.width.%]="(camp.bookedSlots / camp.totalSlots) * 100"
                  [class.warn]="slotsLeft(camp) <= 5"></div>
              </div>
              <span class="slots-text">{{ camp.bookedSlots }} / {{ camp.totalSlots }} registered</span>

              <!-- Online: meeting info -->
              <div class="online-info" *ngIf="camp.mode === 'Online'">
                <span class="online-info-lbl">Secure Video Link</span>
                <span class="online-info-val">Shared after registration confirmation</span>
              </div>

              <!-- Offline: Locations Accordion -->
              <div class="offline-locations" *ngIf="camp.mode === 'Offline' && camp.locations">
                <div class="loc-header" (click)="toggleLocations(camp.id)">
                  <span class="loc-header-title">{{ camp.locations.length }} Locations Available</span>
                  <span class="loc-toggle">{{ openLocationsCamp === camp.id ? '▲' : '▼' }}</span>
                </div>
                <div class="loc-list" *ngIf="openLocationsCamp === camp.id">
                  <div class="loc-row" *ngFor="let loc of camp.locations"
                    [class.sel]="getSelectedLocation(camp.id) === loc.id"
                    (click)="selectLocation(camp.id, loc.id)">
                    <div class="loc-pick">
                      <span class="loc-radio" [class.on]="getSelectedLocation(camp.id) === loc.id"></span>
                    </div>
                    <div class="loc-body">
                      <span class="loc-name">{{ loc.name }}</span>
                      <span class="loc-addr">{{ loc.address }}, {{ loc.city }} — {{ loc.pinCode }}</span>
                      <span class="loc-dist">{{ loc.distance }} km away</span>
                    </div>
                    <div class="loc-slots" [class.low]="loc.slotsAvailable <= 3">
                      {{ loc.slotsAvailable }} slots
                    </div>
                  </div>
                </div>
              </div>

              <!-- Register / Registered state -->
              <div class="cc-footer">
                <ng-container *ngIf="!registeredCamps.has(camp.id)">
                  <button class="btn-register"
                    [disabled]="slotsLeft(camp) === 0 || (camp.mode === 'Offline' && !getSelectedLocation(camp.id))"
                    (click)="openRegistration(camp)">
                    {{ slotsLeft(camp) === 0 ? 'Camp Full' : 'Register Now' }}
                  </button>
                  <span class="register-hint" *ngIf="camp.mode === 'Offline' && !getSelectedLocation(camp.id) && slotsLeft(camp) > 0">
                    Select a location above to register
                  </span>
                </ng-container>
                <div class="registered-badge" *ngIf="registeredCamps.has(camp.id)">
                  Registered — Confirmation sent to your email
                </div>
              </div>

            </div>
          </div>

          <div class="empty-state" *ngIf="filteredCamps().length === 0">
            <p>No camps match your filters. Try adjusting mode, specialty or city.</p>
          </div>

          <!-- ── Registration Modal ──────────────────────────────── -->
          <div class="modal-backdrop" *ngIf="registrationModal" (click)="closeModal()">
            <div class="modal-box" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <div>
                  <span class="modal-tag">{{ selectedCamp?.mode }}</span>
                  <h3 class="modal-title">{{ selectedCamp?.name }}</h3>
                  <p class="modal-sub">{{ selectedCamp?.date }} &nbsp;·&nbsp; {{ selectedCamp?.time }}</p>
                </div>
                <button class="modal-close" (click)="closeModal()">✕</button>
              </div>

              <!-- Offline: chosen location summary -->
              <div class="modal-location-summary" *ngIf="selectedCamp?.mode === 'Offline' && selectedCamp?.id !== undefined">
                <span class="modal-loc-lbl">Selected Location</span>
                <span class="modal-loc-val">{{ getLocationName(selectedCamp!.id) }}</span>
              </div>

              <!-- Online: meeting info -->
              <div class="modal-online-info" *ngIf="selectedCamp?.mode === 'Online'">
                A secure video meeting link will be sent to your registered email 30 minutes before the camp begins. Ensure your camera and microphone are working.
              </div>

              <div class="modal-form">
                <div class="form-grid modal-grid">
                  <div class="fg">
                    <label class="fl req">Full Name</label>
                    <input type="text" class="fi" [(ngModel)]="regName" name="regName" placeholder="Your full name">
                  </div>
                  <div class="fg">
                    <label class="fl req">Phone Number</label>
                    <input type="tel" class="fi" [(ngModel)]="regPhone" name="regPhone" placeholder="+91 XXXXX XXXXX">
                  </div>
                  <div class="fg">
                    <label class="fl req">Email Address</label>
                    <input type="email" class="fi" [(ngModel)]="regEmail" name="regEmail" placeholder="your@email.com">
                  </div>
                  <div class="fg">
                    <label class="fl">Age</label>
                    <input type="number" class="fi" [(ngModel)]="regAge" name="regAge" placeholder="Age in years" min="1" max="120">
                  </div>
                  <div class="fg span-full">
                    <label class="fl">Notes for Doctor <span class="opt-tag">Optional</span></label>
                    <textarea class="fta" [(ngModel)]="regNotes" name="regNotes" rows="3"
                      placeholder="Any specific concerns, conditions or questions for the camp doctor..."></textarea>
                  </div>
                  <div class="fg span-full">
                    <label class="checkbox-row">
                      <input type="checkbox" [(ngModel)]="regConsent" name="regConsent">
                      <span class="cb-label">I confirm the details above are accurate and consent to Ceekul Health Connect sharing them with the camp medical team.</span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn-cancel" (click)="closeModal()">Cancel</button>
                <button class="btn-confirm" [disabled]="!regName || !regPhone || !regEmail || !regConsent"
                  (click)="confirmRegistration()">
                  Confirm Registration
                </button>
              </div>
            </div>
          </div>

        </div><!-- /camps page -->


        <!-- ══════════════════════════════════════════════════════════
             PAGE: CARE REGISTRATION FORM
        ══════════════════════════════════════════════════════════ -->
        <div *ngIf="activePage() === 'care'">

          <!-- Progress track -->
          <div class="progress-track">
            <div class="progress-step" [class.done]="userType !== ''" [class.active]="userType === ''">
              <span class="step-num">01</span><span class="step-lbl">Account</span>
            </div>
            <div class="progress-step" [class.done]="emergencyContactName !== ''" [class.active]="userType !== '' && emergencyContactName === ''">
              <span class="step-num">02</span><span class="step-lbl">Health Profile</span>
            </div>
            <div class="progress-step" [class.done]="hasInsurance !== ''" [class.active]="emergencyContactName !== '' && hasInsurance === ''">
              <span class="step-num">03</span><span class="step-lbl">Insurance</span>
            </div>
            <div class="progress-step" [class.done]="careModePreference !== ''" [class.active]="hasInsurance !== '' && careModePreference === ''">
              <span class="step-num">04</span><span class="step-lbl">Care Request</span>
            </div>
            <div class="progress-step" [class.done]="consentAutomatedReminders">
              <span class="step-num">05</span><span class="step-lbl">Notifications</span>
            </div>
            <div class="progress-step">
              <span class="step-num">06</span><span class="step-lbl">Feedback</span>
            </div>
          </div>

          <form class="hc-form" (ngSubmit)="handleSubmit()" #healthForm="ngForm">

            <!-- PART 1 -->
            <div class="form-section">
              <div class="section-header">
                <span class="part-tag">Part 01</span>
                <h2 class="section-title">Account Setup &amp; Basic Information</h2>
                <p class="section-desc">New users — Complete your account registration to begin your health journey.</p>
              </div>
              <div class="form-grid">
                <div class="fg span-full">
                  <label class="fl req">I am registering as</label>
                  <div class="radio-card-group">
                    <label class="radio-card" [class.sel]="userType === 'individual'">
                      <input type="radio" name="userType" value="individual" [(ngModel)]="userType">
                      <div class="rc-body"><span class="rc-title">Individual Seeking Personal Care</span><span class="rc-sub">Register yourself for health services</span></div>
                    </label>
                    <label class="radio-card" [class.sel]="userType === 'caregiver'">
                      <input type="radio" name="userType" value="caregiver" [(ngModel)]="userType">
                      <div class="rc-body"><span class="rc-title">Caregiver Enrolling a Dependent</span><span class="rc-sub">Enroll a child, elderly parent, or dependent</span></div>
                    </label>
                  </div>
                </div>
                <div class="fg"><label class="fl req">Email Address</label><input type="email" class="fi" [(ngModel)]="email" name="email" placeholder="your@email.com" required><span class="fh">Used for account creation and notifications</span></div>
                <div class="fg"><label class="fl req">Phone Number</label><input type="tel" class="fi" [(ngModel)]="phone" name="phone" placeholder="+91 98765 43210" required><span class="fh">Include country code for SMS alerts</span></div>
                <div class="fg"><label class="fl req">Password</label><input type="password" class="fi" [(ngModel)]="password" name="password" placeholder="Create a strong password" required><span class="fh">Min 8 characters, include symbols and numbers</span></div>
                <div class="fg"><label class="fl req">Confirm Password</label><input type="password" class="fi" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Re-enter your password" required></div>
                <div class="fg span-full">
                  <label class="checkbox-row">
                    <input type="checkbox" [(ngModel)]="termsAgreed" name="termsAgreed" required>
                    <span class="cb-label">I have read, understood, and agree to the <a href="#" class="hc-link">Terms of Service and Privacy Policy</a>, including data handling, consent for treatment, and financial agreements.</span>
                  </label>
                </div>
              </div>

              <div class="sub-section" *ngIf="userType === 'individual'">
                <h3 class="sub-title">Personal Details</h3>
                <div class="form-grid">
                  <div class="fg"><label class="fl req">Full Legal Name</label><input type="text" class="fi" [(ngModel)]="fullLegalName" name="fullLegalName" placeholder="As per official documents" required></div>
                  <div class="fg"><label class="fl req">Date of Birth</label><input type="date" class="fi" [(ngModel)]="dateOfBirth" name="dateOfBirth" required></div>
                  <div class="fg"><label class="fl req">Gender</label><select class="fs" [(ngModel)]="gender" name="gender" required><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select></div>
                  <div class="fg"><label class="fl req">Preferred Language</label><select class="fs" [(ngModel)]="preferredLanguage" name="preferredLanguage" required><option value="">Select language</option><option>Hindi</option><option>English</option><option>Tamil</option><option>Telugu</option><option>Bengali</option><option>Marathi</option><option>Kannada</option><option>Other</option></select></div>
                  <div class="fg"><label class="fl req">Country of Residence</label><select class="fs" [(ngModel)]="countryOfResidence" name="countryOfResidence" required><option value="">Select country</option><option>India</option><option>United States</option><option>United Kingdom</option><option>Canada</option><option>Other</option></select></div>
                  <div class="fg span-full"><label class="fl req">Current Address</label><textarea class="fta" [(ngModel)]="currentAddress" name="currentAddress" rows="3" placeholder="Full address including area, city, pin code..." required></textarea><span class="fh">Used to find nearby health centers</span></div>
                </div>
              </div>

              <div class="sub-section" *ngIf="userType === 'caregiver'">
                <h3 class="sub-title">Caregiver Details</h3>
                <div class="form-grid">
                  <div class="fg"><label class="fl req">Caregiver Full Legal Name</label><input type="text" class="fi" [(ngModel)]="caregiverFullName" name="caregiverFullName" placeholder="Your full name" required></div>
                  <div class="fg"><label class="fl req">Relationship to Dependent</label><input type="text" class="fi" [(ngModel)]="caregiverRelationship" name="caregiverRelationship" placeholder="e.g. Parent, Spouse, Guardian" required></div>
                </div>
                <h3 class="sub-title">Dependent's Details</h3>
                <div class="form-grid">
                  <div class="fg"><label class="fl req">Dependent's Full Legal Name</label><input type="text" class="fi" [(ngModel)]="dependentFullName" name="dependentFullName" placeholder="As per official documents" required></div>
                  <div class="fg"><label class="fl req">Dependent's Date of Birth</label><input type="date" class="fi" [(ngModel)]="dependentDOB" name="dependentDOB" required></div>
                  <div class="fg"><label class="fl req">Dependent's Gender</label><select class="fs" [(ngModel)]="dependentGender" name="dependentGender" required><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select></div>
                  <div class="fg"><label class="fl req">Dependent's Preferred Language</label><select class="fs" [(ngModel)]="dependentLanguage" name="dependentLanguage" required><option value="">Select language</option><option>Hindi</option><option>English</option><option>Tamil</option><option>Telugu</option><option>Bengali</option><option>Other</option></select></div>
                  <div class="fg"><label class="fl req">Dependent's Country of Residence</label><select class="fs" [(ngModel)]="dependentCountry" name="dependentCountry" required><option value="">Select country</option><option>India</option><option>United States</option><option>United Kingdom</option><option>Canada</option><option>Other</option></select></div>
                  <div class="fg span-full"><label class="fl req">Dependent's Current Address</label><textarea class="fta" [(ngModel)]="dependentAddress" name="dependentAddress" rows="3" placeholder="Full current address of dependent..." required></textarea></div>
                  <div class="fg span-full">
                    <label class="fl req">Proof of Guardianship</label>
                    <div class="file-zone"><input type="file" class="file-inp" id="guardDoc" accept=".pdf,.jpg,.jpeg,.png"><label for="guardDoc" class="file-lbl"><span class="file-main">Click to upload legal document</span><span class="file-hint">PDF, JPG, PNG — Max 5 MB</span></label></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- PART 2 -->
            <div class="form-section">
              <div class="section-header">
                <span class="part-tag">Part 02</span>
                <h2 class="section-title">Health Profile &amp; Medical History</h2>
                <p class="section-desc">Automated pre-screening — Your information helps us provide accurate, personalised care.</p>
              </div>
              <div class="form-grid">
                <div class="fg span-full"><label class="fl">Known Allergies</label><div class="chip-group"><button type="button" class="chip" [class.on]="isIn(knownAllergies, opt)" *ngFor="let opt of allergyOpts" (click)="toggle(knownAllergies, opt)">{{ opt }}</button></div></div>
                <div class="fg span-full"><label class="fl">Current Medications</label><textarea class="fta" [(ngModel)]="currentMedications" name="currentMedications" rows="3" placeholder="List all current medications, dosage, and frequency..."></textarea></div>
                <div class="fg span-full"><label class="fl">Chronic Conditions</label><div class="chip-group"><button type="button" class="chip" [class.on]="isIn(chronicConditions, opt)" *ngFor="let opt of chronicOpts" (click)="toggle(chronicConditions, opt)">{{ opt }}</button></div></div>
                <div class="fg span-full"><label class="fl">Past Surgeries &amp; Hospitalizations</label><textarea class="fta" [(ngModel)]="pastSurgeries" name="pastSurgeries" rows="3" placeholder="Briefly describe dates and reasons..."></textarea></div>
                <div class="fg span-full"><label class="fl">Family Medical History</label><div class="chip-group"><button type="button" class="chip" [class.on]="isIn(familyHistory, opt)" *ngFor="let opt of familyHistoryOpts" (click)="toggle(familyHistory, opt)">{{ opt }}</button></div></div>
                <div class="fg"><label class="fl">Smoking Status</label><div class="pill-group"><label class="pill" [class.on]="smokingStatus === v" *ngFor="let v of ['Never','Former','Current']"><input type="radio" [name]="'smokingStatus'" [value]="v" [(ngModel)]="smokingStatus"> {{ v }}</label></div></div>
                <div class="fg"><label class="fl">Alcohol Consumption</label><div class="pill-group"><label class="pill" [class.on]="alcoholConsumption === v" *ngFor="let v of ['Never','Socially','Regularly','Heavy']"><input type="radio" [name]="'alcoholConsumption'" [value]="v" [(ngModel)]="alcoholConsumption"> {{ v }}</label></div></div>
                <div class="fg"><label class="fl">Physical Activity Level</label><select class="fs" [(ngModel)]="physicalActivityLevel" name="physicalActivityLevel"><option value="">Select level</option><option>Sedentary</option><option>Lightly Active</option><option>Moderately Active</option><option>Very Active</option></select></div>
                <div class="fg span-full"><label class="fl">Vaccination Status <span class="opt-tag">Optional</span></label><textarea class="fta" [(ngModel)]="vaccinationStatus" name="vaccinationStatus" rows="2" placeholder="e.g. Flu 2023, COVID-19 full series, Hepatitis B..."></textarea></div>
                <div class="fg span-full"><label class="fl">Upload Existing Medical Records <span class="opt-tag">Optional</span></label><div class="file-zone"><input type="file" class="file-inp" id="medRecords" accept=".pdf,.jpg,.jpeg,.png" multiple><label for="medRecords" class="file-lbl"><span class="file-main">Upload lab reports, doctor's notes, prescriptions</span><span class="file-hint">PDF, DICOM, JPEG — Max 20 MB</span></label></div></div>
                <div class="section-divider span-full"></div>
                <div class="divider-label span-full">Emergency Contact</div>
                <div class="fg"><label class="fl req">Emergency Contact Name</label><input type="text" class="fi" [(ngModel)]="emergencyContactName" name="emergencyContactName" placeholder="Full name" required></div>
                <div class="fg"><label class="fl req">Emergency Contact Phone</label><input type="tel" class="fi" [(ngModel)]="emergencyContactPhone" name="emergencyContactPhone" placeholder="+91 XXXXX XXXXX" required></div>
                <div class="fg"><label class="fl req">Relationship to You</label><input type="text" class="fi" [(ngModel)]="emergencyContactRelationship" name="emergencyContactRelationship" placeholder="e.g. Spouse, Parent, Sibling" required></div>
              </div>
            </div>

            <!-- PART 3 -->
            <div class="form-section">
              <div class="section-header">
                <span class="part-tag">Part 03</span>
                <h2 class="section-title">Insurance &amp; Financial Information</h2>
                <p class="section-desc">Automated billing &amp; claims — Provide your insurance details for seamless processing.</p>
              </div>
              <div class="form-grid">
                <div class="fg span-full"><label class="fl req">Do you have health insurance?</label>
                  <div class="radio-card-group">
                    <label class="radio-card" [class.sel]="hasInsurance === 'yes'"><input type="radio" name="hasInsurance" value="yes" [(ngModel)]="hasInsurance"><div class="rc-body"><span class="rc-title">Yes, I have health insurance</span><span class="rc-sub">I will provide my policy details below</span></div></label>
                    <label class="radio-card" [class.sel]="hasInsurance === 'no'"><input type="radio" name="hasInsurance" value="no" [(ngModel)]="hasInsurance"><div class="rc-body"><span class="rc-title">No, I do not have health insurance</span><span class="rc-sub">I will choose a payment method below</span></div></label>
                  </div>
                </div>
                <ng-container *ngIf="hasInsurance === 'yes'">
                  <div class="fg"><label class="fl req">Insurance Provider</label><input type="text" class="fi" [(ngModel)]="insuranceProvider" name="insuranceProvider" placeholder="e.g. Star Health, HDFC ERGO" required></div>
                  <div class="fg"><label class="fl req">Policy Number</label><input type="text" class="fi" [(ngModel)]="policyNumber" name="policyNumber" placeholder="Your policy number" required></div>
                  <div class="fg"><label class="fl">Group Number <span class="opt-tag">Optional</span></label><input type="text" class="fi" [(ngModel)]="groupNumber" name="groupNumber" placeholder="Employer / group number"></div>
                  <div class="fg span-full"><label class="fl req">Upload Insurance Card</label><div class="file-zone"><input type="file" class="file-inp" id="insCard" accept=".jpg,.jpeg,.png,.pdf"><label for="insCard" class="file-lbl"><span class="file-main">Upload front and back of insurance card</span><span class="file-hint">JPG, PNG, PDF — Max 2 MB</span></label></div></div>
                  <div class="fg span-full"><label class="checkbox-row"><input type="checkbox" [(ngModel)]="consentToBillInsurance" name="consentToBillInsurance" required><span class="cb-label">I authorize Ceekul Health Connect to directly bill my insurance provider for eligible services on my behalf.</span></label></div>
                </ng-container>
                <ng-container *ngIf="hasInsurance === 'no'">
                  <div class="fg span-full"><label class="fl req">Preferred Payment Method</label>
                    <div class="radio-card-group four-col">
                      <label class="radio-card sm" [class.sel]="paymentMethodPreference === v.val" *ngFor="let v of paymentMethods"><input type="radio" name="paymentMethodPreference" [value]="v.val" [(ngModel)]="paymentMethodPreference"><div class="rc-body"><span class="rc-title">{{ v.label }}</span></div></label>
                    </div>
                  </div>
                  <div class="fg span-full" *ngIf="paymentMethodPreference === 'aid'"><label class="fl">Briefly explain your financial assistance need <span class="opt-tag">Optional</span></label><textarea class="fta" [(ngModel)]="financialAidRequestBrief" name="financialAidRequestBrief" rows="4" placeholder="Explain your need for financial assistance or a payment plan..."></textarea></div>
                </ng-container>
              </div>
            </div>

            <!-- PART 4 -->
            <div class="form-section">
              <div class="section-header">
                <span class="part-tag">Part 04</span>
                <h2 class="section-title">Seeking Care — Initial Request</h2>
                <p class="section-desc">Automated triage &amp; scheduling — Describe your symptoms and choose how you'd like to receive care.</p>
              </div>
              <div class="form-grid">
                <div class="fg span-full"><label class="fl req">Care Mode Preference</label>
                  <div class="radio-card-group">
                    <label class="radio-card" [class.sel]="careModePreference === 'online'"><input type="radio" name="careModePreference" value="online" [(ngModel)]="careModePreference"><div class="rc-body"><span class="rc-title">Online Consultation</span><span class="rc-sub">Telemedicine — Video / Audio from home</span></div></label>
                    <label class="radio-card" [class.sel]="careModePreference === 'inperson'"><input type="radio" name="careModePreference" value="inperson" [(ngModel)]="careModePreference"><div class="rc-body"><span class="rc-title">In-Person Visit</span><span class="rc-sub">Visit a nearby Ceekul Health Center</span></div></label>
                    <label class="radio-card" [class.sel]="careModePreference === 'hometest'"><input type="radio" name="careModePreference" value="hometest" [(ngModel)]="careModePreference"><div class="rc-body"><span class="rc-title">At-Home Testing / Kit Delivery</span><span class="rc-sub">Get a testing or monitoring kit delivered</span></div></label>
                  </div>
                </div>
                <div class="fg span-full"><label class="fl req">Reason for Visit</label><textarea class="fta" [(ngModel)]="reasonForVisit" name="reasonForVisit" rows="5" placeholder="Describe your symptoms, concerns, or reason for seeking care (max 500 words)..." required></textarea></div>
                <div class="fg span-full"><label class="fl">Symptom List</label><div class="chip-group"><button type="button" class="chip" [class.on]="isIn(symptomList, opt)" *ngFor="let opt of symptomOpts" (click)="toggle(symptomList, opt)">{{ opt }}</button></div></div>
                <div class="fg"><label class="fl req">Symptom Start Date</label><input type="date" class="fi" [(ngModel)]="symptomStartDate" name="symptomStartDate" required></div>
                <div class="fg"><label class="fl req">Symptom Severity</label><select class="fs" [(ngModel)]="symptomSeverity" name="symptomSeverity" required><option value="">Select severity</option><option value="mild">Mild — Not disrupting daily life</option><option value="moderate">Moderate — Affecting daily activities</option><option value="severe">Severe — Significantly limiting function</option><option value="critical">Critical — Requires urgent attention</option></select></div>
                <div class="fg"><label class="fl">Upload Symptom Photos <span class="opt-tag">Optional</span></label><div class="file-zone compact"><input type="file" class="file-inp" id="symPhotos" accept=".jpg,.jpeg,.png" multiple><label for="symPhotos" class="file-lbl"><span class="file-main">Upload rash, injury or other photos</span><span class="file-hint">JPEG, PNG — Max 5 MB</span></label></div></div>

                <ng-container *ngIf="careModePreference === 'online'">
                  <div class="conditional-banner span-full">Online Consultation — Additional Details</div>
                  <div class="fg"><label class="fl">Preferred Consultation Time</label><input type="datetime-local" class="fi" [(ngModel)]="preferredConsultationTime" name="preferredConsultationTime"><span class="fh">Multiple dates can be selected during confirmation</span></div>
                  <div class="fg"><label class="fl">Doctor Gender Preference</label><select class="fs" [(ngModel)]="doctorGenderPreference" name="doctorGenderPreference"><option value="">No Preference</option><option>Male</option><option>Female</option></select></div>
                  <div class="fg"><label class="fl">Specialty Preference <span class="opt-tag">Optional</span></label><select class="fs" [(ngModel)]="specialtyPreference" name="specialtyPreference"><option value="">Any Specialty</option><option>General Physician</option><option>Pediatrician</option><option>Dermatologist</option><option>Psychologist</option><option>Cardiologist</option><option>Orthopedist</option><option>Other</option></select></div>
                </ng-container>

                <ng-container *ngIf="careModePreference === 'inperson'">
                  <div class="conditional-banner span-full">In-Person Visit — Additional Details</div>
                  <div class="fg span-full"><label class="checkbox-row"><input type="checkbox" [(ngModel)]="locationAccess" name="locationAccess"><span class="cb-label">Allow Ceekul Health Connect to use my current location to find the nearest center.</span></label></div>
                  <div class="fg" *ngIf="!locationAccess"><label class="fl">Preferred Center Location</label><input type="text" class="fi" [(ngModel)]="preferredCenterLocation" name="preferredCenterLocation" placeholder="Search by city or pin code"></div>
                  <div class="fg"><label class="fl">Preferred In-Person Time</label><input type="datetime-local" class="fi" [(ngModel)]="preferredInPersonTime" name="preferredInPersonTime"></div>
                  <div class="fg"><label class="fl">Doctor Gender Preference</label><select class="fs" [(ngModel)]="doctorGenderPreferenceInPerson" name="doctorGenderPreferenceInPerson"><option value="">No Preference</option><option>Male</option><option>Female</option></select></div>
                  <div class="fg"><label class="fl">Specialty Preference <span class="opt-tag">Optional</span></label><select class="fs" [(ngModel)]="specialtyPreferenceInPerson" name="specialtyPreferenceInPerson"><option value="">Any Specialty</option><option>General Physician</option><option>Pediatrician</option><option>Dermatologist</option><option>Psychologist</option><option>Cardiologist</option><option>Orthopedist</option><option>Other</option></select></div>
                </ng-container>

                <ng-container *ngIf="careModePreference === 'hometest'">
                  <div class="conditional-banner span-full">At-Home Testing Kit — Additional Details</div>
                  <div class="fg"><label class="fl req">Kit Type Requested</label><select class="fs" [(ngModel)]="kitTypeRequested" name="kitTypeRequested" required><option value="">Select kit type</option><option>Blood Pressure Monitor</option><option>Glucose Meter</option><option>Basic Blood Test Kit</option><option>STI Test</option><option>Pregnancy Test</option><option>Genetic Test</option><option>Other</option></select></div>
                  <div class="fg span-full"><label class="fl">Delivery Address <span class="opt-tag">If different from current address</span></label><textarea class="fta" [(ngModel)]="deliveryAddress" name="deliveryAddress" rows="3" placeholder="Enter full delivery address..."></textarea></div>
                  <div class="fg span-full"><label class="checkbox-row"><input type="checkbox" [(ngModel)]="confirmSelfTest" name="confirmSelfTest" required><span class="cb-label">I understand that I am responsible for performing the test accurately and uploading results as instructed, and that a professional review is required for interpretation.</span></label></div>
                </ng-container>
              </div>
            </div>

            <!-- PART 5 -->
            <div class="form-section">
              <div class="section-header">
                <span class="part-tag">Part 05</span>
                <h2 class="section-title">Real-time Support &amp; Notifications</h2>
                <p class="section-desc">Automated &amp; human-assisted — Stay connected with reminders and real-time support.</p>
              </div>
              <div class="form-grid">
                <div class="fg span-full"><label class="fl req">Notification Preferences</label><div class="chip-group"><button type="button" class="chip" [class.on]="isIn(notificationPreference, opt)" *ngFor="let opt of notificationOpts" (click)="toggle(notificationPreference, opt)">{{ opt }}</button></div></div>
                <div class="fg span-full"><label class="checkbox-row"><input type="checkbox" [(ngModel)]="consentAutomatedReminders" name="consentAutomatedReminders" required><span class="cb-label">I consent to receive automated reminders for appointments, medication, and follow-ups. <span class="req-mark">Required</span></span></label></div>
                <div class="fg span-full"><label class="checkbox-row"><input type="checkbox" [(ngModel)]="consentHealthTips" name="consentHealthTips"><span class="cb-label">I would like to receive general health tips and updates from Ceekul Health Connect. <span class="opt-tag">Optional</span></span></label></div>
                <div class="fg span-full"><div class="action-btn-row"><button type="button" class="action-btn">Access 24/7 Live Chat Support</button><button type="button" class="action-btn">Browse AI-Powered FAQ Database</button></div></div>
              </div>
            </div>

            <!-- PART 6 -->
            <div class="form-section">
              <div class="section-header">
                <span class="part-tag">Part 06</span>
                <h2 class="section-title">Continuous Feedback &amp; Improvement</h2>
                <p class="section-desc">Help us improve Ceekul Health Connect through your valuable feedback.</p>
              </div>
              <div class="form-grid">
                <div class="fg span-full"><label class="checkbox-row"><input type="checkbox" [(ngModel)]="optInForSurveys" name="optInForSurveys"><span class="cb-label">I would like to provide feedback through periodic surveys to help improve Ceekul Health Connect. <span class="opt-tag">Optional</span></span></label></div>
                <div class="fg span-full"><button type="button" class="action-btn">Submit Anonymous Feedback</button></div>
              </div>
            </div>

            <!-- Submit -->
            <div class="hc-submit-wrap">
              <div class="submit-notice">By submitting, you confirm all information provided is accurate and consent to Ceekul Health Connect processing your data in accordance with the Privacy Policy.</div>
              <button type="submit" class="submit-btn">Start My Health Journey with Ceekul Health Connect</button>
            </div>

          </form>
        </div><!-- /care page -->

      </div>
    </app-layout>
  `,
  styles: [`
    .hc-page { max-width: 1100px; margin: 0 auto; padding: 0 0 4rem; }

    /* ── Hero ──────────────────────────────────────────────────────── */
    .hc-hero { padding: 3rem 2rem 0; background: #000; }
    .hero-label { font-size: 0.62rem; font-weight: 900; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 3px; margin-bottom: 0.75rem; }
    .hero-title { font-size: clamp(1.5rem, 3.5vw, 2.5rem); font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 1px; line-height: 1.15; margin: 0 0 0.75rem; }
    .hero-desc { font-size: 0.85rem; color: color-mix(in srgb, #fff, transparent 60%); line-height: 1.6; max-width: 640px; margin-bottom: 2rem; }

    /* ── Main Tab Bar ───────────────────────────────────────────────── */
    .main-tabs {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--row-border);
      margin-top: 1rem;
    }
    .main-tab {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: color-mix(in srgb, #fff, transparent 60%);
      padding: 0.9rem 1.75rem;
      font-size: 0.78rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      cursor: pointer;
      transition: 0.2s;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-family: inherit;
      &:hover { color: #fff; }
      &.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
    }
    .tab-badge {
      background: var(--accent-primary);
      color: #000;
      font-size: 0.6rem;
      font-weight: 900;
      padding: 0.1rem 0.45rem;
      min-width: 18px;
      text-align: center;
    }

    /* ── Camps Filter Bar ───────────────────────────────────────────── */
    .camps-filters {
      padding: 1.5rem 2rem;
      background: #050505;
      border: 1px solid var(--row-border);
      border-top: none;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .filter-search .fi { width: 100%; }
    .filter-row-inline { display: flex; flex-wrap: wrap; gap: 1.25rem; align-items: flex-start; }
    .filter-pill-group { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; }
    .filter-lbl { font-size: 0.6rem; font-weight: 900; color: color-mix(in srgb, #fff, transparent 70%); text-transform: uppercase; letter-spacing: 1px; margin-right: 0.25rem; }
    .fpill {
      padding: 0.35rem 0.85rem;
      border: 1px solid var(--row-border);
      background: #000;
      color: color-mix(in srgb, #fff, transparent 65%);
      font-size: 0.68rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: 0.2s;
      font-family: inherit;
      &:hover { color: #fff; border-color: color-mix(in srgb, #fff, transparent 70%); }
      &.on { background: color-mix(in srgb, #fff, transparent 92%); color: #fff; border-color: color-mix(in srgb, #fff, transparent 60%); }
      &.online.on { background: color-mix(in srgb, #3b82f6, transparent 85%); color: #60a5fa; border-color: #60a5fa; }
      &.offline.on { background: color-mix(in srgb, #10b981, transparent 85%); color: #34d399; border-color: #34d399; }
    }

    /* ── Results header ─────────────────────────────────────────────── */
    .camps-result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 2rem;
      border: 1px solid var(--row-border);
      border-top: none;
      background: #030303;
    }
    .result-count { font-size: 0.7rem; font-weight: 900; color: color-mix(in srgb, #fff, transparent 50%); text-transform: uppercase; letter-spacing: 1px; }
    .result-hint { font-size: 0.62rem; color: color-mix(in srgb, #fff, transparent 80%); font-weight: 600; }

    /* ── Camps Grid ─────────────────────────────────────────────────── */
    .camps-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0;
      border: 1px solid var(--row-border);
      border-top: none;
    }
    @media (min-width: 640px) { .camps-grid { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 1024px) { .camps-grid { grid-template-columns: 1fr 1fr 1fr; } }

    /* ── Camp Card ──────────────────────────────────────────────────── */
    .camp-card {
      background: #050505;
      border-right: 1px solid var(--row-border);
      border-bottom: 1px solid var(--row-border);
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: 0.2s;
      &:hover { background: #080808; }
      &.online-card { border-top: 2px solid #3b82f6; }
      &.offline-card { border-top: 2px solid #10b981; }
    }

    .cc-top { display: flex; justify-content: space-between; align-items: center; }
    .cc-mode-badge {
      font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px;
      padding: 0.25rem 0.65rem; border: 1px solid;
      &.online { color: #60a5fa; border-color: #3b82f6; background: color-mix(in srgb, #3b82f6, transparent 90%); }
      &.offline  { color: #34d399; border-color: #10b981; background: color-mix(in srgb, #10b981, transparent 90%); }
    }
    .cc-slots {
      font-size: 0.65rem; font-weight: 900; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px;
      &.low  { color: #f59e0b; }
      &.full { color: color-mix(in srgb, #fff, transparent 75%); }
    }

    .cc-name { font-size: 0.95rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; line-height: 1.3; }
    .cc-specialty { font-size: 0.68rem; font-weight: 800; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 1px; }

    .cc-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.6rem 1rem;
    }
    .cc-meta-item { display: flex; flex-direction: column; gap: 0.15rem; }
    .cc-meta-lbl { font-size: 0.58rem; font-weight: 900; color: color-mix(in srgb, #fff, transparent 75%); text-transform: uppercase; letter-spacing: 1px; }
    .cc-meta-val { font-size: 0.78rem; font-weight: 700; color: color-mix(in srgb, #fff, transparent 20%); }

    .cc-desc { font-size: 0.75rem; color: color-mix(in srgb, #fff, transparent 60%); line-height: 1.5; margin: 0; }

    .cc-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .cc-tag { font-size: 0.58rem; font-weight: 900; color: color-mix(in srgb, #fff, transparent 70%); border: 1px solid color-mix(in srgb, #fff, transparent 90%); padding: 0.15rem 0.5rem; text-transform: uppercase; letter-spacing: 0.4px; }

    /* Slots progress bar */
    .slots-bar-wrap { height: 3px; background: color-mix(in srgb, #fff, transparent 93%); position: relative; }
    .slots-bar-fill { height: 100%; background: #10b981; transition: width 0.4s; &.warn { background: #f59e0b; } }
    .slots-text { font-size: 0.62rem; color: color-mix(in srgb, #fff, transparent 75%); font-weight: 700; }

    /* Online info */
    .online-info {
      background: color-mix(in srgb, #3b82f6, transparent 92%);
      border-left: 2px solid #3b82f6;
      padding: 0.65rem 0.9rem;
    }
    .online-info-lbl { display: block; font-size: 0.58rem; font-weight: 900; color: #60a5fa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.25rem; }
    .online-info-val { font-size: 0.72rem; color: color-mix(in srgb, #fff, transparent 50%); font-weight: 600; }

    /* Offline Locations */
    .offline-locations {
      border: 1px solid color-mix(in srgb, #10b981, transparent 75%);
      background: color-mix(in srgb, #10b981, transparent 96%);
    }
    .loc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.7rem 1rem;
      cursor: pointer;
      &:hover { background: color-mix(in srgb, #10b981, transparent 94%); }
    }
    .loc-header-title { font-size: 0.65rem; font-weight: 900; color: #34d399; text-transform: uppercase; letter-spacing: 1px; }
    .loc-toggle { font-size: 0.6rem; color: rgba(255,255,255,0.3); }

    .loc-list { border-top: 1px solid color-mix(in srgb, #10b981, transparent 85%); }
    .loc-row {
      display: flex;
      gap: 0.75rem;
      padding: 0.8rem 1rem;
      border-bottom: 1px solid color-mix(in srgb, #fff, transparent 96%);
      cursor: pointer;
      transition: 0.15s;
      &:last-child { border-bottom: none; }
      &:hover { background: color-mix(in srgb, #fff, transparent 97%); }
      &.sel { background: color-mix(in srgb, #10b981, transparent 92%); }
    }
    .loc-pick { padding-top: 2px; }
    .loc-radio {
      display: block;
      width: 14px;
      height: 14px;
      border: 2px solid color-mix(in srgb, #fff, transparent 80%);
      border-radius: 50%;
      transition: 0.15s;
      &.on { border-color: #10b981; background: #10b981; box-shadow: 0 0 0 3px color-mix(in srgb, #10b981, transparent 80%); }
    }
    .loc-body { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
    .loc-name { font-size: 0.78rem; font-weight: 800; color: #fff; }
    .loc-addr { font-size: 0.65rem; color: color-mix(in srgb, #fff, transparent 60%); font-weight: 600; }
    .loc-dist { font-size: 0.6rem; color: color-mix(in srgb, #fff, transparent 75%); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .loc-slots {
      font-size: 0.65rem; font-weight: 900; color: #10b981; text-transform: uppercase;
      align-self: flex-start; padding-top: 2px; white-space: nowrap;
      &.low { color: #f59e0b; }
    }

    /* Card Footer */
    .cc-footer { display: flex; flex-direction: column; gap: 0.5rem; margin-top: auto; }
    .btn-register {
      width: 100%;
      background: #000;
      border: 1px solid var(--accent-primary);
      color: #fff;
      padding: 0.75rem;
      font-size: 0.78rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      transition: 0.2s;
      font-family: inherit;
      &:hover:not(:disabled) { background: var(--accent-primary); color: #000; }
      &:disabled { border-color: color-mix(in srgb, #fff, transparent 90%); color: color-mix(in srgb, #fff, transparent 80%); cursor: not-allowed; background: #000; }
    }
    .register-hint { font-size: 0.62rem; color: color-mix(in srgb, #fff, transparent 75%); font-weight: 700; text-align: center; }
    .registered-badge {
      background: color-mix(in srgb, #10b981, transparent 88%);
      border: 1px solid #10b981;
      color: #34d399;
      padding: 0.65rem 1rem;
      font-size: 0.7rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: center;
    }

    /* Empty state */
    .empty-state {
      padding: 3rem 2rem;
      border: 1px solid var(--row-border);
      border-top: none;
      text-align: center;
      p { font-size: 0.82rem; color: color-mix(in srgb, #fff, transparent 70%); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    }

    /* ── Registration Modal ─────────────────────────────────────────── */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: color-mix(in srgb, #000, transparent 15%);
      z-index: 5000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-box {
      background: #080808;
      border: 1px solid var(--row-border);
      width: 100%;
      max-width: 680px;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.75rem 2rem 1.25rem;
      border-bottom: 1px solid var(--row-border);
      position: sticky;
      top: 0;
      background: #080808;
      z-index: 1;
    }
    .modal-tag { display: inline-block; font-size: 0.58rem; font-weight: 900; color: var(--accent-primary); border: 1px solid var(--accent-primary); padding: 0.1rem 0.5rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 0.5rem; }
    .modal-title { font-size: 1.1rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 0.25rem; }
    .modal-sub { font-size: 0.72rem; color: color-mix(in srgb, #fff, transparent 60%); font-weight: 700; }
    .modal-close { background: transparent; border: 1px solid var(--row-border); color: color-mix(in srgb, #fff, transparent 50%); width: 32px; height: 32px; cursor: pointer; font-size: 0.8rem; flex-shrink: 0; transition: 0.2s; &:hover { border-color: #fff; color: #fff; } }

    .modal-location-summary {
      margin: 1.25rem 2rem 0;
      padding: 0.9rem 1.1rem;
      background: color-mix(in srgb, #10b981, transparent 92%);
      border-left: 3px solid #10b981;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .modal-loc-lbl { font-size: 0.6rem; font-weight: 900; color: #34d399; text-transform: uppercase; letter-spacing: 1px; }
    .modal-loc-val { font-size: 0.85rem; font-weight: 800; color: #fff; }

    .modal-online-info {
      margin: 1.25rem 2rem 0;
      padding: 0.9rem 1.1rem;
      background: color-mix(in srgb, #3b82f6, transparent 92%);
      border-left: 3px solid #3b82f6;
      font-size: 0.78rem;
      color: color-mix(in srgb, #fff, transparent 45%);
      line-height: 1.6;
      font-weight: 600;
    }

    .modal-form { padding: 1.5rem 2rem; }
    .modal-grid { grid-template-columns: 1fr 1fr !important; }
    @media (max-width: 500px) { .modal-grid { grid-template-columns: 1fr !important; } }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.25rem 2rem;
      border-top: 1px solid var(--row-border);
      position: sticky;
      bottom: 0;
      background: #080808;
    }
    .btn-cancel { background: transparent; border: 1px solid var(--row-border); color: color-mix(in srgb, #fff, transparent 50%); padding: 0.7rem 1.4rem; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; cursor: pointer; transition: 0.2s; font-family: inherit; &:hover { border-color: #fff; color: #fff; } }
    .btn-confirm { background: var(--accent-primary); border: 1px solid var(--accent-primary); color: #000; padding: 0.7rem 1.8rem; font-size: 0.78rem; font-weight: 900; text-transform: uppercase; cursor: pointer; transition: 0.2s; font-family: inherit; &:hover:not(:disabled) { background: #fff; border-color: #fff; } &:disabled { opacity: 0.35; cursor: not-allowed; } }

    /* ── Progress Track ─────────────────────────────────────────────── */
    .progress-track { display: flex; flex-wrap: wrap; border: 1px solid var(--row-border); border-top: none; }
    .progress-step { flex: 1; min-width: 70px; padding: 0.75rem 1rem; display: flex; flex-direction: column; gap: 0.2rem; border-right: 1px solid var(--row-border); transition: 0.2s; &:last-child { border-right: none; } }
    .step-num { font-size: 0.62rem; font-weight: 900; color: color-mix(in srgb, #fff, transparent 80%); letter-spacing: 1px; }
    .step-lbl { font-size: 0.65rem; font-weight: 800; color: color-mix(in srgb, #fff, transparent 80%); text-transform: uppercase; letter-spacing: 0.5px; }
    .progress-step.active { background: color-mix(in srgb, #fff, transparent 97%); .step-num { color: var(--accent-primary); } .step-lbl { color: #fff; } }
    .progress-step.done { background: color-mix(in srgb, #10b981, transparent 94%); .step-num { color: #10b981; } .step-lbl { color: color-mix(in srgb, #fff, transparent 50%); } }

    /* ── Form Base ──────────────────────────────────────────────────── */
    .hc-form { display: flex; flex-direction: column; gap: 0; }
    .form-section { background: #050505; border: 1px solid var(--row-border); border-top: none; padding: 2.5rem 2rem; }
    .section-header { margin-bottom: 2rem; }
    .part-tag { display: inline-block; font-size: 0.58rem; font-weight: 900; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 3px; border: 1px solid var(--accent-primary); padding: 0.2rem 0.6rem; margin-bottom: 0.75rem; }
    .section-title { font-size: clamp(0.95rem, 2.5vw, 1.35rem); font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 0.4rem; }
    .section-desc { font-size: 0.8rem; color: color-mix(in srgb, #fff, transparent 62%); line-height: 1.5; margin: 0; }
    .sub-section { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--row-border); }
    .sub-title { font-size: 0.72rem; font-weight: 900; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 2px; margin: 0 0 1.25rem; }

    /* ── 3-Col Grid ─────────────────────────────────────────────────── */
    .form-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
    @media (min-width: 600px) { .form-grid { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 1024px) { .form-grid { grid-template-columns: 1fr 1fr 1fr; } }
    .span-full { grid-column: 1 / -1; }

    /* ── Fields ─────────────────────────────────────────────────────── */
    .fg { display: flex; flex-direction: column; gap: 0.4rem; }
    .fl { font-size: 0.62rem; font-weight: 900; color: color-mix(in srgb, #fff, transparent 62%); text-transform: uppercase; letter-spacing: 1px; }
    .fl.req::after { content: " *"; color: var(--accent-primary); }
    .fh { font-size: 0.6rem; color: color-mix(in srgb, #fff, transparent 82%); font-weight: 600; }
    .fi { background: #000; border: 1px solid var(--row-border); color: #fff; padding: 0.72rem 1rem; font-size: 0.86rem; font-weight: 600; outline: none; width: 100%; transition: border-color 0.2s; font-family: inherit; &:focus { border-color: var(--accent-primary); } &::placeholder { color: color-mix(in srgb, #fff, transparent 87%); font-weight: 500; } }
    .fs { background: #000; border: 1px solid var(--row-border); color: #fff; padding: 0.72rem 1rem; font-size: 0.86rem; font-weight: 600; outline: none; width: 100%; cursor: pointer; transition: border-color 0.2s; font-family: inherit; appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='color-mix(in srgb, #fff, transparent 70%)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; &:focus { border-color: var(--accent-primary); } option { background: #111; } }
    .fta { background: #000; border: 1px solid var(--row-border); color: #fff; padding: 0.72rem 1rem; font-size: 0.86rem; font-weight: 600; outline: none; width: 100%; resize: vertical; transition: border-color 0.2s; font-family: inherit; line-height: 1.6; &:focus { border-color: var(--accent-primary); } &::placeholder { color: color-mix(in srgb, #fff, transparent 87%); font-weight: 500; } }

    /* ── Radio Cards ────────────────────────────────────────────────── */
    .radio-card-group { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
    @media (min-width: 500px) { .radio-card-group { grid-template-columns: 1fr 1fr; } .radio-card-group.four-col { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 900px) { .radio-card-group.four-col { grid-template-columns: 1fr 1fr 1fr 1fr; } }
    .radio-card { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem 1.2rem; border: 1px solid var(--row-border); background: #000; cursor: pointer; transition: 0.2s; &:hover { border-color: color-mix(in srgb, #fff, transparent 80%); } &.sel { border-color: var(--accent-primary); background: color-mix(in srgb, #FF6400, transparent 94%); } input[type="radio"] { margin-top: 3px; accent-color: var(--accent-primary); flex-shrink: 0; } }
    .radio-card.sm { padding: 0.8rem 1rem; }
    .rc-body { display: flex; flex-direction: column; gap: 0.25rem; }
    .rc-title { font-size: 0.8rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }
    .rc-sub { font-size: 0.68rem; color: color-mix(in srgb, #fff, transparent 67%); font-weight: 600; }

    /* ── Pills & Chips ──────────────────────────────────────────────── */
    .pill-group { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .pill { padding: 0.4rem 0.9rem; border: 1px solid var(--row-border); background: #000; color: color-mix(in srgb, #fff, transparent 62%); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 0.4rem; input { display: none; } &:hover { border-color: color-mix(in srgb, #fff, transparent 70%); color: #fff; } &.on { background: var(--accent-primary); color: #000; border-color: var(--accent-primary); } }
    .chip-group { display: flex; flex-wrap: wrap; gap: 0.45rem; }
    .chip { padding: 0.38rem 0.85rem; border: 1px solid var(--row-border); background: #000; color: color-mix(in srgb, #fff, transparent 62%); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: 0.2s; &:hover { border-color: color-mix(in srgb, #fff, transparent 70%); color: #fff; } &.on { background: color-mix(in srgb, #FF6400, transparent 86%); color: var(--accent-primary); border-color: var(--accent-primary); } }

    /* ── File Upload ────────────────────────────────────────────────── */
    .file-zone { border: 1px dashed color-mix(in srgb, #fff, transparent 88%); background: #000; padding: 1.75rem; text-align: center; cursor: pointer; transition: 0.2s; &:hover { border-color: var(--accent-primary); } &.compact { padding: 1.1rem; } }
    .file-inp { display: none; }
    .file-lbl { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; cursor: pointer; }
    .file-main { font-size: 0.8rem; font-weight: 700; color: color-mix(in srgb, #fff, transparent 55%); text-transform: uppercase; letter-spacing: 0.5px; }
    .file-hint { font-size: 0.62rem; color: color-mix(in srgb, #fff, transparent 82%); font-weight: 600; }

    /* ── Checkbox ───────────────────────────────────────────────────── */
    .checkbox-row { display: flex; align-items: flex-start; gap: 0.7rem; cursor: pointer; input[type="checkbox"] { margin-top: 2px; width: 15px; height: 15px; accent-color: var(--accent-primary); flex-shrink: 0; } }
    .cb-label { font-size: 0.78rem; color: color-mix(in srgb, #fff, transparent 45%); line-height: 1.5; font-weight: 600; }
    .hc-link { color: var(--accent-primary); text-decoration: none; &:hover { text-decoration: underline; } }

    /* ── Tags ───────────────────────────────────────────────────────── */
    .opt-tag { font-size: 0.56rem; font-weight: 800; color: color-mix(in srgb, #fff, transparent 78%); text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid color-mix(in srgb, #fff, transparent 90%); padding: 0.1rem 0.4rem; margin-left: 0.4rem; vertical-align: middle; }
    .req-mark { font-size: 0.56rem; font-weight: 900; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 1px; border: 1px solid var(--accent-primary); padding: 0.1rem 0.4rem; margin-left: 0.4rem; vertical-align: middle; }

    /* ── Dividers ───────────────────────────────────────────────────── */
    .section-divider { height: 1px; background: var(--row-border); margin: 0.25rem 0; }
    .divider-label { font-size: 0.6rem; font-weight: 900; color: color-mix(in srgb, #fff, transparent 72%); text-transform: uppercase; letter-spacing: 2px; }
    .conditional-banner { font-size: 0.6rem; font-weight: 900; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 2px; border-left: 3px solid var(--accent-primary); padding: 0.5rem 1rem; background: color-mix(in srgb, #FF6400, transparent 95%); margin-top: 0.25rem; }

    /* ── Action Buttons ─────────────────────────────────────────────── */
    .action-btn-row { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .action-btn { background: #000; border: 1px solid var(--row-border); color: color-mix(in srgb, #fff, transparent 55%); padding: 0.65rem 1.3rem; font-size: 0.72rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: 0.2s; font-family: inherit; &:hover { border-color: var(--accent-primary); color: var(--accent-primary); } }

    /* ── Submit ─────────────────────────────────────────────────────── */
    .hc-submit-wrap { border: 1px solid var(--row-border); border-top: none; background: #030303; padding: 2.5rem 2rem; display: flex; flex-direction: column; gap: 1.5rem; align-items: flex-start; }
    .submit-notice { font-size: 0.72rem; color: color-mix(in srgb, #fff, transparent 78%); line-height: 1.6; max-width: 680px; font-weight: 600; }
    .submit-btn { background: var(--accent-primary); border: none; color: #000; padding: 1rem 2.5rem; font-size: 0.85rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer; transition: 0.2s; font-family: inherit; &:hover { background: #fff; } }

    @media (max-width: 599px) {
      .hc-hero { padding: 2rem 1rem 0; }
      .form-section { padding: 1.5rem 1rem; }
      .hc-submit-wrap { padding: 1.5rem 1rem; }
      .submit-btn { width: 100%; }
      .camps-filters { padding: 1.25rem 1rem; }
      .camps-result-header { padding: 0.65rem 1rem; }
      .modal-form { padding: 1.25rem 1rem; }
      .modal-header { padding: 1.25rem 1rem; }
      .modal-footer { padding: 1rem; }
      .modal-location-summary, .modal-online-info { margin: 1rem 1rem 0; }
    }
  `]
})
export class HealthConnectComponent {

  // ── Page ────────────────────────────────────────────────────────
  activePage = signal<'care' | 'camps'>('camps');

  // ── Health Camps Data ────────────────────────────────────────────
  camps: HealthCamp[] = [
    {
      id: 1,
      name: 'Diabetes Awareness & Screening Camp',
      specialty: 'Endocrinology',
      mode: 'Offline',
      date: '2026-03-08',
      time: '9:00 AM – 1:00 PM',
      duration: '4 Hours',
      doctor: 'Dr. Kavita Rao',
      description: 'Free blood sugar testing, HbA1c checks, and diet counselling for diabetes prevention and management.',
      totalSlots: 80,
      bookedSlots: 67,
      tags: ['Free', 'Blood Sugar', 'Diet Counselling', 'Screening'],
      locations: [
        { id: 11, name: 'Noida Community Science Lab', address: 'Sector 62, Noida', city: 'Noida', pinCode: '201309', distance: 3.4, slotsAvailable: 8 },
        { id: 12, name: 'TechHub Training Center', address: 'Sector 18, Noida', city: 'Noida', pinCode: '201301', distance: 1.8, slotsAvailable: 3 },
        { id: 13, name: 'Green Valley College', address: 'Greater Noida West', city: 'Greater Noida', pinCode: '201306', distance: 14.2, slotsAvailable: 2 }
      ]
    },
    {
      id: 2,
      name: 'Mental Health & Stress Relief Webinar',
      specialty: 'Psychiatry & Psychology',
      mode: 'Online',
      date: '2026-03-12',
      time: '6:00 PM – 8:00 PM',
      duration: '2 Hours',
      doctor: 'Dr. Arjun Mehta',
      description: 'Live interactive session covering stress management, anxiety coping techniques, and guided mindfulness exercises.',
      totalSlots: 150,
      bookedSlots: 89,
      tags: ['Free', 'Live Q&A', 'Mindfulness', 'Anxiety', 'Stress'],
      meetLink: 'https://meet.ceekul.health/mental-camp-march'
    },
    {
      id: 3,
      name: 'Cardiac Health Checkup Camp',
      specialty: 'Cardiology',
      mode: 'Offline',
      date: '2026-03-15',
      time: '8:00 AM – 12:00 PM',
      duration: '4 Hours',
      doctor: 'Dr. Sarah Chen',
      description: 'ECG, blood pressure screening, cholesterol check, and cardiac risk assessment with certified cardiologists.',
      totalSlots: 60,
      bookedSlots: 48,
      tags: ['ECG', 'Blood Pressure', 'Cholesterol', 'Paid — ₹199'],
      locations: [
        { id: 21, name: 'City Public Library Hall', address: 'Sector 5, Noida', city: 'Noida', pinCode: '201301', distance: 2.9, slotsAvailable: 7 },
        { id: 22, name: 'Digital Skill Center', address: 'Sector 15A, Noida', city: 'Noida', pinCode: '201301', distance: 4.5, slotsAvailable: 5 }
      ]
    },
    {
      id: 4,
      name: 'Women\'s Wellness & Gynecology Camp',
      specialty: 'Gynaecology',
      mode: 'Offline',
      date: '2026-03-20',
      time: '10:00 AM – 2:00 PM',
      duration: '4 Hours',
      doctor: 'Dr. Kavita Rao',
      description: 'Confidential gynaecological consultations, PCOS screening, breast health awareness, and reproductive health guidance.',
      totalSlots: 50,
      bookedSlots: 50,
      tags: ['Women Only', 'PCOS', 'Breast Health', 'Confidential'],
      locations: [
        { id: 31, name: 'Noida Community Science Lab', address: 'Sector 62, Noida', city: 'Noida', pinCode: '201309', distance: 3.4, slotsAvailable: 0 },
        { id: 32, name: 'Global Excellence School', address: 'Sector 29, Noida', city: 'Noida', pinCode: '201303', distance: 7.2, slotsAvailable: 0 }
      ]
    },
    {
      id: 5,
      name: 'Nutrition & Diet Planning Webinar',
      specialty: 'Nutrition & Dietetics',
      mode: 'Online',
      date: '2026-03-22',
      time: '11:00 AM – 12:30 PM',
      duration: '90 Minutes',
      doctor: 'Ms. Neha Gupta (Nutritionist)',
      description: 'Learn to build a balanced diet, understand macronutrients, manage weight, and get a personalised diet roadmap.',
      totalSlots: 200,
      bookedSlots: 112,
      tags: ['Free', 'Diet Planning', 'Weight Management', 'Personalised'],
      meetLink: 'https://meet.ceekul.health/nutrition-march'
    },
    {
      id: 6,
      name: 'Paediatric Vaccination & Child Health Drive',
      specialty: 'Paediatrics',
      mode: 'Offline',
      date: '2026-03-25',
      time: '9:00 AM – 4:00 PM',
      duration: 'Full Day',
      doctor: 'Dr. Rajesh Khanna',
      description: 'Vaccination drive for children aged 0–12 years, growth monitoring, developmental screening, and parent counselling.',
      totalSlots: 100,
      bookedSlots: 61,
      tags: ['Children 0–12', 'Vaccination', 'Free', 'Growth Monitoring'],
      locations: [
        { id: 41, name: 'TechHub Training Center', address: 'Sector 18, Noida', city: 'Noida', pinCode: '201301', distance: 1.8, slotsAvailable: 18 },
        { id: 42, name: 'Global Excellence School', address: 'Sector 29, Noida', city: 'Noida', pinCode: '201303', distance: 7.2, slotsAvailable: 12 },
        { id: 43, name: 'Anjali Community Hall', address: 'Sector 40, Noida', city: 'Noida', pinCode: '201303', distance: 5.6, slotsAvailable: 9 }
      ]
    }
  ];

  // ── Camp Filters ─────────────────────────────────────────────────
  campSearch = '';
  campModeFilter = 'All';
  campSpecFilter = 'All';
  campCityFilter = 'All';

  campSpecialties = ['All', 'Endocrinology', 'Cardiology', 'Psychiatry & Psychology', 'Gynaecology', 'Paediatrics', 'Nutrition & Dietetics'];
  campCities = ['All', 'Noida', 'Greater Noida'];

  filteredCamps = computed(() => {
    const q = this.campSearch.toLowerCase();
    return this.camps.filter(c => {
      const matchQ = !q || c.name.toLowerCase().includes(q) || c.specialty.toLowerCase().includes(q) || c.doctor.toLowerCase().includes(q);
      const matchMode = this.campModeFilter === 'All' || c.mode === this.campModeFilter;
      const matchSpec = this.campSpecFilter === 'All' || c.specialty === this.campSpecFilter;
      const matchCity = this.campCityFilter === 'All' || (c.locations || []).some(l => l.city === this.campCityFilter) || this.campCityFilter === 'All';
      return matchQ && matchMode && matchSpec && matchCity;
    });
  });

  // ── Location Selection (per camp) ────────────────────────────────
  private selectedLocations = new Map<number, number>(); // campId → locationId
  openLocationsCamp: number | null = null;

  toggleLocations(campId: number) {
    this.openLocationsCamp = this.openLocationsCamp === campId ? null : campId;
  }

  selectLocation(campId: number, locationId: number) {
    this.selectedLocations.set(campId, locationId);
  }

  getSelectedLocation(campId: number): number | undefined {
    return this.selectedLocations.get(campId);
  }

  getLocationName(campId: number): string {
    const camp = this.camps.find(c => c.id === campId);
    const locId = this.selectedLocations.get(campId);
    const loc = camp?.locations?.find(l => l.id === locId);
    return loc ? `${loc.name}, ${loc.address}` : '';
  }

  slotsLeft(camp: HealthCamp): number {
    return camp.totalSlots - camp.bookedSlots;
  }

  // ── Registration Modal ───────────────────────────────────────────
  registrationModal = false;
  selectedCamp: HealthCamp | null = null;
  registeredCamps = new Set<number>();

  // Registration form fields
  regName = '';
  regPhone = '';
  regEmail = '';
  regAge: number | null = null;
  regNotes = '';
  regConsent = false;

  openRegistration(camp: HealthCamp) {
    this.selectedCamp = camp;
    this.registrationModal = true;
    this.regName = ''; this.regPhone = ''; this.regEmail = '';
    this.regAge = null; this.regNotes = ''; this.regConsent = false;
  }

  closeModal() {
    this.registrationModal = false;
    this.selectedCamp = null;
  }

  confirmRegistration() {
    if (!this.selectedCamp) return;
    const campId = this.selectedCamp.id;
    this.registeredCamps.add(campId);
    // Update bookedSlots
    const camp = this.camps.find(c => c.id === campId);
    if (camp) camp.bookedSlots = Math.min(camp.bookedSlots + 1, camp.totalSlots);
    this.closeModal();
  }

  // ── Care Registration Form ───────────────────────────────────────
  userType = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  termsAgreed = false;

  fullLegalName = '';
  dateOfBirth = '';
  gender = '';
  preferredLanguage = '';
  countryOfResidence = '';
  currentAddress = '';

  caregiverFullName = '';
  caregiverRelationship = '';
  dependentFullName = '';
  dependentDOB = '';
  dependentGender = '';
  dependentLanguage = '';
  dependentCountry = '';
  dependentAddress = '';

  knownAllergies: string[] = [];
  allergyOpts = ['Medications', 'Food', 'Environmental', 'Latex', 'Insect Stings', 'None', 'Other'];
  currentMedications = '';
  chronicConditions: string[] = [];
  chronicOpts = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Anxiety', 'Depression', 'Thyroid', 'None', 'Other'];
  pastSurgeries = '';
  familyHistory: string[] = [];
  familyHistoryOpts = ['Heart Disease', 'Cancer', 'Diabetes', 'Stroke', 'Genetic Conditions', 'None', 'Other'];
  smokingStatus = '';
  alcoholConsumption = '';
  physicalActivityLevel = '';
  vaccinationStatus = '';
  emergencyContactName = '';
  emergencyContactPhone = '';
  emergencyContactRelationship = '';

  hasInsurance = '';
  insuranceProvider = '';
  policyNumber = '';
  groupNumber = '';
  consentToBillInsurance = false;
  paymentMethodPreference = '';
  financialAidRequestBrief = '';
  paymentMethods = [
    { val: 'card', label: 'Credit / Debit Card' },
    { val: 'wallet', label: 'Digital Wallet' },
    { val: 'bank', label: 'Bank Transfer' },
    { val: 'aid', label: 'Financial Aid / Payment Plan' }
  ];

  careModePreference = '';
  reasonForVisit = '';
  symptomList: string[] = [];
  symptomOpts = ['Fever', 'Cough', 'Headache', 'Fatigue', 'Pain', 'Dizziness', 'Nausea', 'Mental Distress', 'Rash', 'Shortness of Breath', 'Other'];
  symptomStartDate = '';
  symptomSeverity = '';
  preferredConsultationTime = '';
  doctorGenderPreference = '';
  specialtyPreference = '';
  locationAccess = false;
  preferredCenterLocation = '';
  preferredInPersonTime = '';
  doctorGenderPreferenceInPerson = '';
  specialtyPreferenceInPerson = '';
  kitTypeRequested = '';
  deliveryAddress = '';
  confirmSelfTest = false;

  notificationPreference: string[] = [];
  notificationOpts = ['SMS', 'Email', 'In-App Push Notifications'];
  consentAutomatedReminders = false;
  consentHealthTips = false;
  optInForSurveys = false;

  // ── Helpers ──────────────────────────────────────────────────────
  toggle(arr: string[], value: string) {
    const idx = arr.indexOf(value);
    if (idx > -1) arr.splice(idx, 1);
    else arr.push(value);
  }

  isIn(arr: string[], value: string): boolean {
    return arr.includes(value);
  }

  handleSubmit() {
    console.log('Health Connect care registration submitted');
  }
}
