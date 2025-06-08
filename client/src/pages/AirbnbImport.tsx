import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AirbnbListingsImporter } from '@/components/AirbnbListingsImporter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';

// Mock type for Airbnb listings
interface AirbnbListing {
  id: string;
  name: string;
  description: string;
  address: {
    city: string;
    country: string;
  };
  images: { url: string }[];
  capacity: {
    guests: number;
    bedrooms: number;
    bathrooms: number;
  };
  pricing: {
    basePrice: number;
    currency: string;
  };
}

const AirbnbImport = () => {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('connect');

  // Query to fetch a user's Airbnb listings
  const { data: listings, isLoading, isError, error } = useQuery({
    queryKey: ['airbnb-listings', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const response = await apiRequest('GET', `/api/hospitable/customers/${customerId}/listings`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Airbnb listings');
      }
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!customerId,
  });

  // Mock customer IDs for demo - in a real app this would come from authentication
  const mockCustomers = [
    { id: 'cust_123', name: 'Demo Account' },
    { id: 'cust_456', name: 'Test User' }
  ];

  const handleSelectCustomer = (id: string) => {
    setCustomerId(id);
    setActiveTab('listings');
  };

  // Convert Airbnb listings to the format used by PropertyCard
  const convertedListings = listings?.map((listing: AirbnbListing) => ({
    id: parseInt(listing.id),
    name: listing.name,
    description: listing.description,
    location: `${listing.address.city}, ${listing.address.country}`,
    imageUrl: listing.images[0]?.url || '/placeholder.jpg',
    price: listing.pricing.basePrice,
    priceUnit: listing.pricing.currency === 'USD' ? '$' : '€',
    guests: listing.capacity.guests,
    bedrooms: listing.capacity.bedrooms,
    bathrooms: listing.capacity.bathrooms,
    rating: 0, // New listings don't have ratings yet
    reviewCount: 0
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Import Airbnb Listings | StayDirectly</title>
        <meta 
          name="description" 
          content="Connect your Airbnb listings to StayDirectly and start receiving direct bookings."
        />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Import your Airbnb Listings</h1>
          <p className="text-gray-600">
            Connect your Airbnb properties to StayDirectly using our Hospitable integration and start receiving direct bookings.
          </p>
        </div>

        <Tabs defaultValue="connect" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-8">
            <TabsTrigger value="connect">Connect Account</TabsTrigger>
            <TabsTrigger value="listings">Your Listings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connect" className="mt-4">
            <AirbnbListingsImporter />

            {/* Demo accounts section */}
            <div className="mt-12 border-t pt-8">
              <h3 className="text-lg font-medium mb-4">Demo Accounts</h3>
              <p className="text-sm text-gray-600 mb-4">
                For testing purposes, you can use these pre-configured demo accounts:
              </p>
              <div className="flex flex-wrap gap-4">
                {mockCustomers.map((customer) => (
                  <Button 
                    key={customer.id}
                    variant="outline"
                    onClick={() => handleSelectCustomer(customer.id)}
                  >
                    Load {customer.name}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="listings" className="mt-4">
            {!customerId ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">
                  Please connect your Airbnb account or select a demo account to view listings.
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-center py-8 bg-red-50 rounded-lg">
                <p className="text-red-600">
                  Error fetching listings: {error instanceof Error ? error.message : 'Unknown error'}
                </p>
              </div>
            ) : listings?.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">
                  No Airbnb listings found for this account.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-6">Your Airbnb Listings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {convertedListings?.map((listing: any) => (
                    <PropertyCard key={listing.id} property={listing} />
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AirbnbImport;