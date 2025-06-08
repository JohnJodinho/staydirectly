// server-utils.ts

import { HospitableAPI } from './api-client';
import { HOSPITABLE_CONFIG } from './config';
import { getServerConfig } from './config';

// This creates an API client with the server-side platform token
// for making authenticated requests from the backend
export function createServerApiClient() {
  try {
    const { PLATFORM_TOKEN } = getServerConfig();
    
    return new HospitableAPI({
      baseUrl: HOSPITABLE_CONFIG.API_BASE_URL,
      apiToken: PLATFORM_TOKEN,
      defaultCache: 'no-store', // For server-side, default to no caching
    });
  } catch (error) {
    console.error('Failed to create server API client:', error);
    throw error;
  }
}

// Utility function to validate an API key by making a test request
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const api = new HospitableAPI({
      baseUrl: HOSPITABLE_CONFIG.API_BASE_URL,
      apiToken: apiKey,
    });
    
    // Attempt to get properties as a test request
    await api.getProperties();
    return true;
  } catch (error) {
    console.error('API key validation failed:', error);
    return false;
  }
}