export interface AvailabilitySchedule {
    day: string;
    startTime: string;
    endTime: string;
    status: 'Available' | 'Booked' | 'Maintenance' | 'Closed';
    notes?: string;
    _id?: string;
}

export interface GeneralInfo {
    schoolName: string;
    address: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    timeZone: string;
}

export interface Classroom {
    name: string;
    id: string;
    capacity: number;
    length?: number;
    width?: number;
    area?: number;
    type: string;
    technology: string[];
    furniture: string[];
    lighting: string[];
    ventilation: string[];
    specializedEquipment?: string;
    accessibility: string[];
    primaryUsage: string;
    availabilitySchedule: AvailabilitySchedule[];
    _id?: string;
}

export interface ComputerLab {
    name: string;
    id: string;
    workstations: number;
    capacity: number;
    softwareAvailable: string[];
    internetSpeed: string;
    availabilitySchedule: AvailabilitySchedule[];
    _id?: string;
}

export interface OtherFacility {
    name: string;
    id: string;
    type: string;
    capacity?: number;
    dimensions?: string;
    soundSystem: boolean;
    lightingSystem: boolean;
    projectorScreen: boolean;
    availabilitySchedule: AvailabilitySchedule[];
    _id?: string;
}

export interface InfrastructurePayload {
    title: string;
    generalInfo: GeneralInfo;
    classrooms: Classroom[];
    computerLabs: ComputerLab[];
    otherFacilities: OtherFacility[];
}

export interface UpdateInfrastructurePayload {
    title?: string;
    generalInfo?: Partial<GeneralInfo>;
    classrooms?: Classroom[];
    computerLabs?: ComputerLab[];
    otherFacilities?: OtherFacility[];
}

export interface InfrastructureData extends InfrastructurePayload {
    _id: string;
    partnerId: string;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
}

export interface InfrastructureResponse {
    status: boolean;
    message: string;
    data: InfrastructureData | InfrastructureData[];
}

export interface ClassroomResponse {
    status: boolean;
    message: string;
    data: Classroom;
}

export interface UpdateClassroomPayload extends Partial<Classroom> {}

export interface ComputerLabResponse {
    status: boolean;
    message: string;
    data: ComputerLab;
}

export interface UpdateComputerLabPayload extends Partial<ComputerLab> {}

export interface OtherFacilityResponse {
    status: boolean;
    message: string;
    data: OtherFacility;
}

export interface UpdateFacilityPayload extends Partial<OtherFacility> {}
