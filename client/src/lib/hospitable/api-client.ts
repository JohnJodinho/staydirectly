// api-client.ts

import { 
  HospitableClientConfig, 
  HospitableError, 
  HospitableRequestOptions, 
  HospitableResponse, 
  Property, 
  Customer, 
  Booking, 
  PropertyImage 
} from './types';

export class HospitableAPI {
  private readonly baseUrl: string;
  private readonly apiToken: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly defaultCache: RequestCache;
  private readonly defaultRevalidate: number;

  constructor(config: HospitableClientConfig) {
    this.baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
    this.apiToken = config.apiToken;
    this.defaultHeaders = {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Connect-Version': '2024-01',
      ...config.defaultHeaders,
    };
    this.defaultCache = config.defaultCache ?? 'no-store';
    this.defaultRevalidate = config.defaultRevalidate ?? 60;
  }

  private async request<T>(path: string, options: HospitableRequestOptions = {}): Promise<HospitableResponse<T>> {
    const url = new URL(`${path.startsWith('/') ? path : `/${path}`}`, this.baseUrl);
    
    try {
      const fetchOptions: RequestInit = {
        method: options.method ?? 'GET',
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: options.cache ?? this.defaultCache,
      };

      console.log(`Fetching from: ${url.toString()}`);
      
      const response = await fetch(url.toString(), fetchOptions);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `HTTP error! status: ${response.status}` };
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('API request failed:', error);
      const hospError: HospitableError = {
        name: error.name || "APIError",
        message: error.message || "Unknown API error",
        code: 'API_ERROR',
        status: 500,
      };
      throw hospError;
    }
  }

  // Property endpoints
  async getProperties(): Promise<Property[]> {
    // According to the Hospitable Connect API docs, the endpoint should be one of these:
    // 1. /api/v1/properties (for properties created through Hospitable)
    // 2. /api/v1/customers/{customerId}/listings (for customer connected listings)
    const response = await this.request<Property[]>('/api/v1/properties');
    return response.data;
  }

  async getCustomerListings(customerId: string): Promise<Property[]> {
    // This is the endpoint for accessing listings connected through OAuth
    const response = await this.request<Property[]>(`/api/v1/customers/${customerId}/listings`);
    return response.data;
  }

  async getProperty(id: string): Promise<Property> {
    const response = await this.request<Property>(`/api/v1/properties/${id}`);
    return response.data;
  }

  async createProperty(property: Omit<Property, 'id'>): Promise<Property> {
    const response = await this.request<Property>('/api/v1/properties', {
      method: 'POST',
      body: property,
    });
    return response.data;
  }

  async updateProperty(id: string, property: Partial<Property>): Promise<Property> {
    const response = await this.request<Property>(`/api/v1/properties/${id}`, {
      method: 'PATCH',
      body: property,
    });
    return response.data;
  }

  async deleteProperty(id: string): Promise<void> {
    await this.request(`/api/v1/properties/${id}`, {
      method: 'DELETE',
    });
  }

  // Customer endpoints
  async getCustomers(): Promise<Customer[]> {
    const response = await this.request<Customer[]>('/api/v1/customers');
    return response.data;
  }

  async getCustomer(id: string): Promise<Customer> {
    const response = await this.request<Customer>(`/api/v1/customers/${id}`);
    return response.data;
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const response = await this.request<Customer>('/api/v1/customers', {
      method: 'POST',
      body: customer,
    });
    return response.data;
  }

  // Booking endpoints
  async getBookings(filters?: { propertyId?: string; customerId?: string }): Promise<Booking[]> {
    const params = new URLSearchParams();
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);
    if (filters?.customerId) params.append('customerId', filters.customerId);
    
    const response = await this.request<Booking[]>(`/bookings?${params.toString()}`);
    return response.data;
  }

  async createBooking(booking: Omit<Booking, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    const response = await this.request<Booking>('/bookings', {
      method: 'POST',
      body: booking,
    });
    return response.data;
  }

  async updateBookingStatus(id: string, status: Booking['status']): Promise<Booking> {
    const response = await this.request<Booking>(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
    return response.data;
  }

  // Import listings
  async importListings(customerId: string): Promise<Property[]> {
    // Call our API endpoint for importing listings
    const response = await fetch('/api/hospitable/import-listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to import listings');
    }
    
    return response.json();
  }

  // Mark specific listings for publishing as property pages
  async markListingsForPublishing(customerId: string, listingIds: string[]): Promise<Property[]> {
    // Call our API endpoint to mark properties for publishing
    const response = await fetch('/api/hospitable/mark-for-publishing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        customerId, 
        listingIds 
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to mark properties for publishing');
    }
    
    return response.json();
  }
  
  // Get property images for a specific customer and listing
  async getPropertyImages(customerId: string, listingId: string): Promise<PropertyImage[]> {
    const response = await this.request<PropertyImage[]>(`/api/v1/customers/${customerId}/listings/${listingId}/images`);
    return response.data;
  }
  
  // Get a single property image for a specific customer and listing - useful for getting the main image
  async getPropertyMainImage(customerId: string, listingId: string): Promise<PropertyImage | undefined> {
    try {
      const images = await this.getPropertyImages(customerId, listingId);
      // Find the primary image or return the first one
      return images.find(img => img.isPrimary) || images[0];
    } catch (error) {
      console.error('Failed to fetch property main image:', error);
      return undefined;
    }
  }
}