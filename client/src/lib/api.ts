import axios from 'axios';
import { queryClient } from './queryClient';

// API client for communicating with Hospitable and our backend API
class HospitableApiClient {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = '/api/hospitable';
  }
  
  /**
   * Create a customer in Hospitable
   */
  async createCustomer(customerData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/connect`, { 
        action: 'customer',
        ...customerData
      });
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }
  
  /**
   * Generate an auth link for Hospitable Connect OAuth flow
   */
  async generateAuthLink(customerId: string): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/connect`, { 
        action: 'auth-link',
        customerId
      });
      return response.data.authUrl;
    } catch (error) {
      console.error('Error generating auth link:', error);
      throw error;
    }
  }
  
  /**
   * Exchange auth code for token
   */
  async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/connect`, { 
        action: 'token',
        code
      });
      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }
  
  /**
   * Get customer listings from Hospitable
   */
  async getCustomerListings(customerId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/customers/${customerId}/listings`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching listings for customer ${customerId}:`, error);
      return []; // Return empty array on error
    }
  }
  
  /**
   * Import customer listings into our database
   */
  async importListings(customerId: string): Promise<any[]> {
    try {
      const response = await axios.post(`${this.baseUrl}/import-listings`, { customerId });
      
      // Invalidate property queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      
      return response.data;
    } catch (error) {
      console.error(`Error importing listings for customer ${customerId}:`, error);
      return []; // Return empty array on error
    }
  }
  
  /**
   * Fetch and store property images for a customer's listings
   */
  async fetchPropertyImages(customerId: string, listingId?: string): Promise<any> {
    try {
      // If listingId is provided, fetch images for that specific listing
      if (listingId) {
        const response = await axios.post(`${this.baseUrl}/fetch-property-images`, {
          customerId,
          listingId
        });
        return response.data;
      } else {
        // Otherwise, fetch images for all listings
        const response = await axios.post(`${this.baseUrl}/fetch-property-images`, { customerId });
        return response.data;
      }
    } catch (error) {
      console.error(`Error fetching images for customer ${customerId}:`, error);
      return { error: true, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Get a specific listing's images
   */
  async getListingImages(customerId: string, listingId: string, position?: number): Promise<any> {
    try {
      const queryParam = position !== undefined ? `?position=${position}` : '';
      const response = await axios.get(`${this.baseUrl}/property-images/${customerId}/${listingId}${queryParam}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching images for listing ${listingId}:`, error);
      return { error: true, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Mark properties as published
   */
  async markListingsForPublishing(customerId: string, listingIds: string[]): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/publish-properties`, { 
        customerId,
        listingIds
      });
      
      // Invalidate property queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      
      return response.data;
    } catch (error) {
      console.error(`Error publishing listings for customer ${customerId}:`, error);
      return { error: true, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export singleton instance
export const hospitable = new HospitableApiClient();

// Property API functions
export async function getFeaturedCities(): Promise<any[]> {
  try {
    const response = await axios.get('/api/cities/featured');
    return response.data;
  } catch (error) {
    console.error('Error fetching featured cities:', error);
    return [];
  }
}

export async function getCity(name: string): Promise<any> {
  try {
    const response = await axios.get(`/api/cities/${encodeURIComponent(name)}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching city ${name}:`, error);
    throw error;
  }
}

export async function getCityProperties(cityName: string): Promise<any[]> {
  try {
    const response = await axios.get(`/api/cities/${encodeURIComponent(cityName)}/properties`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching properties for city ${cityName}:`, error);
    return [];
  }
}

export async function getNeighborhoods(cityId: number): Promise<any[]> {
  try {
    const response = await axios.get(`/api/cities/${cityId}/neighborhoods`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching neighborhoods for city ID ${cityId}:`, error);
    return [];
  }
}

export async function getFeaturedProperties(): Promise<any[]> {
  try {
    const response = await axios.get('/api/properties/featured');
    return response.data;
  } catch (error) {
    console.error('Error fetching featured properties:', error);
    return [];
  }
}

export async function searchProperties(query: string): Promise<any[]> {
  try {
    const response = await axios.get(`/api/properties/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching properties:', error);
    return [];
  }
}

export async function getProperty(id: number): Promise<any> {
  try {
    const response = await axios.get(`/api/properties/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching property ${id}:`, error);
    throw error;
  }
}

export async function getPropertyReviews(propertyId: number): Promise<any[]> {
  try {
    const response = await axios.get(`/api/properties/${propertyId}/reviews`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching reviews for property ${propertyId}:`, error);
    return [];
  }
}

// Favorites API functions
export async function addFavorite(userId: number, propertyId: number): Promise<any> {
  try {
    const response = await axios.post('/api/favorites', { userId, propertyId });
    // Invalidate favorites queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'favorites'] });
    queryClient.invalidateQueries({ queryKey: ['/api/favorites/check'] });
    return response.data;
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
}

export async function removeFavorite(userId: number, propertyId: number): Promise<any> {
  try {
    const response = await axios.delete('/api/favorites', { data: { userId, propertyId } });
    // Invalidate favorites queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'favorites'] });
    queryClient.invalidateQueries({ queryKey: ['/api/favorites/check'] });
    return response.data;
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
}