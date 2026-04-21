// Contact method type
export type ContactMethod = 'mobile' | 'email';

// Gender options
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

// Identity document types
export type IdentityType =
  | 'aadhaar'
  | 'pan'
  | 'passport'
  | 'driving_license'
  | 'voter_id';

// OTP verification state
export interface OtpState {
  sent: boolean;
  verified: boolean;
  expiresAt: Date | null;
  remainingAttempts: number;
  resendCooldown: number;
}

// Step 1 form data
export interface StepOneData {
  contactMethod: ContactMethod;
  contactValue: string;
  otp: string;
  password: string;
  confirmPassword: string;
}

// Address structure
export interface AddressData {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

// Document upload
export interface DocumentUpload {
  id: string;
  type: IdentityType;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  previewUrl?: string;
}

// Step 2 form data
export interface StepTwoData {
  fullName: string;
  dateOfBirth: string;
  address: AddressData;
  gender: Gender | null;
  identityType: IdentityType | null;
  identityNumber: string;
  belowPovertyLine: boolean | null;
  underprivilegedCategory: boolean | null;
  candidateId: string;
  documentUploads: DocumentUpload[];
  videoVerificationWatched: boolean;
}

// Complete registration state
export interface RegistrationState {
  currentStep: 1 | 2;
  stepOne: StepOneData;
  stepTwo: StepTwoData;
  otpState: OtpState;
  consentGiven: boolean;
  temporarySessionToken: string | null;
  isSubmitting: boolean;
  errors: RegistrationErrors;
}

// Validation errors
export interface RegistrationErrors {
  stepOne: Partial<Record<keyof StepOneData, string>>;
  stepTwo: Partial<Record<keyof StepTwoData, string>>;
  general: string | null;
}

// Password validation rules
export interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  passwordsMatch: boolean;
}

// API response types
export interface OtpSendResponse {
  success: boolean;
  message: string;
  expiresIn: number;
}

export interface OtpVerifyResponse {
  success: boolean;
  message: string;
  temporaryToken: string;
}

export interface RegistrationResponse {
  success: boolean;
  candidateId: string;
  message: string;
}
