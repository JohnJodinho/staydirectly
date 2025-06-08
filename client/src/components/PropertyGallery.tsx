import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronRight, ChevronLeft, X, Grid, Loader2, ZoomIn, ZoomOut, ImagePlus } from 'lucide-react';
import { usePropertyImages } from '@/hooks/use-property-images';
import { extractPropertyIds } from '@/lib/hospitable/property-utils';
import { useSwipeable } from 'react-swipeable';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import RefreshImagesButton from './RefreshImagesButton';

interface PropertyGalleryProps {
  images?: string[];
  propertyName: string;
  platformId?: string | null;
  defaultCustomerId?: string;
  imageUrl?: string;        // For when we have a stored main image
  additionalImages?: string[]; // For when we have stored additional images
}

const PropertyGallery: React.FC<PropertyGalleryProps> = ({ 
  images: providedImages, 
  propertyName, 
  platformId, 
  defaultCustomerId,
  imageUrl,
  additionalImages
}) => {
  // Start with an initial image to prevent infinite loops
  const initialImage = imageUrl || (providedImages && providedImages.length > 0 ? providedImages[0] : null);
  const [displayImages, setDisplayImages] = useState<string[]>(initialImage ? [initialImage] : []);
  const [fullScreen, setFullScreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [imagesProcessed, setImagesProcessed] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [apiRetryLimits, setApiRetryLimits] = useState<Record<number, number>>({});
  
  // Check if the device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Create a wrapper for stored database images
  const storedDbImages = React.useMemo(() => {
    // Check if we have any stored images from the database
    if (imageUrl || (additionalImages && additionalImages.length > 0)) {
      console.log(`Using database images: main=${!!imageUrl}, additional=${additionalImages?.length || 0}`);
      return {
        mainImage: imageUrl,
        additionalImages: additionalImages || []
      };
    }
    console.log('No stored database images available');
    return undefined;
  }, [imageUrl, additionalImages]);
  
  // Fetch images from Hospitable API if we have platformId
  const { 
    data: propertyImages, 
    isLoading: loadingImages,
    isError: imagesError 
  } = usePropertyImages(
    // Ensure platformId is only string or null, not undefined
    platformId || null, 
    defaultCustomerId, 
    storedDbImages
  );
  
  // Get the API base URL for direct API requests if needed
  const getDirectApiImageUrl = useCallback((position: number = 0) => {
    if (!platformId) return null;
    
    const { customerId, listingId } = extractPropertyIds(platformId);
    if (!customerId || !listingId) return null;
    
    // Use the direct API endpoint with a unique cache-busting param for each position
    return `/api/hospitable/property-images/${customerId || defaultCustomerId}/${listingId}?pos=${position}&t=${Date.now()}`;
  }, [platformId, defaultCustomerId]);
  
  // Handle image load errors with smart fallback logic
  const handleImageLoadError = useCallback((index: number, imageUrl: string) => {
    console.log(`Image at position ${index} failed to load: ${imageUrl}`);
    
    // Mark this image position as failed
    setFailedImages(prev => ({
      ...prev,
      [index]: true
    }));
    
    // Track retry attempts for this position
    setApiRetryLimits(prev => ({
      ...prev,
      [index]: (prev[index] || 0) + 1
    }));
    
    // Get fallback URL if this is a direct muscache URL that failed
    if (imageUrl.includes('muscache.com')) {
      // Only retry with API if we have platformId
      if (platformId) {
        const { customerId, listingId } = extractPropertyIds(platformId);
        if (customerId && listingId) {
          return true;
        }
      }
    }
    
    return false;
  }, [platformId]);
  
  // Process images in this order: API images > DB images > provided static images > placeholder
  useEffect(() => {
    // Skip this effect if we've already processed images (prevents infinite loop)
    if (imagesProcessed || (displayImages.length > 1)) {
      return;
    }

    console.log('Image source selection effect triggered');
    
    // First check - do we have database-stored images?
    const hasStoredImages = !!(imageUrl || (additionalImages && additionalImages.length > 0));
    const hasCompleteStoredImages = !!(imageUrl && additionalImages && additionalImages.length > 0);
    
    // Function to create high-quality image URLs from the database
    const createDbImageUrls = () => {
      // Add a cache-busting parameter
      const cacheBuster = `&cb=${Date.now()}`;
      const urls: string[] = [];
      
      // Add main image first if it exists
      if (imageUrl) {
        // Process the main image URL
        let mainUrl = imageUrl;
        if (mainUrl.includes('muscache.com/im/')) {
          mainUrl = mainUrl.replace(/\?aki_policy=[^&]+/, '?aki_policy=large&pos=0');
          if (!mainUrl.includes('aki_policy=')) {
            mainUrl += (mainUrl.includes('?') ? '&' : '?') + 'aki_policy=large&pos=0';
          }
          mainUrl += cacheBuster;
        }
        urls.push(mainUrl);
      }
      
      // Then add additional images if they exist
      if (additionalImages && additionalImages.length > 0) {
        additionalImages.forEach((url, idx) => {
          if (!url) return; // Skip empty URLs
          
          // Process additional image URL
          let processedUrl = url;
          if (processedUrl.includes('muscache.com/im/')) {
            processedUrl = processedUrl.replace(/\?aki_policy=[^&]+/, `?aki_policy=large&pos=${idx+1}`);
            if (!processedUrl.includes('aki_policy=')) {
              processedUrl += (processedUrl.includes('?') ? '&' : '?') + `aki_policy=large&pos=${idx+1}`;
            }
            processedUrl += cacheBuster;
          }
          urls.push(processedUrl);
        }); 
      } 
      
      // Don't duplicate images - if we only have one image, that's all we'll show
      // We'll display an "update images" button instead of duplicate images
      if (urls.length === 1 && platformId && (!additionalImages || additionalImages.length === 0)) {
        console.log('Only one image available - not duplicating');
        return urls;
      }
      
      return urls;
    };
    
    // Function for direct API URLs with staggered loading (as fallback)
    const createStaggeredApiUrls = (length: number) => {
      // If we have a main image already, use it but with unique params for each position
      if (imageUrl && length > 1) {
        return Array.from({ length }, (_, idx) => {
          // Add unique parameters to each URL to force image uniqueness
          const uniqueParams = `&variant=${idx}&t=${Date.now() + idx}`;
          if (imageUrl.includes('muscache.com')) {
            return imageUrl.includes('?') ? 
              `${imageUrl}&idx=${idx}${uniqueParams}` : 
              `${imageUrl}?idx=${idx}${uniqueParams}`;
          }
          return imageUrl + (imageUrl.includes('?') ? '&' : '?') + `idx=${idx}${uniqueParams}`;
        });
      }
      
      return Array.from({ length }, (_, idx) => {
        // Add randomization to API request to get varied image results
        const randomSeed = Math.floor(Math.random() * 1000);
        const staggerDelay = idx * 5000; // 5 seconds between each request
        const apiUrl = getDirectApiImageUrl(idx);
        const delayParam = `&delay=${staggerDelay}&seed=${randomSeed}&t=${Date.now() + idx * 1000}`;
        
        return apiUrl 
          ? apiUrl + delayParam
          : '/placeholder-property.jpg';
      });
    };
    
    // Process API-sourced images
    const processApiImages = () => {
      if (!propertyImages || propertyImages.length === 0) return null;
      
      console.log('Processing API-sourced images:', propertyImages.length);
      
      // Sort images by position to ensure correct order
      const sortedImages = [...propertyImages].sort((a, b) => {
        const aPos = a.order !== undefined ? a.order : a.position;
        const bPos = b.order !== undefined ? b.order : b.position;
        return aPos - bPos;
      });
      
      // Make sure we have distinct images (no duplicates)
      const distinctUrls = new Set<string>();
      return sortedImages
        .filter(img => img.url && img.url.trim() !== '')
        .filter(img => {
          if (distinctUrls.has(img.url)) return false;
          distinctUrls.add(img.url);
          return true;
        })
        .map((img, index) => {
          // Process muscache.com URLs for high quality
          if (img.url && img.url.includes('muscache.com/im/')) {
            const processed = img.url.replace(/\?aki_policy=[^&]+/, `?aki_policy=large&pos=${index}`);
            if (!processed.includes('aki_policy=')) {
              return processed + (processed.includes('?') ? '&' : '?') + `aki_policy=large&pos=${index}`;
            }
            return processed;
          }
          return img.url;
        });
    };
    
    let newImages: string[] = [];
    
    // OPTION 1: Use API images if they're available (prioritize over database)
    const apiImages = processApiImages();
    if (apiImages && apiImages.length > 0) {
      console.log(`Using ${apiImages.length} images from API`);
      
      // Add random variations to each URL to prevent browser caching the same image multiple times
      newImages = apiImages.map((url, idx) => {
        // Add uniqueness parameters to each URL
        const uniqueSuffix = `&uniq=${idx}_${Math.random().toString(36).substring(2, 8)}_${Date.now()}`;
        return url + (url.includes('?') ? uniqueSuffix : `?${uniqueSuffix.substring(1)}`);
      });
    }
    
    // OPTION 2: Use database-stored images if API didn't return images
    else if (hasStoredImages && newImages.length === 0) {
      console.log('Falling back to stored database images');
      const dbImageUrls = createDbImageUrls();
      
      if (dbImageUrls.length > 0) {
        console.log(`Created ${dbImageUrls.length} URLs from database`, dbImageUrls);
        newImages = dbImageUrls;
      }
    }
    
    // We already checked for API images as our first option
    
    // OPTION 3: Use provided images array if passed directly
    if (newImages.length === 0 && providedImages && providedImages.length > 0) {
      console.log(`Using ${providedImages.length} provided static images`);
      const transformedImages = providedImages.map((url, index) => {
        if (url && url.includes('muscache.com/im/')) {
          const processed = url.replace(/\?aki_policy=[^&]+/, `?aki_policy=large&pos=${index}`);
          if (!processed.includes('aki_policy=')) {
            return processed + (processed.includes('?') ? '&' : '?') + `aki_policy=large&pos=${index}`;
          }
          return processed;
        }
        return url;
      });
      
      newImages = transformedImages;
    }
    
    // OPTION 4: Fall back to direct API URLs as last resort
    if (newImages.length === 0 && platformId) {
      console.log('Falling back to direct API image URLs');
      const directUrls = createStaggeredApiUrls(3); // Use 3 images max to reduce rate limits
      newImages = directUrls;
    }
    
    // OPTION 5: Ultimate fallback - placeholder
    if (newImages.length === 0) {
      console.log('No image sources available, using placeholder');
      newImages = ['/placeholder-property.jpg'];
    }
    
    if (newImages.length > 0) {
      setDisplayImages(newImages);
      setImagesProcessed(true);
    }
  }, [
    imagesProcessed, 
    displayImages.length, 
    propertyImages, 
    providedImages, 
    imageUrl, 
    additionalImages, 
    platformId, 
    getDirectApiImageUrl
  ]);
  
  // Navigation handlers
  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % displayImages.length);
  }, [displayImages.length]);
  
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + displayImages.length) % displayImages.length);
  }, [displayImages.length]);
  
  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };
  
  // Configure swipe handlers with visual feedback
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      goToNext();
      setSwipeDirection(null);
    },
    onSwipedRight: () => {
      goToPrevious();
      setSwipeDirection(null);
    },
    onSwiping: (event) => {
      setSwipeDirection(event.dir);
    },
    onSwiped: () => {
      setSwipeDirection(null);
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    trackTouch: true,
    delta: 10, // Minimum swipe distance
    swipeDuration: 500, // Maximum time for swipe
  });
  
  // If we're loading images from API, show a loading state
  if (platformId && loadingImages && displayImages.length <= 1) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] md:h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="md:col-span-4 text-center flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-gray-600">Loading property images...</p>
        </div>
      </div>
    );
  }
  
  // If there are no images available, show an empty state
  if (displayImages.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] md:h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="md:col-span-4 text-center">
          <p className="text-gray-600">No images available for this property</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* Desktop gallery grid */}
      <div className="hidden md:grid grid-cols-4 gap-2 h-[500px] mb-8">
        {/* Main large image (first column span 2 rows) */}
        <div className="col-span-2 row-span-2 relative rounded-tl-lg rounded-bl-lg overflow-hidden h-full">
          <img 
            src={displayImages[0]} 
            alt={`${propertyName} - main view`}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setFullScreen(true)}
            onError={(e) => {
              // Try to fetch from Hospitable API if image fails to load
              handleImageLoadError(0, e.currentTarget.src);
              
              // Check for rate limits before retrying
              const retryAttempts = apiRetryLimits[0] || 0;
              
              if (retryAttempts < 2 && platformId) {
                console.log(`Image load error, attempting to fetch from API using platformId: ${platformId}`);
                const { customerId, listingId } = extractPropertyIds(platformId);
                if (customerId && listingId) {
                  console.log(`Fetching from API: customerId=${customerId}, listingId=${listingId}`);
                  // Add backoff delay based on retry attempts (exponential backoff)
                  const backoffDelay = Math.pow(2, retryAttempts) * 1000;
                  const cacheParam = `&cb=${Date.now()}&retry=${retryAttempts}&backoff=${backoffDelay}`;
                  
                  setTimeout(() => {
                    if (e.currentTarget) {
                      e.currentTarget.src = `/api/hospitable/property-images/${customerId}/${listingId}?pos=0${cacheParam}`;
                    }
                  }, backoffDelay);
                }
              } else {
                // After multiple failures or no platformId, use placeholder
                e.currentTarget.src = '/placeholder-property.jpg';
              }
            }}
          />
        </div>
        
        {Array.from({ length: 4 }).map((_, index) => {
          // Calculate actual image index (add 1 to skip main image)
          const imageIndex = index + 1;
          // Check if we have this image in our array
          const hasImage = displayImages.length > imageIndex;
          
          // Always use the first image instead of making API calls
          // This prevents hitting rate limits
          let imageUrl: string;
          
          if (hasImage) {
            // Use the image we have from our display images array
            imageUrl = displayImages[imageIndex];
          } else if (displayImages.length > 0) {
            // If we don't have enough images, duplicate the first one
            imageUrl = displayImages[0];
          } else {
            // If no images available, use placeholder
            imageUrl = '/placeholder-property.jpg';
          }
              
          return (
            <div 
              key={`gallery-thumb-${index}`} 
              className={`h-full ${index === 3 ? 'relative' : ''} ${index === 0 ? 'rounded-tr-lg' : ''} ${index === 3 ? 'rounded-br-lg' : ''}`}
            >
              <img 
                src={imageUrl} 
                alt={`${propertyName} - view ${index + 2}`}
                className={`w-full h-full object-cover cursor-pointer ${index === 0 ? 'rounded-tr-lg' : ''} ${index === 3 ? 'rounded-br-lg' : ''}`}
                onClick={() => {
                  // Set the image we want to show in fullscreen
                  setCurrentIndex(imageIndex);
                  setFullScreen(true);
                }}
                onError={(e) => {
                  console.log(`Thumbnail ${index} failed to load`);
                  // Try one more time with a direct API call with a specific position
                  if (platformId) {
                    const { customerId, listingId } = extractPropertyIds(platformId);
                    if (customerId && listingId) {
                      console.log(`Retrying thumbnail ${index} with direct API call and position=${imageIndex}`);
                      e.currentTarget.src = `/api/hospitable/property-images/${customerId}/${listingId}?pos=${imageIndex}&refresh=true&t=${Date.now()}`;
                    } else if (displayImages[0] && displayImages[0] !== imageUrl) {
                      // If still failing and we have a main image, use that
                      console.log(`Using main image for thumbnail ${index}`);
                      e.currentTarget.src = displayImages[0];
                    } else {
                      // Fallback to placeholder
                      e.currentTarget.src = '/placeholder-property.jpg';
                    }
                  } else {
                    // Fallback to placeholder
                    e.currentTarget.src = '/placeholder-property.jpg';
                  }
                }}
              />
              {index === 3 && displayImages.length > 5 && (
                <Button 
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullScreen(true);
                  }}
                  className="absolute right-4 bottom-4 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 px-4 py-2 rounded-lg shadow-sm transition-all"
                >
                  <Grid className="mr-2 h-4 w-4" /> Show all photos
                </Button>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Mobile-specific gallery view for non-fullscreen display */}
      <div className="md:hidden relative mb-4">
        <div 
          className={`relative h-[300px] w-full overflow-hidden rounded-lg swipe-area ${swipeDirection ? `swiping-${swipeDirection.toLowerCase()}` : ''}`} 
          {...swipeHandlers}
        >
          <img 
            src={displayImages[0]} 
            alt={`${propertyName} - main view`}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setFullScreen(true)}
            onError={(e) => {
              // Try to fetch from Hospitable API if image fails to load
              handleImageLoadError(0, e.currentTarget.src);
              
              // Check for rate limits before retrying
              const retryAttempts = apiRetryLimits[0] || 0;
              
              if (retryAttempts < 2 && platformId) {
                console.log(`Image load error, attempting to fetch from API using platformId: ${platformId}`);
                const { customerId, listingId } = extractPropertyIds(platformId);
                if (customerId && listingId) {
                  console.log(`Fetching from API: customerId=${customerId}, listingId=${listingId}`);
                  // Add backoff delay based on retry attempts (exponential backoff)
                  const backoffDelay = Math.pow(2, retryAttempts) * 1000;
                  const cacheParam = `&cb=${Date.now()}&retry=${retryAttempts}&backoff=${backoffDelay}`;
                  
                  setTimeout(() => {
                    if (e.currentTarget) {
                      e.currentTarget.src = `/api/hospitable/property-images/${customerId}/${listingId}?pos=0${cacheParam}`;
                    }
                  }, backoffDelay);
                }
              } else {
                // After multiple failures or no platformId, use placeholder
                e.currentTarget.src = '/placeholder-property.jpg';
              }
            }}
          />
          
          {displayImages.length > 1 && (
            <>
              {/* Photo counter indicator */}
              <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                1 / {displayImages.length}
              </div>
              
              {/* Show all photos button */}
              <Button 
                variant="ghost"
                onClick={() => setFullScreen(true)}
                className="absolute right-4 bottom-4 bg-white/90 hover:bg-white text-gray-800 px-3 py-1 rounded-full text-sm shadow-sm"
              >
                <Grid className="h-3.5 w-3.5 mr-1" /> All photos
              </Button>
              
              {/* Swipe indicators for mobile */}
              <div className="gallery-indicator left mobile-tap-area">
                <ChevronLeft className="h-5 w-5 text-white" />
              </div>
              <div className="gallery-indicator right mobile-tap-area">
                <ChevronRight className="h-5 w-5 text-white" />
              </div>
              
              {/* Subtle swipe hint */}
              <div className={`absolute inset-0 pointer-events-none bg-gradient-to-r from-black/5 via-transparent to-black/5 opacity-0 transition-opacity duration-300 ${swipeDirection ? 'opacity-30' : ''}`}></div>
            </>
          )}
        </div>
      </div>
      
      {/* Removed refresh button to prevent rate limiting */}

      {/* Full-screen gallery with zoom capabilities */}
      <Dialog open={fullScreen} onOpenChange={setFullScreen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[95vh] p-0">
          <DialogHeader className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center">
            <DialogTitle className="text-white drop-shadow-md">{propertyName}</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setFullScreen(false)}
              className="text-white hover:bg-black/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </DialogHeader>
          
          <div className="relative h-full flex flex-col">
            {/* Main image area with pinch zoom */}
            <div 
              className={`flex-1 relative flex items-center justify-center bg-black swipe-area ${swipeDirection ? `swiping-${swipeDirection.toLowerCase()}` : ''}`}
              {...swipeHandlers}
            >
              {/* Swipe direction indicators */}
              <div className="gallery-indicator left">
                <ChevronLeft className="h-6 w-6 text-white" />
              </div>
              <div className="gallery-indicator right">
                <ChevronRight className="h-6 w-6 text-white" />
              </div>
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={3}
                centerOnInit={true}
                wheel={{ step: 0.05 }}
                doubleClick={{ mode: "reset" }}
                panning={{ disabled: isMobile, velocityDisabled: true }}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute top-4 right-4 flex gap-2 z-40">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => zoomIn()}
                        className="bg-black/30 text-white hover:bg-black/50 rounded-full p-2"
                      >
                        <ZoomIn className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => zoomOut()}
                        className="bg-black/30 text-white hover:bg-black/50 rounded-full p-2"
                      >
                        <ZoomOut className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => resetTransform()}
                        className="bg-black/30 text-white hover:bg-black/50 rounded-full p-2"
                      >
                        <span className="text-xs font-medium">Reset</span>
                      </Button>
                    </div>
                    <TransformComponent
                      wrapperStyle={{ width: "100%", height: "100%" }}
                      contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <img 
                        src={
                          // If we have the image in our array, use it
                          displayImages[currentIndex] || 
                          // Otherwise use the main image if we have it to prevent unnecessary API calls
                          (displayImages.length > 0 ? displayImages[0] : '/placeholder-property.jpg')
                        } 
                        alt={`${propertyName} - gallery view ${currentIndex + 1}`}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          console.log(`Fullscreen image ${currentIndex} failed to load`);
                          
                          // Use the primary image if available instead of making API calls
                          if (currentIndex > 0 && displayImages[0]) {
                            console.log(`Using primary image for fullscreen view index ${currentIndex}`);
                            e.currentTarget.src = displayImages[0];
                          } else {
                            // Final fallback
                            e.currentTarget.src = '/placeholder-property.jpg';
                          }
                        }}
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 rounded-full p-2 z-40"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 rounded-full p-2 z-40"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
              
              {/* Mobile image counter */}
              <div className="md:hidden absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm z-40">
                {currentIndex + 1} / {displayImages.length}
              </div>
            </div>
            
            {/* Thumbnails */}
            <div className="h-20 bg-black py-2 px-4 flex gap-2 overflow-x-auto">
              {displayImages.map((img, idx) => (
                <div 
                  key={idx}
                  className={`h-16 w-24 flex-shrink-0 cursor-pointer border-2 ${idx === currentIndex ? 'border-white' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  onClick={() => handleThumbnailClick(idx)}
                >
                  <img 
                    src={img} 
                    alt={`${propertyName} thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // For thumbnails, just use the primary image if available, otherwise placeholder
                      if (idx > 0 && displayImages[0]) {
                        e.currentTarget.src = displayImages[0];
                      } else {
                        e.currentTarget.src = '/placeholder-property.jpg';
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .swipe-area:hover .gallery-indicator {
          opacity: 1;
        }
        
        .gallery-indicator {
          background-color: rgba(0, 0, 0, 0.3);
        }
      `}} />
    </>
  );
};

export default PropertyGallery;