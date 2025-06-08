// index.ts

// Re-export everything from the API module
export * from './types';
export * from './api-client';
export * from './config';
export * from './useHospitable';
export * from './server-utils';
export * from './property-utils';

// Default export for easier imports
import { HospitableAPI } from './api-client';
export default HospitableAPI;