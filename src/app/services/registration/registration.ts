import { Injectable, signal, computed } from '@angular/core';
import { RegistrationState, PasswordValidation, StepOneData, StepTwoData, AddressData, OtpState } from '../../pages/register copy/models/registration.models';


@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private readonly state = signal<RegistrationState>(this.getInitialState());

  // Computed signals for derived state
  readonly currentStep = computed(() => this.state().currentStep);
  readonly stepOneData = computed(() => this.state().stepOne);
  readonly stepTwoData = computed(() => this.state().stepTwo);
  readonly otpState = computed(() => this.state().otpState);
  readonly isSubmitting = computed(() => this.state().isSubmitting);
  readonly errors = computed(() => this.state().errors);
  readonly consentGiven = computed(() => this.state().consentGiven);
  readonly temporarySessionToken = computed(() => this.state().temporarySessionToken);

  // Password validation computed
  readonly passwordValidation = computed<PasswordValidation>(() => {
    const password = this.state().stepOne.password;
    const confirmPassword = this.state().stepOne.confirmPassword;
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      passwordsMatch: password === confirmPassword && password.length > 0
    };
  });

  // Step 1 completion check
  readonly isStepOneComplete = computed(() => {
    const validation = this.passwordValidation();
    const otp = this.state().otpState;
    return (
      otp.verified &&
      validation.minLength &&
      validation.hasUppercase &&
      validation.hasLowercase &&
      validation.hasNumber &&
      validation.hasSpecialChar &&
      validation.passwordsMatch
    );
  });

  // Step 2 validation
  readonly isStepTwoValid = computed(() => {
    const data = this.state().stepTwo;
    return (
      data.fullName.trim().length > 0 &&
      data.dateOfBirth.length > 0 &&
      data.address.line1.trim().length > 0 &&
      data.address.city.trim().length > 0 &&
      data.address.state.trim().length > 0 &&
      data.address.pincode.trim().length > 0 &&
      data.gender !== null &&
      data.identityType !== null &&
      data.identityNumber.trim().length > 0 &&
      data.belowPovertyLine !== null &&
      data.underprivilegedCategory !== null
    );
  });

  // Can submit final form
  readonly canSubmit = computed(() => {
    return (
      this.state().currentStep === 2 &&
      this.state().consentGiven &&
      this.isStepTwoValid()
    );
  });

  // Methods to update state
  updateStepOne(partial: Partial<StepOneData>): void {
    this.state.update(state => ({
      ...state,
      stepOne: { ...state.stepOne, ...partial }
    }));
  }

  updateStepTwo(partial: Partial<StepTwoData>): void {
    this.state.update(state => ({
      ...state,
      stepTwo: { ...state.stepTwo, ...partial }
    }));
  }

  updateAddress(partial: Partial<AddressData>): void {
    this.state.update(state => ({
      ...state,
      stepTwo: {
        ...state.stepTwo,
        address: { ...state.stepTwo.address, ...partial }
      }
    }));
  }

  setOtpState(otpState: Partial<OtpState>): void {
    this.state.update(state => ({
      ...state,
      otpState: { ...state.otpState, ...otpState }
    }));
  }

  setTemporaryToken(token: string): void {
    this.state.update(state => ({
      ...state,
      temporarySessionToken: token
    }));
  }

  goToStep(step: 1 | 2): void {
    this.state.update(state => ({
      ...state,
      currentStep: step
    }));
  }

  setConsent(value: boolean): void {
    this.state.update(state => ({
      ...state,
      consentGiven: value
    }));
  }

  setSubmitting(value: boolean): void {
    this.state.update(state => ({
      ...state,
      isSubmitting: value
    }));
  }

  setError(key: 'general', message: string | null): void {
    this.state.update(state => ({
      ...state,
      errors: { ...state.errors, [key]: message }
    }));
  }

  reset(): void {
    this.state.set(this.getInitialState());
  }

  private getInitialState(): RegistrationState {
    return {
      currentStep: 1,
      stepOne: {
        contactMethod: 'mobile',
        contactValue: '',
        otp: '',
        password: '',
        confirmPassword: ''
      },
      stepTwo: {
        fullName: '',
        dateOfBirth: '',
        address: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        },
        gender: null,
        identityType: null,
        identityNumber: '',
        belowPovertyLine: null,
        underprivilegedCategory: null,
        candidateId: '',
        documentUploads: [],
        videoVerificationWatched: false
      },
      otpState: {
        sent: false,
        verified: false,
        expiresAt: null,
        remainingAttempts: 3,
        resendCooldown: 0
      },
      consentGiven: false,
      temporarySessionToken: null,
      isSubmitting: false,
      errors: {
        stepOne: {},
        stepTwo: {},
        general: null
      }
    };
  }
}
