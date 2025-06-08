import { hospitable } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import axios from 'axios';

/**
 * Flow status for tracking onboarding progress
 */
export enum OnboardingFlowStatus {
  NOT_STARTED = 'not_started',
  CUSTOMER_CREATED = 'customer_created',
  AUTH_LINK_GENERATED = 'auth_link_generated',
  AUTHORIZED = 'authorized',
  LISTINGS_FETCHED = 'listings_fetched',
  LISTINGS_STORED = 'listings_stored',
  IMAGES_FETCHED = 'images_fetched',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Customer onboarding flow state
 */
export interface OnboardingFlowState {
  status: OnboardingFlowStatus;
  customerId?: string;
  authLink?: string;
  listings?: any[];
  error?: string;
  completedSteps: string[];
  lastUpdated: Date;
}

/**
 * HospitableOnboardingFlow - Manages the customer onboarding process
 * 
 * Handles the sequence of operations:
 * 1. Customer creation
 * 2. Authorization link generation
 * 3. Data fetching
 * 4. Property image fetching
 * 5. Data storage
 */
export class HospitableOnboardingFlow {
  private state: OnboardingFlowState;
  private readonly localStorageKey = 'hospitableOnboardingFlow';
  private readonly maxRetries = 3;

  constructor() {
    // Load state from localStorage if available
    const savedState = localStorage.getItem(this.localStorageKey);
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        parsed.lastUpdated = new Date(parsed.lastUpdated);
        this.state = parsed;
        console.log('Loaded onboarding flow state:', this.state);
      } catch (error) {
        console.error('Error parsing saved onboarding state:', error);
        this.initializeState();
      }
    } else {
      this.initializeState();
    }
  }

  /**
   * Initialize a new flow state
   */
  private initializeState(): void {
    this.state = {
      status: OnboardingFlowStatus.NOT_STARTED,
      completedSteps: [],
      lastUpdated: new Date()
    };
    this.saveState();
  }

  /**
   * Save current state to localStorage
   */
  private saveState(): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.state));
  }

  /**
   * Mark a step as completed in the flow
   */
  private completeStep(step: OnboardingFlowStatus): void {
    this.state.status = step;
    if (!this.state.completedSteps.includes(step)) {
      this.state.completedSteps.push(step);
    }
    this.state.lastUpdated = new Date();
    this.saveState();
  }

  /**
   * Handle errors in the flow
   */
  private handleError(message: string, error: any): void {
    console.error(`Onboarding flow error: ${message}`, error);
    this.state.status = OnboardingFlowStatus.ERROR;
    this.state.error = `${message}: ${error?.message || 'Unknown error'}`;
    this.state.lastUpdated = new Date();
    this.saveState();
    throw error; // Re-throw to allow caller to handle
  }

  /**
   * Reset the flow state
   */
  public reset(): void {
    this.initializeState();
  }

  /**
   * Get current state of the flow
   */
  public getState(): OnboardingFlowState {
    return { ...this.state }; // Return a copy to prevent direct modification
  }

  /**
   * Create a customer in Hospitable
   */
  public async createCustomer(customerData: any): Promise<string> {
    try {
      // Skip if already completed
      if (this.state.status !== OnboardingFlowStatus.NOT_STARTED) {
        return this.state.customerId!;
      }

      const result = await hospitable.createCustomer(customerData);
      this.state.customerId = result.id;
      this.completeStep(OnboardingFlowStatus.CUSTOMER_CREATED);
      return result.id;
    } catch (error) {
      this.handleError('Failed to create customer', error);
      return ''; // Will never reach here due to throw in handleError
    }
  }

  /**
   * Generate authorization link for Hospitable Connect
   */
  public async generateAuthLink(customerId: string): Promise<string> {
    try {
      // Use cached customerId if available, otherwise use provided one
      const effectiveCustomerId = this.state.customerId || customerId;
      
      // Skip if already completed
      if (this.state.status !== OnboardingFlowStatus.CUSTOMER_CREATED && this.state.authLink) {
        return this.state.authLink;
      }

      const response = await axios.post('/api/hospitable/connect?action=auth-link', { 
        customerId: effectiveCustomerId 
      });
      
      this.state.authLink = response.data.authUrl;
      this.completeStep(OnboardingFlowStatus.AUTH_LINK_GENERATED);
      return response.data.authUrl;
    } catch (error) {
      this.handleError('Failed to generate auth link', error);
      return ''; // Will never reach here due to throw in handleError
    }
  }

  /**
   * Fetch all listings for a customer
   */
  public async fetchListings(customerId?: string): Promise<any[]> {
    try {
      // Use cached customerId if available, otherwise use provided one
      const effectiveCustomerId = customerId || this.state.customerId;
      
      if (!effectiveCustomerId) {
        throw new Error('Customer ID is required to fetch listings');
      }

      // Skip if already completed and we have listings data
      if (this.state.status !== OnboardingFlowStatus.AUTHORIZED && 
          this.state.listings && 
          this.state.listings.length > 0) {
        return this.state.listings;
      }

      const listings = await hospitable.getCustomerListings(effectiveCustomerId);
      this.state.listings = listings;
      this.completeStep(OnboardingFlowStatus.LISTINGS_FETCHED);
      return listings;
    } catch (error) {
      this.handleError('Failed to fetch listings', error);
      return []; // Will never reach here due to throw in handleError
    }
  }

  /**
   * Store listings data in our database
   */
  public async storeListings(customerId?: string): Promise<any[]> {
    try {
      // Use cached customerId if available, otherwise use provided one
      const effectiveCustomerId = customerId || this.state.customerId;
      
      if (!effectiveCustomerId) {
        throw new Error('Customer ID is required to store listings');
      }

      // If we don't have listings yet, fetch them first
      if (!this.state.listings || this.state.listings.length === 0) {
        await this.fetchListings(effectiveCustomerId);
      }

      // Import the listings into our database
      const importedProperties = await hospitable.importListings(effectiveCustomerId);
      this.completeStep(OnboardingFlowStatus.LISTINGS_STORED);
      
      // Invalidate property queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      
      return importedProperties;
    } catch (error) {
      this.handleError('Failed to store listings', error);
      return []; // Will never reach here due to throw in handleError
    }
  }

  /**
   * Fetch images for all listings
   * Uses a batched approach with retries to handle rate limiting
   */
  public async fetchListingImages(customerId?: string): Promise<boolean> {
    try {
      // Use cached customerId if available, otherwise use provided one
      const effectiveCustomerId = customerId || this.state.customerId;
      
      if (!effectiveCustomerId) {
        throw new Error('Customer ID is required to fetch listing images');
      }

      // If we don't have listings yet, fetch and store them first
      if (!this.state.listings || this.state.listings.length === 0) {
        await this.storeListings(effectiveCustomerId);
      }

      // Extract listing IDs from the listings data
      const listingIds = this.state.listings!.map((listing: any) => 
        listing.id || listing.id_str || listing.platformId
      ).filter(Boolean);

      // Process each listing with retry logic
      const results = await Promise.allSettled(
        listingIds.map(async (listingId: string) => {
          let retries = 0;
          let success = false;

          while (retries < this.maxRetries && !success) {
            try {
              // Use the API to fetch and store images
              const response = await axios.post('/api/hospitable/fetch-property-images', {
                customerId: effectiveCustomerId,
                listingId
              });
              
              success = true;
              console.log(`Successfully fetched images for listing ${listingId}`);
              return response.data;
            } catch (error) {
              retries++;
              
              if (retries >= this.maxRetries) {
                console.error(`Failed to fetch images for listing ${listingId} after ${retries} attempts:`, error);
                return null;
              }
              
              // Exponential backoff for retries
              const delay = Math.pow(2, retries) * 1000;
              console.warn(`Retry ${retries}/${this.maxRetries} for listing ${listingId} in ${delay}ms`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        })
      );

      // Check if all images were fetched successfully
      const allSuccessful = results.every(result => 
        result.status === 'fulfilled' && result.value !== null
      );

      if (allSuccessful) {
        this.completeStep(OnboardingFlowStatus.IMAGES_FETCHED);
      }

      return allSuccessful;
    } catch (error) {
      this.handleError('Failed to fetch listing images', error);
      return false; // Will never reach here due to throw in handleError
    }
  }

  /**
   * Publish properties to make them visible on the site
   */
  public async publishProperties(customerId?: string): Promise<boolean> {
    try {
      // Use cached customerId if available, otherwise use provided one
      const effectiveCustomerId = customerId || this.state.customerId;
      
      if (!effectiveCustomerId) {
        throw new Error('Customer ID is required to publish properties');
      }

      // If we don't have listings yet, go through the full flow
      if (!this.state.listings || this.state.listings.length === 0) {
        await this.fetchListingImages(effectiveCustomerId);
      }

      // Extract listing IDs from the listings data
      const listingIds = this.state.listings!.map((listing: any) => 
        listing.id || listing.id_str || listing.platformId
      ).filter(Boolean);

      // Mark the listings for publishing
      await hospitable.markListingsForPublishing(effectiveCustomerId, listingIds);
      
      // Complete the flow
      this.completeStep(OnboardingFlowStatus.COMPLETED);
      
      // Invalidate property queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      
      return true;
    } catch (error) {
      this.handleError('Failed to publish properties', error);
      return false; // Will never reach here due to throw in handleError
    }
  }

  /**
   * Run the complete onboarding flow from beginning to end
   */
  public async runFullFlow(customerData: any): Promise<boolean> {
    try {
      // Step 1: Create customer
      const customerId = await this.createCustomer(customerData);
      
      // Step 2: Generate auth link (normally this would redirect to Hospitable Connect)
      const authLink = await this.generateAuthLink(customerId);
      console.log('Generated auth link:', authLink);
      
      // The following steps would happen after the user authorizes via the auth link
      // For testing, we'll assume authorization has occurred
      this.completeStep(OnboardingFlowStatus.AUTHORIZED);
      
      // Step 3: Fetch and store listings
      await this.storeListings(customerId);
      
      // Step 4: Fetch images for all listings
      await this.fetchListingImages(customerId);
      
      // Step 5: Publish properties
      await this.publishProperties(customerId);
      
      return true;
    } catch (error) {
      console.error('Error running full onboarding flow:', error);
      return false;
    }
  }
}

// Export singleton instance
export const onboardingFlow = new HospitableOnboardingFlow();