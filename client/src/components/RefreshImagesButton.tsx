import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ImagePlus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { extractPropertyIds } from '@/lib/hospitable/property-utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface RefreshImagesButtonProps {
  propertyId: number;
  platformId: string | null;
  defaultCustomerId?: string;
  buttonText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const RefreshImagesButton: React.FC<RefreshImagesButtonProps> = ({
  propertyId,
  platformId,
  defaultCustomerId,
  buttonText = "Refresh Images",
  variant = 'outline',
  size = 'default',
  className = ''
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create mutation for image refresh
  const fetchImagesMutation = useMutation({
    mutationFn: async (data: { propertyId: number, platformId: string }) => {
      const response = await apiRequest('POST', '/api/hospitable/fetch-property-images', data);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch images');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/properties', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['propertyImages'] });
      
      toast({
        title: 'Success!',
        description: `Successfully refreshed ${data.imageCount || 'all'} images for this property.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error refreshing images',
        description: error.message || 'Something went wrong when fetching property images.',
        variant: 'destructive',
      });
    }
  });
  
  const handleFetchImages = () => {
    if (!propertyId) {
      toast({
        title: "Missing Property ID",
        description: "Can't refresh images because the property ID is missing.",
        variant: "destructive",
      });
      return;
    }
    
    // For Hospitable API properties, we need a platformId
    if (!platformId) {
      toast({
        title: "Missing Platform ID",
        description: "This property doesn't have a Platform ID. To fetch images, you need to connect this property to Hospitable.",
        variant: "destructive",
      });
      return;
    }
    
    // Before making the API call, analyze if the platformId has the right format
    const { customerId: extractedCustomerId, listingId } = extractPropertyIds(platformId.toString());
    const customerId = extractedCustomerId || defaultCustomerId;
    
    // If the platformId doesn't have the correct format (customerId/listingId)
    if (!customerId || !listingId) {
      toast({
        title: "Invalid Platform ID Format",
        description: "This property has an incorrectly formatted Platform ID. It should be in the format 'customerId/listingId'.",
        variant: "destructive",
      });
      return;
    }
    
    fetchImagesMutation.mutate({ 
      propertyId: propertyId, 
      platformId: customerId && listingId ? `${customerId}/${listingId}` : platformId 
    });
  };
  
  return (
    <Button 
      variant={variant}
      size={size}
      className={className}
      onClick={handleFetchImages}
      disabled={fetchImagesMutation.isPending}
    >
      {fetchImagesMutation.isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Refreshing...
        </>
      ) : (
        <>
          <ImagePlus className="mr-2 h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  );
};

export default RefreshImagesButton;