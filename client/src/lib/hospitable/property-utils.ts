// property-utils.ts
import { apiRequest } from '@/lib/queryClient';
import { PropertyImage } from './types';

/**
 * Fetches property images for a specific customer and listing
 * @param customerId The Hospitable customer ID
 * @param listingId The Hospitable listing ID
 * @returns Array of property images
 */
export async function fetchPropertyImages(customerId: string, listingId: string): Promise<PropertyImage[]> {
  try {
    console.log(`Making direct API call to Hospitable for customer ${customerId}, listing ${listingId}`);
    
    // Make a direct API call to Hospitable Connect API with authorization
    const url = `https://connect.hospitable.com/api/v1/customers/${customerId}/listings/${listingId}/images`;
    const options = {
      method: 'GET',
      headers: {
        'Connect-Version': '2022-11-01', // Required specific version for Hospitable API
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.HOSPITABLE_PLATFORM_TOKEN || import.meta.env.VITE_HOSPITABLE_PLATFORM_TOKEN}`
      }
    };

    console.log(`Direct API request to: ${url}`);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`Direct API call failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    // Handle both direct array response and data.data structure
    const images = data.data || data;
    console.log(`Direct API call successful! Retrieved ${images.length} images`);
    
    // Process images based on the API response format
    return images.map((image: any, index: number) => {
      // Handle the specific format from the Hospitable API
      // Format coming from API might be: { url, thumbnail_url, caption, order }
      const url = image.url || '';
      const position = image.order || index;
      const caption = image.caption || '';
      const isPrimary = index === 0; // Assume first image is primary if not specified
      
      // Apply high quality transformation to muscache.com URLs
      const transformedUrl = getOptimizedAirbnbImageUrl(url);
      
      console.log(`Original URL: ${url}`);
      console.log(`Transformed URL: ${transformedUrl}`);
      
      return {
        id: `image-${index}`,
        url: transformedUrl,
        position,
        caption,
        isPrimary,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        thumbnail_url: image.thumbnail_url || ''
      };
    });
  } catch (directError) {
    console.error('Direct API call failed:', directError);
    
    // Fallback to our API proxy endpoint
    try {
      console.log(`Falling back to API proxy for customer ${customerId}, listing ${listingId}`);
      // Add cache buster and forced refresh to ensure we get fresh data
      const cacheBuster = Date.now();
      const response = await apiRequest(
        'GET',
        `/api/hospitable/property-images/${customerId}/${listingId}?refresh=true&t=${cacheBuster}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch property images');
      }
      
      const data = await response.json();
      const images = data.data || data;
      
      // Process images based on the API response format
      return images.map((image: any, index: number) => {
        // Handle the specific format from the Hospitable API
        // Format coming from API might be: { url, thumbnail_url, caption, order }
        const url = image.url || '';
        const position = image.order || index;
        const caption = image.caption || '';
        const isPrimary = index === 0; // Assume first image is primary if not specified
        
        // Apply high quality transformation to muscache.com URLs
        const transformedUrl = getOptimizedAirbnbImageUrl(url);
        
        return {
          id: `image-${index}`,
          url: transformedUrl,
          position,
          caption,
          isPrimary,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          thumbnail_url: image.thumbnail_url || ''
        };
      });
    } catch (fallbackError) {
      console.error('Fallback API proxy also failed:', fallbackError);
      return [];
    }
  }
}

/**
 * Fetches the main/primary image for a property
 * @param customerId The Hospitable customer ID
 * @param listingId The Hospitable listing ID
 * @returns The primary image or the first available image
 */
export async function fetchPropertyMainImage(customerId: string, listingId: string): Promise<PropertyImage | undefined> {
  try {
    const images = await fetchPropertyImages(customerId, listingId);
    // Find the primary image or return the first one if available
    return images.find(img => img.isPrimary) || (images.length > 0 ? images[0] : undefined);
  } catch (error) {
    console.error('Failed to fetch property main image:', error);
    return undefined;
  }
}

/**
 * Optimizes a muscache.com URL to get a higher quality version
 * @param url The original image URL from Airbnb/muscache.com
 * @returns Optimized high-quality URL
 */
export function getOptimizedAirbnbImageUrl(url: string): string {
  if (!url) return '';
  
  // Only process muscache.com URLs
  if (url.includes('muscache.com')) {
    // First, convert /im/ URLs to direct URLs for higher quality
    let optimizedUrl = url;
    
    if (url.includes('/im/')) {
      optimizedUrl = url.replace('https://a0.muscache.com/im/', 'https://a0.muscache.com/');
    }
    
    // Then ensure we're using the large policy for better resolution
    if (optimizedUrl.includes('aki_policy=')) {
      optimizedUrl = optimizedUrl.replace(/aki_policy=[^&]+/, 'aki_policy=large');
    } else {
      // Add large policy if it doesn't exist
      optimizedUrl = optimizedUrl + (optimizedUrl.includes('?') ? '&' : '?') + 'aki_policy=large';
    }
    
    return optimizedUrl;
  }
  
  // Return original URL if not a muscache.com URL
  return url;
}

/**
 * Extracts the customer ID and listing ID from a property's platformId
 * @param platformId The platformId from the property object (format can be "customerId/listingId" or "customerId:listingId")
 * @returns Object containing customerId and listingId
 */
export function extractPropertyIds(platformId: string | null): { customerId: string | null; listingId: string | null } {
  if (!platformId) {
    return { customerId: null, listingId: null };
  }
  
  // Handle different format possibilities:
  // 1. Direct ID with no customer prefix (legacy format)
  // 2. CustomerID/ListingID or CustomerID:ListingID format (new formats)
  let parts: string[];
  
  if (platformId.includes('/')) {
    parts = platformId.split('/');
  } else if (platformId.includes(':')) {
    parts = platformId.split(':');
  } else {
    // Single ID with no delimiter
    return { customerId: null, listingId: platformId };
  }
  
  if (parts.length === 2) {
    // Format with customerId and listingId
    return { customerId: parts[0], listingId: parts[1] };
  }
  
  // Invalid format or single value, return as listingId
  return { customerId: null, listingId: platformId };
}