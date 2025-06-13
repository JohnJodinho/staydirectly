import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { getProperty, getPropertyReviews } from '@/lib/api';
import { getIdFromSlug, slugify } from '@/lib/slugify';
import RevyoosIframe from '@/components/RevyoosIframe';
import RevyoosScriptWidget from '@/components/RevyoosScriptWidget';
import RevyoosDirectEmbed from '@/components/RevyoosDirectEmbed';
import PropertyGallery from '@/components/PropertyGallery';
import AirbnbImageOptimizer from '@/components/AirbnbImageOptimizer';
import GoogleMapView from '@/components/GoogleMapView';
import DynamicReviewWidget from '@/components/DynamicReviewWidget';
import NearbyPlaces from '@/components/NearbyPlaces';
// Function to convert amenity IDs to display names
const getAmenityDisplayName = (amenityId: string): string => {
  const amenityMap: Record<string, string> = {
    "wifi": "WiFi",
    "pool": "Swimming Pool",
    "hottub": "Hot Tub",
    "ac": "Air Conditioning",
    "kitchen": "Full Kitchen",
    "tv": "Smart TV",
    "washer": "Washer/Dryer",
    "parking": "Free Parking",
    "workspace": "Workspace",
    "bbq": "BBQ Grill",
    "patio": "Patio/Balcony",
    "pets": "Pet Friendly",
  };
  
  return amenityMap[amenityId] || amenityId;
};
import { 
  Bath,
  Bed,
  Briefcase,
  Building, 
  Car,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Droplet,
  Dumbbell, 
  FlameIcon,
  Heart,
  MapPin,
  Share,
  Shield,
  ShieldCheck,
  ShowerHead, 
  Snowflake, 
  Star,
  Sun,
  Tv, 
  UserCircle2,
  Utensils, 
  Wifi
} from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice, formatDate } from '@/lib/utils';
import { Meta, PropertyStructuredData } from '@/lib/seo';

// Generate mock bedroom details if they don't exist in the property data
const generateMockBedroomDetails = (property: any) => {
  const bedTypes = ['king', 'queen', 'double', 'single', 'sofa bed', 'bunk bed', 'air mattress'];
  const bedroomNames = ['Master Bedroom', 'Guest Bedroom', 'Kids Room', 'Bedroom', 'Cozy Bedroom'];
  const bedroomImages = [
    'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
    'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
    'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3',
    'https://images.unsplash.com/photo-1558882224-dda166733046?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3'
  ];
  
  // Create mock bedrooms based on the number of bedrooms in the property
  const numBedrooms = property.bedrooms || 2;
  return Array.from({ length: numBedrooms }, (_, i) => {
    // Randomize number of beds between 1 and 2
    const numBeds = Math.floor(Math.random() * 2) + 1;
    
    return {
      id: i + 1,
      name: i < bedroomNames.length ? bedroomNames[i] : `${bedroomNames[4]} ${i + 1}`,
      beds: Array.from({ length: numBeds }, (_, j) => {
        // Select a random bed type
        const bedType = bedTypes[Math.floor(Math.random() * bedTypes.length)];
        return { type: bedType, count: 1 };
      }),
      image: bedroomImages[i % bedroomImages.length]
    };
  });
};

