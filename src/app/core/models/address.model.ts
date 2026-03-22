export interface Address {
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    district: string;
    state: string;
    country: string;
    pincode: string;
}

export interface GeoLocation {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
}

export interface StructuredAddress extends Address {
    location?: GeoLocation;
}
