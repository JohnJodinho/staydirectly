import React from 'react';
import { cn } from '@/lib/utils';
import { getOptimizedAirbnbImageUrl } from '@/lib/hospitable/property-utils';

interface AirbnbImageOptimizerProps {
  imageUrl: string;
  alt: string;
  className?: string;
  width?: string;
  height?: string;
  fallbackUrl?: string;
}

/**
 * AirbnbImageOptimizer Component
 * 
 * This component optimizes Airbnb/muscache.com image URLs to ensure
 * we always use the highest quality version available without 
 * requiring additional API calls. It also provides fallback support.
 */
export const AirbnbImageOptimizer: React.FC<AirbnbImageOptimizerProps> = ({
  imageUrl,
  alt,
  className = '',
  width = '100%',
  height = 'auto',
  fallbackUrl = '/placeholder-property.jpg'
}) => {
  // Get the optimized URL using our utility function
  const optimizedUrl = imageUrl ? getOptimizedAirbnbImageUrl(imageUrl) : fallbackUrl;
  
  return (
    <img 
      src={optimizedUrl} 
      alt={alt} 
      className={cn('object-cover', className)}
      style={{ width, height }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        // If image fails to load, use fallback
        if (target.src !== fallbackUrl) {
          target.src = fallbackUrl;
        }
      }}
    />
  );
};

export default AirbnbImageOptimizer;