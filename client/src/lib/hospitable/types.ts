// types.ts

export interface HospitableError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

export interface HospitableResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface HospitableRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
}

export interface HospitableClientConfig {
  baseUrl: string;
  apiToken: string;
  defaultHeaders?: Record<string, string>;
  defaultCache?: RequestCache;
  defaultRevalidate?: number;
}

export interface Property {
  id: string;
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  images: {
    url: string;
    caption?: string;
  }[];
  amenities: string[];
  capacity: {
    guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
  };
  pricing: {
    basePrice: number;
    currency: string;
    cleaningFee?: number;
    serviceFee?: number;
  };
  availability: {
    checkIn: string;
    checkOut: string;
    minStay: number;
    maxStay?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  customerId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  caption?: string;
  position: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional fields for Hospitable API format
  thumbnail_url?: string;
  order?: number;
}