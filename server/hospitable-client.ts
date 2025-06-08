import axios from 'axios';
import dotenv from "dotenv";
dotenv.config();


// Hospitable API version to use
const HOSPITABLE_API_VERSION = '2022-11-01';

// Type definitions for API responses
interface HospitableTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface HospitableCustomer {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a server-side API client for Hospitable with token management
 */
export function createServerApiClient() {
  // State for token storage
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let tokenExpiry: number | null = null;
  
  // Base axios instance with common settings
  const client = axios.create({
    baseURL: 'https://connect.hospitable.com/api/v1',
    headers: {
      'Content-Type': 'application/json',
      'Connect-Version': HOSPITABLE_API_VERSION
    }
  });
  
  // Add token to requests if available
  client.interceptors.request.use(async (config) => {
    // Check if token is about to expire (within 5 minutes)
    if (tokenExpiry && Date.now() > tokenExpiry - 5 * 60 * 1000) {
      try {
        // Refresh token
        const newTokens = await refreshAccessToken();
        accessToken = newTokens.access_token;
        refreshToken = newTokens.refresh_token;
        tokenExpiry = Date.now() + newTokens.expires_in * 1000;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // Token refresh failed, proceed with old token or without token
      }
    }
    
    // Add access token to header if available
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  });
  
  /**
   * Refresh access token using refresh token
   */
  async function refreshAccessToken(): Promise<HospitableTokenResponse> {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      // Get refresh URL from environment or use a default
      const refreshUrl = process.env.HOSPITABLE_TOKEN_URL || 'https://connect.hospitable.com/api/v1/oauth/token';
      
      // Include the necessary credentials
      const clientId = process.env.NEXT_PUBLIC_HOSPITABLE_CLIENT_ID;
      const clientSecret = process.env.HOSPITABLE_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('Missing Hospitable credentials');
      }
      
      const response = await axios.post(refreshUrl, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret
      });
      
      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }
  
  /**
   * Set tokens from an authorization code exchange
   * Note: Would later change logic to persist tokens securely in DB
   */
  function setTokens(tokenResponse: HospitableTokenResponse): void {
    accessToken = tokenResponse.access_token;
    refreshToken = tokenResponse.refresh_token;
    tokenExpiry = Date.now() + tokenResponse.expires_in * 1000;
  }
  
  /**
   * Exchange an authorization code for access and refresh tokens
   */
  async function exchangeCodeForToken(code: string): Promise<HospitableTokenResponse> {
    try {
      // Get token URL from environment or use a default
      const tokenUrl = process.env.HOSPITABLE_TOKEN_URL || 'https://connect.hospitable.com/api/v1/oauth/token';
      
      // Include the necessary credentials
      const clientId = process.env.NEXT_PUBLIC_HOSPITABLE_CLIENT_ID;
      const clientSecret = process.env.HOSPITABLE_CLIENT_SECRET;
      const redirectUri = process.env.NEXT_PUBLIC_HOSPITABLE_REDIRECT_URI || 'http://localhost:5000/auth/callback';
      
      if (!clientId || !clientSecret) {
        throw new Error('Missing Hospitable credentials');
      }
      
      const response = await axios.post(tokenUrl, {
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      });
      
      const tokenData = response.data;
      setTokens(tokenData);
      
      return tokenData;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }
  
  /**
   * Create a new customer in Hospitable
   */
  async function createCustomer(customerData: any): Promise<HospitableCustomer> {
    try {
      // Hospitable platform token is required for this operation
      const platformToken = process.env.HOSPITABLE_PLATFORM_TOKEN;
      
      if (!platformToken) {
        throw new Error('Missing HOSPITABLE_PLATFORM_TOKEN environment variable');
      }
      
      // Create customer using platform token for authorization
      const response = await axios.post(
        'https://connect.hospitable.com/api/v1/customers',
        customerData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Connect-Version': HOSPITABLE_API_VERSION,
            'Authorization': `Bearer ${platformToken}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }
  
  /**
   * Get all listings for a specific customer
   */
  async function getCustomerListings(customerId: string): Promise<any[]> {
    try {
      // Make authenticated request to get customer listings
      console.log(`[Hospitable Client] Fetching listings for customer ${customerId}`);
      // const response = await client.get(`/customers/${customerId}/listings`);

      const platformToken = process.env.HOSPITABLE_PLATFORM_TOKEN;
      
      if (!platformToken) {
        throw new Error('Missing HOSPITABLE_PLATFORM_TOKEN environment variable');
      }
      
      // Create customer using platform token for authorization
      const response = await axios.get(
        `https://connect.hospitable.com/api/v1/customers/${customerId}/listings`,
        
        {
          headers: {
            'Content-Type': 'application/json',
            'Connect-Version': HOSPITABLE_API_VERSION,
            'Authorization': `Bearer ${platformToken}`
          }
        }
      );

      console.log(`[Hospitable Client] Got ${response.data.data?.length || 0} listings for customer ${customerId}`);
      // console.log(`[Hospitable Client] Fetched listings for customer ${customerId}:`, response.data.data);

      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching listings for customer ${customerId}:`, error);
      return [];
    }
  }
  
  /**
   * Get images for a specific listing
   */
  async function getListingImages(customerId: string, listingId: string): Promise<any[]> {
    try {
      console.log(`[Hospitable Client] Fetching images for listing ${listingId} of customer ${customerId}`);
      
      // Make authenticated request to get listing images
      // const response = await client.get(`/customers/${customerId}/listings/${listingId}/images`);
      
      const platformToken = process.env.HOSPITABLE_PLATFORM_TOKEN;
      
      if (!platformToken) {
        throw new Error('Missing HOSPITABLE_PLATFORM_TOKEN environment variable');
      }
      
      // Create customer using platform token for authorization
      const response = await axios.get(
        `https://connect.hospitable.com/api/v1/customers/${customerId}/listings/${listingId}/images`,
        
        {
          headers: {
            'Content-Type': 'application/json',
            'Connect-Version': HOSPITABLE_API_VERSION,
            'Authorization': `Bearer ${platformToken}`
          }
        }
      );
      
      // console.log(`[Hospitable Client] Fetched images for listing ${listingId}:`, response.data.data);
      console.log(`[Hospitable Client] Got ${response.data.data?.length || 0} images for listing ${listingId}`);
      
      // Return empty array if no data or images
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching images for listing ${listingId}:`, error);
      return [];
    }
  }
  
  /**
   * Get user profile data for authenticated user
   */
  async function getUserProfile(): Promise<any> {
    try {
      // Make authenticated request to get user profile
      const response = await client.get('/accounts/me');
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }
  
  // Return the client API
  return {
    exchangeCodeForToken,
    refreshAccessToken,
    createCustomer,
    getCustomerListings,
    getListingImages,
    getUserProfile
  };
}