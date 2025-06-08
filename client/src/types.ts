// Type definitions for the project

// Property model matching shared/schema.ts
export interface Property {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  additionalImages: string[] | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  maxGuests: number | null;
  amenities: string[] | null;
  propertyType: string;
  slug: string | null;
  featured: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
  externalIds?: {
    hospitable?: string;
    airbnb?: string;
    [key: string]: string | undefined;
  };
}

// City model matching shared/schema.ts
export interface City {
  id: number;
  name: string;
  description: string;
  keywords: string[] | null;
  country: string;
  propertyCount: number | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string;
  featured: boolean | null;
  slug: string | null;
}

// Review model matching shared/schema.ts
export interface Review {
  id: number;
  propertyId: number;
  userId: number;
  rating: number;
  comment: string;
  createdAt: Date;
}

// Hospitable specific types
export interface HospitableListing {
  id: string;
  private_name?: string;
  public_name?: string;
  name?: string; // Deprecated - included for backward compatibility
  summary?: string;
  description?: string;
  nightly_rate?: string;
  image_url?: string;
  images?: string[];
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  country_code?: string;
  lat?: string;
  lng?: string;
  bedrooms?: string;
  bathrooms?: string;
  accommodates?: string;
  max?: string;
  amenities?: string[];
  property_type?: string;
  room_type?: string;
  platform?: string;
  platform_id?: string;
}