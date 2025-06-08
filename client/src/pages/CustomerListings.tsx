import React, { useState } from 'react';
import { extractPropertyIds } from '@/lib/hospitable/property-utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitable } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, Star, ExternalLink, Save } from 'lucide-react';
import HospitableListingImporter from '@/components/HospitableListingImporter';
import DataRefreshScheduler from '@/components/DataRefreshScheduler';
import ListingDataDetail from '@/components/ListingDataDetail';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';

// Basic component to display customer listings
const CustomerListings: React.FC = () => {
  const [customerId, setCustomerId] = useState<string>("24RZHJ"); // Default to the example customer ID
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedListings, setSelectedListings] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Query for customer listings
  const { data: listings, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['/api/hospitable/customers', customerId, 'listings'],
    queryFn: async () => {
      setIsSearching(true);
      try {
        const data = await hospitable.getCustomerListings(customerId);
        return data;
      } finally {
        setIsSearching(false);
      }
    },
    enabled: false, // Don't run the query automatically, wait for user action
  });

  // Mutation to mark properties for creation of property pages
  const markForPublishingMutation = useMutation({
    mutationFn: async (selectedIds: string[]) => {
      return await hospitable.markListingsForPublishing(customerId, selectedIds);
    },
    onSuccess: () => {
      toast({
        title: "Properties marked for publishing",
        description: (
          <div className="space-y-2">
            <p>{`Successfully marked ${Object.keys(selectedListings).filter(id => selectedListings[id]).length} properties for publishing.`}</p>
            <div className="pt-1">
              <Link to="/published-properties" className="text-primary underline hover:text-primary/80">
                View published properties
              </Link>
            </div>
          </div>
        ),
      });
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hospitable/customers', customerId, 'listings'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to mark properties",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  });

  // Handle toggling selection of a listing
  const toggleSelection = (id: string) => {
    setSelectedListings(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Handle saving the selected properties
  const handleSaveSelection = () => {
    const selectedIds = Object.keys(selectedListings).filter(id => selectedListings[id]);
    if (selectedIds.length > 0) {
      markForPublishingMutation.mutate(selectedIds);
    } else {
      toast({
        title: "No properties selected",
        description: "Please select at least one property to create a property page.",
        variant: "destructive"
      });
    }
  };

  // Select all listings
  const selectAll = () => {
    if (!listings || !Array.isArray(listings)) return;
    const allIds = listings.reduce((acc, listing: any) => {
      acc[listing.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setSelectedListings(allIds);
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedListings({});
  };

  const handleSearch = () => {
    if (customerId.trim()) {
      setSelectedListings({}); // Clear selections when searching for a new customer
      refetch();
    }
  };
  
  // Helper function to transform muscache.com URLs to high quality versions
  const getHighQualityImageUrl = (url: string): string => {
    if (url && url.includes('muscache.com/im/')) {
      return url.replace('https://a0.muscache.com/im/', 'https://a0.muscache.com/');
    }
    return url;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Hospitable Customer Listings</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search Customer Listings</CardTitle>
          <CardDescription>
            Enter a customer ID to view their connected Airbnb/VRBO listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter customer ID (e.g., 24RZHJ)"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching || !customerId.trim()}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{(error as any)?.message || 'Failed to fetch customer listings'}</p>
          </CardContent>
        </Card>
      ) : listings ? (
        <>
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Customer Listings</CardTitle>
                <CardDescription>
                  Found {Array.isArray(listings) ? listings.length : 0} listings for customer {customerId}
                </CardDescription>
              </CardHeader>
              <CardHeader className="pb-0 pt-6">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium text-sm">
                    Select properties to create listing pages:
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={selectAll}
                      disabled={!listings || !Array.isArray(listings) || listings.length === 0}
                    >
                      Select All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearSelections}
                      disabled={!Object.keys(selectedListings).length}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Organize listings by private_name */}
                <div className="grid grid-cols-1 gap-8">
                  {(Array.isArray(listings) ? listings : [])
                    .sort((a: any, b: any) => (a.private_name || '').localeCompare(b.private_name || ''))
                    .map((listing: any) => (
                    <Card 
                      key={listing.id} 
                      className={`overflow-hidden relative ${selectedListings[listing.id] ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div className="absolute top-2 right-2 z-10">
                        <Checkbox 
                          id={`select-${listing.id}`}
                          checked={selectedListings[listing.id] || false}
                          onCheckedChange={() => toggleSelection(listing.id)}
                          className="h-5 w-5 bg-white border-gray-200"
                        />
                      </div>
                      {selectedListings[listing.id] && (
                        <div className="absolute top-2 left-2 z-10">
                          <Badge variant="default" className="bg-primary">
                            <Star className="h-3.5 w-3.5 mr-1" /> Selected
                          </Badge>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-56 overflow-hidden">
                          <img 
                            src={getHighQualityImageUrl(listing.picture || listing.photos?.[0]?.url || '/placeholder-property.jpg')} 
                            alt={listing.public_name || listing.private_name || 'Property'} 
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                            onError={(e) => {
                              // Try to fetch from Hospitable API if initial image fails
                              if (customerId && listing.id) {
                                e.currentTarget.src = `/api/hospitable/property-images/${customerId}/${listing.id}/primary`;
                              }
                            }}
                          />
                        </div>
                        
                        <div className="md:col-span-2 p-4">
                          <div className="flex flex-col h-full">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="text-lg font-bold">
                                    {listing.private_name || `Property ${listing.id}`}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    ID: {listing.id}
                                  </p>
                                </div>
                                <Badge variant="outline" className="ml-2">
                                  {listing.platform || 'Hospitable'}
                                </Badge>
                              </div>
                              
                              <h4 className="font-semibold text-primary">
                                Public Title: {listing.public_name || 'Not Set'}
                              </h4>
                              
                              <p className="text-sm text-gray-500 mt-1">
                                {listing.address ? 
                                  `${listing.address.street || ''}, ${listing.address.city || ''}, ${listing.address.state || ''}, ${listing.address.country_code || ''}` : 
                                  'Location not available'}
                              </p>
                              
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                  <h5 className="text-sm font-medium">Capacity Details</h5>
                                  <ul className="text-sm mt-1">
                                    <li>Guests: {listing.capacity?.max || listing.max_guests || '0'}</li>
                                    <li>Bedrooms: {listing.capacity?.bedrooms || listing.bedrooms || '0'}</li>
                                    <li>Beds: {listing.capacity?.beds || '0'}</li>
                                    <li>Bathrooms: {listing.capacity?.bathrooms || listing.bathrooms || '0'}</li>
                                  </ul>
                                </div>
                                
                                <div>
                                  <h5 className="text-sm font-medium">Pricing & Availability</h5>
                                  <ul className="text-sm mt-1">
                                    <li>Base Price: ${listing.base_price || '0'}/night</li>
                                    <li>Check-in: {listing.check_in || 'N/A'}</li>
                                    <li>Check-out: {listing.check_out || 'N/A'}</li>
                                    <li>Status: {listing.available ? 'Available' : 'Unavailable'}</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-4 pt-2 border-t">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => window.open(listing.listing_url || '#', '_blank')}
                                disabled={!listing.listing_url}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" /> View on Platform
                              </Button>
                              <Button 
                                variant={selectedListings[listing.id] ? "default" : "outline"}
                                size="sm" 
                                onClick={() => toggleSelection(listing.id)}
                              >
                                {selectedListings[listing.id] ? 'Selected for Publishing' : 'Select for Publishing'}
                              </Button>
                            </div>
                            
                            {/* Show all data points from the API */}
                            <ListingDataDetail listing={listing} />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div>
                  <span className="text-sm text-gray-500">
                    {Object.keys(selectedListings).filter(id => selectedListings[id]).length} of {Array.isArray(listings) ? listings.length : 0} selected
                  </span>
                </div>
                <Button
                  onClick={handleSaveSelection}
                  disabled={markForPublishingMutation.isPending || !Object.keys(selectedListings).filter(id => selectedListings[id]).length}
                >
                  {markForPublishingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Property Pages
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <HospitableListingImporter customerId={customerId} />
            
            {/* Data Refresh Schedule */}
            {customerId && (
              <DataRefreshScheduler customerId={customerId} />
            )}
          </div>
          
          <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20 text-center">
            <h3 className="text-xl font-medium mb-2">View Your Published Properties</h3>
            <p className="text-muted-foreground mb-4">
              Once you've marked properties for publishing, you can view and manage them in the Published Properties page.
            </p>
            <Link to="/published-properties">
              <Button>
                Go to Published Properties
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <Card className="text-center p-8">
          <p className="text-gray-500 mb-4">
            Search for a customer to see their listings
          </p>
          <p className="text-sm text-gray-400">
            Enter a customer ID and click Search to get started
          </p>
        </Card>
      )}
    </div>
  );
};

export default CustomerListings;