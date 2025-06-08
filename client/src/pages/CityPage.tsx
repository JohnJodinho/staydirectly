import React from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { getCity, getCityProperties, getNeighborhoods } from '@/lib/api';
import { slugify, getCityUrl } from '@/lib/slugify';
import { Link } from 'wouter';
import Breadcrumb from '@/components/ui/Breadcrumb';
import PropertyCard from '@/components/PropertyCard';
import NeighborhoodCard from '@/components/NeighborhoodCard';
import TravelGuideCard from '@/components/TravelGuideCard';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Meta, CityStructuredData } from '@/lib/seo';

const CityPage: React.FC = () => {
  const [match, params] = useRoute('/city/:name');
  const cityName = match ? params.name : '';

  // Get city details
  const { data: city, isLoading: isLoadingCity } = useQuery({
    queryKey: [`/api/cities/${cityName}`],
    queryFn: () => getCity(cityName),
    enabled: !!cityName,
  });

  // Get properties for this city
  const { data: properties, isLoading: isLoadingProperties } = useQuery({
    queryKey: [`/api/cities/${cityName}/properties`],
    queryFn: () => getCityProperties(cityName, 3), // Limit to 3 featured properties
    enabled: !!cityName,
  });

  // Get neighborhoods for this city
  const { data: neighborhoods, isLoading: isLoadingNeighborhoods } = useQuery({
    queryKey: [`/api/cities/${city?.id}/neighborhoods`],
    queryFn: () => getNeighborhoods(city?.id || 0),
    enabled: !!city?.id,
  });

  // Sample travel guides data (would ideally come from an API)
  const travelGuides = [
    {
      id: 1,
      title: `Top 10 Restaurants in ${cityName}`,
      category: "Food & Dining",
      categoryColor: "blue",
      excerpt: `Discover the best culinary experiences ${cityName} has to offer, from fine dining to hidden gems.`,
      imageUrl: "https://images.unsplash.com/photo-1534430480872-3b397132e458?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80"
    },
    {
      id: 2,
      title: `A Weekend in ${cityName}: Complete Itinerary`,
      category: "Itineraries",
      categoryColor: "green",
      excerpt: `Make the most of your short stay with our carefully curated 48-hour guide to ${cityName}.`,
      imageUrl: "https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80"
    },
    {
      id: 3,
      title: `Hidden Gems in ${cityName}`,
      category: "Local Tips",
      categoryColor: "amber",
      excerpt: `Go beyond the tourist attractions and discover local favorites and secret spots throughout the city.`,
      imageUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
    }
  ];

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: city?.country || '', href: `/search?q=${city?.country}` },
    { label: cityName }
  ];

  if (isLoadingCity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 max-w-md mb-4"></div>
          <div className="h-[50vh] bg-gray-200 rounded-xl mb-8"></div>
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
          <div className="h-4 bg-gray-200 rounded mb-6 w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!city) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-red-500 mb-2">City Not Found</h1>
          <p>The city you are looking for does not exist or has been removed.</p>
          <Link href="/">
            <Button className="mt-4">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Meta 
        title={`${city.name}, ${city.country} | StayDirectly`}
        description={city.description || `Book your stay in ${city.name} directly with hosts and avoid booking fees. Find apartments, houses, and unique accommodations in ${city.name}.`}
        canonical={getCityUrl(city.name)}
        image={city.imageUrl}
      />
      
      <CityStructuredData
        name={city.name}
        description={city.description || `Explore ${city.name} vacation rentals`}
        image={city.imageUrl}
        country={city.country}
        region={city.region || ''}
        propertyCount={city.propertyCount || 0}
      />
      
      <div className="container mx-auto px-4 pt-6">
        {/* Breadcrumbs */}
        <Breadcrumb items={breadcrumbItems} className="mb-4" />

        {/* City Header */}
        <div className="relative h-[50vh] rounded-xl overflow-hidden mb-8">
          <img 
            src={city.imageUrl} 
            alt={`${city.name} Skyline`} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{city.name}</h1>
            <p className="text-xl opacity-90">{city.description}</p>
          </div>
        </div>

        {/* City Description */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">About {city.name}</h2>
          <p className="text-gray-600 mb-4">{city.longDescription}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{city.propertyCount}</div>
              <div className="text-sm text-gray-500">Properties</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{neighborhoods?.length || 0}</div>
              <div className="text-sm text-gray-500">Neighborhoods</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">4.8</div>
              <div className="text-sm text-gray-500">Avg. Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">$210</div>
              <div className="text-sm text-gray-500">Avg. Price/Night</div>
            </div>
          </div>
        </div>

        {/* Neighborhoods */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Popular Neighborhoods</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoadingNeighborhoods ? (
              // Skeleton loading state
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="relative h-48 rounded-lg bg-gray-200 animate-pulse"></div>
              ))
            ) : neighborhoods?.length === 0 ? (
              <div className="col-span-3 text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No neighborhoods available for this city yet.</p>
              </div>
            ) : (
              neighborhoods?.map((neighborhood) => (
                <NeighborhoodCard key={neighborhood.id} neighborhood={neighborhood} />
              ))
            )}
          </div>
        </div>

        {/* Featured Properties */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Featured Properties in {city.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingProperties ? (
              // Skeleton loading state
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm h-[300px]">
                  <div className="aspect-[4/3] bg-gray-200 animate-pulse"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse mb-2 w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse mb-3 w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                  </div>
                </div>
              ))
            ) : properties?.length === 0 ? (
              <div className="col-span-3 text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No properties available in this city yet.</p>
              </div>
            ) : (
              properties?.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))
            )}
          </div>
          <div className="mt-8 text-center">
            <Link href={`/search?q=${cityName}`}>
              <Button variant="outline" className="inline-block bg-white hover:bg-gray-100 text-primary font-medium px-6 py-3 rounded-lg border border-gray-200 shadow-sm transition-colors">
                View All Properties <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Travel Guides */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{city.name} Travel Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {travelGuides.map((guide) => (
              <TravelGuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CityPage;