const PropertyDetail: React.FC = () => {
  const [match, params] = useRoute('/property/:slug');
  const propertyId = match ? getIdFromSlug(params.slug) : 0;
  
  // Debug log in the component
  console.log('Rendering PropertyDetail component');
  
  const [isHeartFilled, setIsHeartFilled] = useState(false);
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('1 guest');
  
  const { data: property, isLoading: isLoadingProperty } = useQuery({
    queryKey: [`/api/properties/${propertyId}`],
    queryFn: () => getProperty(propertyId),
    enabled: !!propertyId
  });
  
  // Debug log after data is loaded
  React.useEffect(() => {
    if (property) {
      console.log('Property data:', property);
    }
  }, [property]);
  
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: [`/api/properties/${propertyId}/reviews`],
    queryFn: () => getPropertyReviews(propertyId),
    enabled: !!propertyId,
  });
  
  // No need for script handling here since we'll use the RevyoosScriptWidget component
  
  const toggleHeart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsHeartFilled(!isHeartFilled);
  };
  
  const handleBooking = () => {
    // Booking logic would go here
    alert('Booking functionality would be implemented here');
  };
  
  if (isLoadingProperty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 max-w-md mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-[500px] bg-gray-200 rounded-lg mb-8"></div>
          {/* More loading skeleton elements would go here */}
        </div>
      </div>
    );
  }
  
  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-red-500 mb-2">Property Not Found</h1>
            <p>The property you are looking for does not exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Get capacity information from property's capacity object or fallback to default properties
  const getCapacityData = () => {
    // Default to standard property fields
    let capacityData = {
      max: property.maxGuests,
      bedrooms: property.bedrooms,
      beds: property.bedrooms, // Fallback to bedrooms count
      bathrooms: property.bathrooms
    };
    
    // If property has a capacity object from the API, use those values
    if (property.capacity) {
      console.log("Using API capacity data:", property.capacity);
      capacityData = {
        max: property.capacity.max || capacityData.max,
        bedrooms: property.capacity.bedrooms || capacityData.bedrooms,
        beds: property.capacity.beds || capacityData.beds,
        bathrooms: property.capacity.bathrooms || capacityData.bathrooms
      };
    } else {
      console.log("No API capacity data found, using property fields");
    }
    
    return capacityData;
  };
  
  // Get capacity data for this property
  const capacityData = getCapacityData();
  
  // Calculate total price for a 6-night stay
  const nightlyTotal = property.price * 6;
  const cleaningFee = 85;
  const serviceFee = 0;
  const totalPrice = nightlyTotal + cleaningFee + serviceFee;
  
  // Get amenity icons
  const getAmenityIcon = (amenity: string) => {
    // Comprehensive icon mapping with good fallbacks
    const iconMap: Record<string, React.ReactNode> = {
      // Standard amenities by display name
      "WiFi": <Wifi className="h-5 w-5 text-gray-600" />,
      "High-speed WiFi": <Wifi className="h-5 w-5 text-gray-600" />,
      "Free WiFi": <Wifi className="h-5 w-5 text-gray-600" />,
      "Air conditioning": <Snowflake className="h-5 w-5 text-gray-600" />,
      "TV": <Tv className="h-5 w-5 text-gray-600" />,
      "55\" HDTV with Netflix": <Tv className="h-5 w-5 text-gray-600" />,
      "Smart TV": <Tv className="h-5 w-5 text-gray-600" />,
      "Kitchen": <Utensils className="h-5 w-5 text-gray-600" />,
      "Fully equipped kitchen": <Utensils className="h-5 w-5 text-gray-600" />,
      "Washer": <ShowerHead className="h-5 w-5 text-gray-600" />,
      "Washer/dryer": <ShowerHead className="h-5 w-5 text-gray-600" />,
      "Free dryer – In unit": <ShowerHead className="h-5 w-5 text-gray-600" />,
      "Elevator": <Building className="h-5 w-5 text-gray-600" />,
      "Elevator in building": <Building className="h-5 w-5 text-gray-600" />,
      "Pool": <Droplet className="h-5 w-5 text-gray-600" />,
      "Swimming Pool": <Droplet className="h-5 w-5 text-gray-600" />,
      "Shared outdoor pool": <Droplet className="h-5 w-5 text-gray-600" />,
      "Hot Tub": <Droplet className="h-5 w-5 text-gray-600" />,
      "Shared outdoor pool - available all year, open specific hours, heated": <Droplet className="h-5 w-5 text-gray-600" />,
      "Dedicated workspace": <Briefcase className="h-5 w-5 text-gray-600" />,
      "Work area": <Briefcase className="h-5 w-5 text-gray-600" />,
      "Free parking": <Car className="h-5 w-5 text-gray-600" />,
      "Parking": <Car className="h-5 w-5 text-gray-600" />,
      "Gym": <Dumbbell className="h-5 w-5 text-gray-600" />,
      "Gym access": <Dumbbell className="h-5 w-5 text-gray-600" />,
      "Security cameras on property": <Shield className="h-5 w-5 text-gray-600" />,
      "Security system": <Shield className="h-5 w-5 text-gray-600" />,
      "24/7 security": <ShieldCheck className="h-5 w-5 text-gray-600" />,
      "Exterior security cameras on property": <ShieldCheck className="h-5 w-5 text-gray-600" />,
      "Carbon monoxide alarm": <Shield className="h-5 w-5 text-gray-600" />,
      "Fire extinguisher": <FlameIcon className="h-5 w-5 text-gray-600" />,
      "Smoke alarm": <ShieldCheck className="h-5 w-5 text-gray-600" />,
      "First aid kit": <Shield className="h-5 w-5 text-gray-600" />,
      "Patio": <Sun className="h-5 w-5 text-gray-600" />,
      "Outdoor space": <Sun className="h-5 w-5 text-gray-600" />,
      "Patio or balcony": <Sun className="h-5 w-5 text-gray-600" />,
      "BBQ grill": <FlameIcon className="h-5 w-5 text-gray-600" />,
      "Backyard": <Sun className="h-5 w-5 text-gray-600" />,
      "Garden": <Sun className="h-5 w-5 text-gray-600" />,
      "Pet friendly": <Heart className="h-5 w-5 text-gray-600" />,
      
      // ID-based amenities (from featuredAmenities)
      "wifi": <Wifi className="h-5 w-5 text-gray-600" />,
      "pool": <Droplet className="h-5 w-5 text-gray-600" />,
      "hottub": <Droplet className="h-5 w-5 text-gray-600" />,
      "ac": <Snowflake className="h-5 w-5 text-gray-600" />,
      "kitchen": <Utensils className="h-5 w-5 text-gray-600" />,
      "tv": <Tv className="h-5 w-5 text-gray-600" />,
      "washer": <ShowerHead className="h-5 w-5 text-gray-600" />,
      "dryer": <ShowerHead className="h-5 w-5 text-gray-600" />,
      "parking": <Car className="h-5 w-5 text-gray-600" />,
      "workspace": <Briefcase className="h-5 w-5 text-gray-600" />,
      "bbq": <FlameIcon className="h-5 w-5 text-gray-600" />,
      "patio": <Sun className="h-5 w-5 text-gray-600" />,
      "pets": <Heart className="h-5 w-5 text-gray-600" />,
      "gym": <Dumbbell className="h-5 w-5 text-gray-600" />,
      "security": <ShieldCheck className="h-5 w-5 text-gray-600" />,
      "elevator": <Building className="h-5 w-5 text-gray-600" />,
    };
    swtwt,  // First try to find an exact match in the map
    if (iconMap[amenity]) {
      return iconMap[amenity];
    }
    
    // If no exact match, try to find a partial match based on key substrings
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes('wifi') || lowerAmenity.includes('internet'))
      return <Wifi className="h-5 w-5 text-gray-600" />;
    if (lowerAmenity.includes('tv') || lowerAmenity.includes('television') || lowerAmenity.includes('netflix'))
      return <Tv className="h-5 w-5 text-gray-600" />;
    if (lowerAmenity.includes('kitchen') || lowerAmenity.includes('cook') || lowerAmenity.includes('dish'))
      return <Utensils className="h-5 w-5 text-gray-600" />;
    if (lowerAmenity.includes('washer') || lowerAmenity.includes('dryer') || lowerAmenity.includes('laundry'))
      return <ShowerHead className="h-5 w-5 text-gray-600" />;
    if (lowerAmenity.includes('pool') || lowerAmenity.includes('hot tub') || lowerAmenity.includes('spa') || lowerAmenity.includes('jacuzzi'))
      return <Droplet className="h-5 w-5 text-gray-600" />;
    if (lowerAmenity.includes('air') || lowerAmenity.includes('ac') || lowerAmenity.includes('heat'))
      return <Snowflake className="h-5 w-5 text-gray-600" />;
    if (lowerAmenity.includes('parking') || lowerAmenity.includes('garage') || lowerAmenity.includes('car'))
      return <Car className="h-5 w-5 text-gray-600" />;
    if (lowerAmenity.includes('work') || lowerAmenity.includes('desk') || lowerAmenity.includes('office'))
      return <Briefcase className="h-5 w-5 text-gray-600" />;
    if (lowerAmenity.includes('patio') || lowerAmenity.includes('balcony') || lowerAmenity.includes('garden') || lowerAmenity.includes('outdoor'))
      return <Sun className="h-5 w-5 text-gray-600" />;
    if (lowerAmenity.includes('security') || lowerAmenity.includes('safe') || lowerAmenity.includes('camera') || lowerAmenity.includes('alarm'))
      return <ShieldCheck className="h-5 w-5 text-gray-600" />;
    if (lowerAmenity.includes('pet') || lowerAmenity.includes('dog') || lowerAmenity.includes('cat'))
      return <Heart className="h-5 w-5 text-gray-600" />;
    if (lowerAmenity.includes('gym') || lowerAmenity.includes('fitness') || lowerAmenity.includes('exercise'))
      return <Dumbbell className="h-5 w-5 text-gray-600" />;
    if (lowerAmenity.includes('elevator') || lowerAmenity.includes('lift'))
      return <Building className="h-5 w-5 text-gray-600" />;
    if (lowerAmenity.includes('bbq') || lowerAmenity.includes('grill') || lowerAmenity.includes('barbecue'))
      return <FlameIcon className="h-5 w-5 text-gray-600" />;
    
    // Default fallback icon if no matches found
    return <Star className="h-5 w-5 text-gray-600" />;
  };
  
  // Breadcrumb items
  // Extract state from location (assuming format like "Beverly Hills, CA")
  const locationParts = property.location.split(',');
 t,wt, const state = locationParts.length > 1 ? locationParts[1].trim() : 'CA';
  
