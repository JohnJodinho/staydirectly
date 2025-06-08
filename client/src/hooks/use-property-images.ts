// use-property-images.ts
import { useQuery } from '@tanstack/react-query';
import { fetchPropertyImages, fetchPropertyMainImage, extractPropertyIds } from '@/lib/hospitable/property-utils';
import { PropertyImage } from '@/lib/hospitable/types';

/**
 * Hook to fetch images for a property from Hospitable
 * @param platformId The platform ID from the property (e.g., "customerId/listingId" or just "listingId")
 * @param defaultCustomerId Default customer ID to use if not included in platformId
 * @param storedImages Optional array of already stored images from the database (imageUrl & additionalImages)
 */
export function usePropertyImages(
  platformId: string | null, 
  defaultCustomerId?: string,
  storedImages?: { mainImage?: string, additionalImages?: string[] }
) {
  // Extract customer ID and listing ID from the platformId
  const { customerId: extractedCustomerId, listingId } = extractPropertyIds(platformId);
  const customerId = extractedCustomerId || defaultCustomerId;
  
  // Check if we have a complete set of images in the database
  const hasMainImage = !!storedImages?.mainImage;
  const hasAdditionalImages = !!(storedImages?.additionalImages && storedImages.additionalImages.length > 0);
  const hasCompleteDatabaseImages = hasMainImage && hasAdditionalImages;
  
  return useQuery<PropertyImage[]>({
    queryKey: ['propertyImages', customerId, listingId, !!storedImages],
    queryFn: async () => {
      // We'll now completely skip the database cache when we have platform ID
      if (false && (!platformId || !customerId || !listingId)) { // Completely disable DB cache for testing
        console.log('Using complete stored images from database');
        const images: PropertyImage[] = [];
        
        // Add main image if it exists
        if (storedImages?.mainImage) {
          images.push({
            id: 'main-image',
            url: storedImages.mainImage,
            isPrimary: true,
            position: 0,
            caption: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        
        // Add additional images if they exist
        if (storedImages?.additionalImages && storedImages.additionalImages.length > 0) {
          const additionalImageObjects = storedImages.additionalImages.map((url, index) => ({
            id: `additional-${index}`,
            url,
            isPrimary: false,
            position: index + 1,
            caption: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
          
          images.push(...additionalImageObjects);
        }
        
        return images;
      }
      
      // If no stored images or we need fresh data, fetch from API
      if (!customerId || !listingId) {
        console.warn('Missing customerId or listingId in usePropertyImages');
        return [];
      }
      
      console.log(`Fetching from API: customerId=${customerId}, listingId=${listingId}`);
      const images = await fetchPropertyImages(customerId, listingId);
      console.log(`API returned ${images.length} images`);
      return images;
    },
    // Enable API query if we either don't have complete database images or if we need to use the database images
    enabled: ((!!customerId && !!listingId) || hasCompleteDatabaseImages),
    // Keep data for 30 minutes - images don't change often
    staleTime: 30 * 60 * 1000,
    // Retain data when component unmounts - helps with navigation
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch the main/primary image for a property from Hospitable
 * @param platformId The platform ID from the property (e.g., "customerId/listingId" or just "listingId")
 * @param defaultCustomerId Default customer ID to use if not included in platformId
 * @param storedMainImage Optional already stored main image from the database
 */
export function usePropertyMainImage(
  platformId: string | null, 
  defaultCustomerId?: string,
  storedMainImage?: string
) {
  // Extract customer ID and listing ID from the platformId
  const { customerId: extractedCustomerId, listingId } = extractPropertyIds(platformId);
  const customerId = extractedCustomerId || defaultCustomerId;
  
  return useQuery<PropertyImage | undefined>({
    queryKey: ['propertyMainImage', customerId, listingId, !!storedMainImage],
    queryFn: async () => {
      // If we already have a stored main image, use that
      if (storedMainImage) {
        console.log('Using stored main image from database');
        return {
          id: 'main-image',
          url: storedMainImage,
          isPrimary: true,
          position: 0,
          caption: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      // Otherwise fetch from API
      if (!customerId || !listingId) {
        console.warn('Missing customerId or listingId in usePropertyMainImage');
        return undefined;
      }
      
      return fetchPropertyMainImage(customerId, listingId);
    },
    // Only enable API query if we don't have a stored image and have both required IDs
    enabled: (!storedMainImage && !!customerId && !!listingId) || !!storedMainImage,
    // Keep data for 30 minutes
    staleTime: 30 * 60 * 1000,
    // Retain data when component unmounts
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Force refresh property images from the API
 * @param propertyId The database ID of the property
 * @param platformId The Hospitable platform ID
 * @param defaultCustomerId Default customer ID
 */
export function useRefreshPropertyImages(propertyId: number, platformId: string | null, defaultCustomerId?: string) {
  const { customerId: extractedCustomerId, listingId } = extractPropertyIds(platformId);
  const customerId = extractedCustomerId || defaultCustomerId;
  
  return useQuery<{ success: boolean, message: string }>({
    queryKey: ['refreshPropertyImages', propertyId],
    queryFn: async () => {
      if (!customerId || !listingId) {
        return { success: false, message: 'Missing customer or listing ID' };
      }
      
      try {
        // Fetch fresh images from Hospitable API
        const images = await fetchPropertyImages(customerId, listingId);
        
        if (!images || images.length === 0) {
          return { success: false, message: 'No images found' };
        }
        
        // Extract main image and additional images
        const mainImage = images.find(img => img.isPrimary) || images[0];
        const additionalImages = images
          .filter(img => img.id !== mainImage.id)
          .sort((a, b) => a.position - b.position);
        
        // Update property in database with fresh images
        const response = await fetch(`/api/properties/${propertyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: mainImage.url,
            additionalImages: additionalImages.map(img => img.url)
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update property with fresh images');
        }
        
        return { 
          success: true, 
          message: `Successfully refreshed ${images.length} images for property #${propertyId}`
        };
      } catch (error) {
        console.error('Error refreshing property images:', error);
        return {
          success: false,
          message: `Failed to refresh images: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    },
    enabled: false, // Only run when manually triggered
  });
}