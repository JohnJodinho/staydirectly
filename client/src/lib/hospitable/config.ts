// config.ts

// Helper function to get environment variables from either client or server side
export const getEnv = (key: string, defaultValue: string = ''): string => {
  // For client-side (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  // For server-side (Node.js)
  else if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
};

export const HOSPITABLE_CONFIG = {
  API_BASE_URL: getEnv('VITE_HOSPITABLE_API_URL', 'https://connect.hospitable.com'),
  API_VERSION: '2024-01',
  DEFAULT_CACHE_DURATION: 60, // seconds,
  ENDPOINTS: {
    PROPERTIES: '/api/v1/properties',
    CUSTOMERS: '/api/v1/customers',
    LISTINGS: '/api/v1/listings',
    AUTH_CODES: '/api/v1/auth-codes',
    BOOKINGS: '/api/v1/bookings',
  }
};

export function getServerConfig() {
  // Try to get from either client or server environment
  const platformToken = getEnv('HOSPITABLE_PLATFORM_TOKEN');
  
  if (!platformToken) {
    throw new Error('HOSPITABLE_PLATFORM_TOKEN is not set. Please add it to your environment variables.');
  }
  
  return {
    PLATFORM_TOKEN: platformToken,
  };
}