waw,  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: state, href: `/search?q=${state}` },
    { label: property.city, href: `/city/${property.city}` },
    { label: property.name }
  ];
  
  return (WA,
    <>
      <Meta 
        title={`${property.title || property.name} in ${property.city}${property.state ? `, ${property.state}` : ''} | StayDirectly`}
        description={property.description.substring(0, 160)}
        canonical={`/property/${property.id}-${slugify(property.title || property.name)}`}
        image={property.imageUrl}
        type="product"
      />
      
      <PropertyStructuredData
        name={property.title || property.name}
        description={property.description.substring(0, 160)}
        image={property.imageUrl}
        price={property.price}
        ratingValue={property.rating || 0}
 tzw,at,       reviewCount={property.reviewCount || 0}
        address={property.location}
      />
      
      <div className="container mx-auto px-4 pt-6">
        {/* Breadcrumbs */}
        <nav>
          <Breadcrumb items={breadcrumbItems} />
        </nav>

        {/* Property Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{property.title || property.name}</h1>
          <div className="flex flex-wrap items-center text-sm gap-y-2 justify-between">
            <div className="flex items-center mr-4 text-gray-600">
              <MapPin className="h-4 w-4 mr-1" />
              <span>
                {property.city || 'Unknown City'}
                {property.state && `, ${property.state}`}
                {property.country && `, ${property.country}`}
              </span>
            </div>
            
            {/* Empty space where duplicated Why Book Direct used to be */}
            <div className="flex-1"></div>
            
            <div className="flex">
              <button 
                onClick={toggleHeart}
                className="flex items-center text-gray-600 hover:text-primary transition-colors hover-scale"
              >
                <Heart className={`h-4 w-4 mr-1 ${isHeartFilled ? 'fill-current text-red-500 heart-beat active' : 'heart-beat'}`} />
                <span>Save</span>
              </button>
              <button className="flex items-center text-gray-600 hover:text-primary transition-colors ml-4 hover-scale">
                <Share className="h-4 w-4 mr-1 icon-bounce" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Property Gallery - Full Width */}
        <div className="mb-8">
          {/* Use our enhanced PropertyGallery component with Hospitable API integration */}
          <PropertyGallery 
            propertyName={property.name}
            platformId={property.platformId || property.hospitablePlatformId || 
              // For property ID 19, use the known UUID format for the Dual Wight House
              (property.id === 19 ? 
                "24RZHJ:461a318e-a2fa-4fd9-9eae-2ab6793de8a3" : 
                `24RZHJ:${property.id}`
              )
            } 
            defaultCustomerId="24RZHJ" // Default customer ID if needed
            // Pass database stored images directly to avoid unnecessary API calls
            imageUrl={property.imageUrl}
            additionalImages={property.additionalImages || []}
          />
        </div>

        {/* Main content grid - After Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column for property details */}
          <div className="lg:col-span-2">
            {/* Property Title and Host Info */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">
                Entire home in {property.city || 'Unknown Location'}
                {property.state && `, ${property.state}`}
                {!property.state && property.country && `, ${property.country}`}
              </h2>
              <p className="text-gray-600 mb-4 flex items-center flex-wrap gap-3">
                <span className="flex items-center">
                  <UserCircle2 className="h-4 w-4 mr-1.5 text-gray-500" />
                  {capacityData.max} guests
                </span>
                <span className="flex items-center">
                  <DoorOpen className="h-4 w-4 mr-1.5 text-gray-500" />
                  {capacityData.bedrooms} {capacityData.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
                </span>
                <span className="flex items-center">
                  <Bed className="h-4 w-4 mr-1.5 text-gray-500" />
                  {capacityData.beds} {capacityData.beds === 1 ? 'bed' : 'beds'}
                </span>
                <span className="flex items-center">
                  <Bath className="h-4 w-4 mr-1.5 text-gray-500" />
                  {typeof capacityData.bathrooms === 'number' && capacityData.bathrooms % 1 !== 0 
                    ? capacityData.bathrooms.toFixed(1) 
                    : capacityData.bathrooms} 
                  {capacityData.bathrooms === 1 ? 'bath' : 'baths'}
                </span>
              </p>
              
              {/* "Why Book Direct" items in horizontal layout + Rating */}
              <div className="flex flex-wrap items-center mb-6 gap-3">
                {/* Item 1 - 5-Star Experience */}
                <div className="inline-flex items-center bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm hover-scale transition-all">
                  <div className="bg-amber-50 p-1.5 rounded-full mr-2">
                    <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 6L14.25 10.5L19.5 11.25L15.75 14.75L16.75 20L12 17.5L7.25 20L8.25 14.75L4.5 11.25L9.75 10.5L12 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/>
                    </svg>
                  </div>
                  <span className="text-gray-900 text-sm font-medium">5-Star Experience</span>
                </div>
                
                {/* Item 2 - Book Direct and Save */}
                <div className="inline-flex items-center bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm hover-scale transition-all">
                  <div className="bg-green-50 p-1.5 rounded-full mr-2">
                    <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-gray-900 text-sm font-medium">Book Direct & Save</span>
                </div>
                
                {/* Item 3 - Self Check-in */}
                <div className="inline-flex items-center bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm hover-scale transition-all">
                  <div className="bg-purple-50 p-1.5 rounded-full mr-2">
                    <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-gray-900 text-sm font-medium">Self Check-in</span>
                </div>

                {/* Rating */}
                <div className="flex items-center ml-auto">
                  <Star className="h-5 w-5 text-amber-500 fill-current" />
                  <span className="font-bold text-lg mx-2">{property.rating?.toFixed(1)}</span>
                  <span className="text-gray-600">({property.reviewCount} reviews)</span>
                </div>
              </div>
              
              <div className="flex items-start border-t border-gray-200 pt-4">
                <div className="w-12 h-12 overflow-hidden rounded-full mr-4 flex-shrink-0">
                  <AirbnbImageOptimizer 
                    imageUrl={property.hostImage || 'https://randomuser.me/api/portraits/men/32.jpg'} 
                    alt={property.hostName} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <h3 className="font-medium">Hosted by {property.hostName}</h3>
                  <p className="text-gray-600 text-sm">Superhost · 3 years hosting</p>
                </div>
              </div>
            </div>
            
            {/* Property Description */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <div className="prose max-w-none text-gray-600">
                {/* Display the first part of the description (truncated to 500 characters) */}
                <p>
                  {property.description && property.description.length > 500 
                    ? `${property.description.substring(0, 500)}...` 
                    : property.description}
                </p>
              </div>
              
              {property.description && property.description.length > 500 && (
                <Accordion type="single" collapsible className="w-full mt-4 border-t pt-4">
                  <AccordionItem value="description" className="border-none">
                    <AccordionTrigger className="py-2 font-medium text-primary">
                      Read full description
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600">
                      <div className="space-y-4">
                        {/* Handle various types of line breaks and create proper paragraphs 
                            Skip the first 500 characters that are already shown above */}
                        {property.description.substring(500).split(/\n{2,}/).map((paragraph, index) => {
                          // Skip empty paragraphs that might result from substring operation
                          if (!paragraph.trim()) return null;
                          return (
                            <p key={index}>
                              {paragraph.split('\n').map((line, lineIndex) => (
                                <React.Fragment key={lineIndex}>
                                  {lineIndex > 0 && <br />}
                                  {line}
                                </React.Fragment>
                              ))}
                            </p>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>

            {/* Amenities */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h2 className="text-xl font-bold mb-6">What this place offers</h2>
              
              {/* Top 6 Amenities Grid Layout - Always visible */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 mb-6">
                {/* Use featuredAmenities if available, otherwise first 6 from all amenities */}
                {(property.featuredAmenities?.length > 0 
                  ? property.featuredAmenities.slice(0, 6) 
                  : property.amenities?.slice(0, 6) || []
                ).map((amenity, index) => (
                  <div key={index} className="flex items-center">
                    {getAmenityIcon(amenity)}
                    <span className="ml-3">{getAmenityDisplayName(amenity)}</span>
                  </div>
                ))}
              </div>
              
              {/* Expanded Amenities Section - Shows when amenitiesExpanded is true */}
              {amenitiesExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 mb-6 border-t pt-6">
                  {property.amenities?.filter(amenity => 
                    !(property.featuredAmenities?.slice(0, 6).includes(amenity))
                  ).map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      {getAmenityIcon(amenity)}
                      <span className="ml-3">{getAmenityDisplayName(amenity)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Show/Hide All Amenities Button */}
              <Button 
                variant="outline" 
                className="border border-gray-800 hover:bg-gray-100 text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors hover-scale" 
                onClick={() => setAmenitiesExpanded(!amenitiesExpanded)}
              >
                {amenitiesExpanded 
                  ? "Hide amenities" 
                  : `Show all ${property.amenities?.length || 0} amenities`}
              </Button>
            </div>

            {/* Where you'll sleep */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Where you'll sleep</h2>
                <div className="text-sm text-gray-600">
                  {property.bedrooms > 2 && (
                    <div className="flex items-center gap-2">
                      <span>1 / {property.bedrooms}</span>
                      <div className="flex gap-1">
                        <button className="bg-white border border-gray-300 rounded-full p-1 disabled:opacity-50 transition-all hover:bg-gray-50 hover-scale">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button className="bg-white border border-gray-300 rounded-full p-1 transition-all hover:bg-gray-50 hover-scale">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Grid layout for bedrooms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(property.bedroomDetails?.length ? property.bedroomDetails : generateMockBedroomDetails(property)).slice(0, 2).map((bedroom, index) => (
                  <div key={index} className="h-full">
                    <div className="overflow-hidden h-full flex flex-col">
                      <div className="aspect-video relative overflow-hidden bg-gray-100 mb-4 rounded-lg">
                        <AirbnbImageOptimizer 
                          imageUrl={bedroom.image || property.imageUrl} 
                          alt={`${bedroom.name} in ${property.name}`}
                          className="w-full h-full hover-scale transition-transform duration-700"
                        />
                      </div>
                      <h3 className="font-medium text-base mb-1">{bedroom.name}</h3>
                      <div className="text-gray-600 text-sm">
                        {bedroom.beds.map((bed, bedIndex) => (
                          <span key={bedIndex}>
                            {bedIndex > 0 && ', '}
                            {bed.count} {bed.count > 1 ? bed.type + 's' : bed.type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* No "show all bedrooms" button */}
            </div>


            {/* Reviews Section with Revyoos Widget */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6 overflow-visible">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-xl font-bold">Guest Reviews</h2>
                <div className="flex items-center mt-2">
                  <Star className="h-5 w-5 text-amber-500 fill-current mr-1" />
                  <span className="font-semibold mr-1">{property.rating?.toFixed(1) || '4.9'}</span>
                  <span className="text-gray-600">({property.reviewCount || '84'} reviews)</span>
                </div>
              </div>
              
              {/* Using the RevyoosDirectEmbed component with fallback UI */}
              <div className="relative w-full min-h-[600px]">
                <DynamicReviewWidget 
                  embedCode={property.reviewWidgetCode} 
                  className="w-full min-h-[600px]" 
                />
              </div>
            </div>
            
            {/* Location Map - With Map and Neighborhood Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h3 className="text-xl font-bold mb-4">Location</h3>
              <div className="aspect-[16/9] rounded-lg mb-4 overflow-hidden">
                <div className="w-full h-[400px] lg:h-[calc(100vh-240px)] lg:min-h-[600px] sticky top-6 bg-gray-100 rounded-lg shadow-sm overflow-hidden">
                  {property ? (
                    <GoogleMapView
                      properties={property} 
                      height="100%"
                      center={[property.latitude, property.longitude] } // Or default to some coordinates
                      zoom={14} // ✅ Optional: zoom in slightly more for single property
                      onMarkerClick={(clickedProperty) => {
                        

                        // Scroll the main grid container into view
                        const gridElement = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3.gap-8');
                        if (gridElement) {
                          gridElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }

                        // Optional: clear selected state after some time
                        setTimeout(() => {
                          
                        }, 3000);
                      }}

                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100">
                      <p className="text-gray-500">Loading map...</p>
                    </div>
                  )}

                  {/* Info overlay */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-sm z-[1000]">
                    <h3 className="font-medium text-sm md:text-base mb-1">
                      {property?.location || "Property location"}
                    </h3>

                    <p className="text-xs md:text-sm text-gray-600">
                      Showing 1 property in this area
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-gray-600">
                <p className="mb-2">
                  <strong>
                    {property.location && `${property.location}, `} 
                  </strong>
                </p>
                <p className="mb-4">Located in one of {property.city || 'the city'}'s most sought-after neighborhoods, with easy access to local attractions, dining, and shopping.</p>
                
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <h4 className="font-semibold mb-2">Neighborhood info:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm">Walk Score: 92/100</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm">Transit Score: 78/100</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                      <span className="text-sm">Bike Score: 85/100</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                      <span className="text-sm">Safety Score: 90/100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nearby Landmarks and Points of Interest */}
            
            <NearbyPlaces latitude={property.latitude} longitude={property.longitude} />
            {/* FAQ Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h2 className="text-xl font-bold mb-6">Frequently asked questions</h2>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-lg font-medium">
                    What are the check-in and check-out times?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    Check-in is after 3:00 PM and check-out is before 11:00 AM. Self check-in with a keypad is available. We'll send you the code 24 hours before your arrival.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-lg font-medium">
                    Is parking available?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    Paid parking garage is available nearby for $25 per day. Street parking is limited but available. We recommend using public transportation as the subway station is only a 5-minute walk away.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-lg font-medium">
                    What are the house rules?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    We ask that you treat our home with respect. No smoking, parties, or events are allowed. Please be mindful of noise levels after 10 PM to respect our neighbors. Keep the property clean and report any damages promptly.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-lg font-medium">
                    What is the cancellation policy?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    Flexible cancellation: Full refund if cancelled at least 7 days before check-in. 50% refund if cancelled at least 3 days before check-in. No refunds for cancellations made less than 3 days before check-in.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-lg font-medium">
                    Things to know
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    <ul className="list-disc pl-5 space-y-2">
                      <li>The property is located on the 3rd floor with elevator access</li>
                      <li>Quiet hours from 10 PM to 8 AM</li>
                      <li>Please remove shoes when inside</li>
                      <li>Emergency contact is available 24/7</li>
                      <li>Garbage and recycling instructions are in the house manual</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-lg font-medium">
                    Are pets allowed?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    We don't allow pets in this property, but service animals are welcome as required by law. There are several pet-friendly parks within walking distance if you're visiting with a local friend who has pets.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            
            {/* Why Book Direct section removed - Now appears as badges near property title */}
          </div>

          {/* Booking Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
                <h3 className="text-xl font-bold mb-6">Booking</h3>
                
                {/* Booking Widget Iframe */}
                <div className="booking-widget-container w-full overflow-hidden">
                  <iframe 
                    id="booking-iframe" 
                    sandbox="allow-top-navigation allow-scripts allow-same-origin allow-forms" 
                    className="w-full min-h-[700px] lg:min-h-[800px] border-0"
                    scrolling="no"
                    src={property.bookingWidgetUrl || "https://booking.hospitable.com/widget/55ea1cea-3c99-40f7-b98b-3de392f74a36/1080590"}
                    onLoad={(e) => {
                      // Add event listener to adjust height based on content
                      const iframe = e.currentTarget;
                      try {
                        // Attempt to resize iframe based on content height
                        const resizeObserver = new ResizeObserver(() => {
                          try {
                            if (iframe.contentWindow?.document.body) {
                              const height = iframe.contentWindow.document.body.scrollHeight;
                              iframe.style.height = `${height + 50}px`; // Add padding
                            }
                          } catch (err) {
                            console.log('Could not adjust iframe height dynamically');
                          }
                        });
                        
                        // Observe size changes if possible
                        if (iframe.contentWindow?.document.body) {
                          resizeObserver.observe(iframe.contentWindow.document.body);
                        }
                      } catch (err) {
                        console.log('Failed to set up dynamic resizing');
                      }
                    }}
                  ></iframe>
                </div>
              </div>
              
              {/* Direct Booking Protection and Location Map removed */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PropertyDetail;
