import React, { useState } from 'react';
import { extractPropertyIds, getOptimizedAirbnbImageUrl } from '@/lib/hospitable/property-utils';
import AirbnbImageOptimizer from '@/components/AirbnbImageOptimizer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { 
  Building, 
  Calendar, 
  CheckCircle2, 
  Edit, 
  ExternalLink, 
  EyeOff, 
  Globe, 
  Home, 
  MoreVertical,
  Pencil,
  Search, 
  Share2, 
  Tag, 
  Trash2, 
  Users,
  Star,
  Link as LinkIcon,
  Grid,
  List,
  FileEdit,
  Globe2,
  ImageIcon,
  Download
} from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

// Action menu component for property card
interface PropertyActionMenuProps {
  property: any;
  onEdit: (property: any) => void;
  onUnpublish: (property: any) => void;
  onDelete: (property: any) => void;
}

const PropertyActionMenu: React.FC<PropertyActionMenuProps> = ({ 
  property, 
  onEdit, 
  onUnpublish, 
  onDelete 
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm h-8 w-8 p-0 rounded-full hover:bg-white/90 z-10">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => onEdit(property)} className="cursor-pointer">
          <Pencil className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => onUnpublish(property)} className="cursor-pointer">
          <EyeOff className="mr-2 h-4 w-4" />
          <span>Unpublish</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onDelete(property)} 
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Published Properties page - shows properties that have been marked for publishing
const PublishedProperties: React.FC = () => {
  const [showUnpublished, setShowUnpublished] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<any>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Using getOptimizedAirbnbImageUrl from property-utils.ts instead of a local function
  
  // Query for published properties
  const { data: properties, isLoading, isError } = useQuery({
    queryKey: ['/api/properties', { published: !showUnpublished }],
    queryFn: async () => {
      const url = `/api/properties?isPublished=${!showUnpublished ? 'true' : 'all'}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return response.json();
    }
  });
  
  // Mutation for updating a property (used for both editing and unpublishing)
  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, propertyData }: { id: number; propertyData: any }) => {
      const res = await apiRequest('PATCH', `/api/properties/${id}`, propertyData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update property');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: "Success",
        description: "Property updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update property",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for deleting a property
  const deletePropertyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/properties/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete property');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: "Success",
        description: "Property deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete property",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for fetching property images
  const fetchImagesMutation = useMutation({
    mutationFn: async ({ propertyId, platformId }: { propertyId: number, platformId: string }) => {
      const res = await apiRequest('POST', '/api/hospitable/fetch-property-images', { propertyId, platformId });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch images for property');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: "Success",
        description: `Successfully fetched ${data.imageCount} images`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch images for property",
        variant: "destructive",
      });
    }
  });
  
  // Event handlers
  const handleEdit = (property: any) => {
    setPropertyToEdit(property);
  };
  
  const handleUpdateProperty = () => {
    if (!propertyToEdit) return;
    
    // Extract all fields to update from propertyToEdit state
    const propertyData = {
      title: propertyToEdit.title,
      price: propertyToEdit.price,
      description: propertyToEdit.description,
      
      // SEO fields
      slug: propertyToEdit.slug,
      metaTitle: propertyToEdit.metaTitle,
      metaDescription: propertyToEdit.metaDescription,
      
      // Embed codes
      bookingWidgetHtml: propertyToEdit.bookingWidgetHtml,
      reviewsWidgetHtml: propertyToEdit.reviewsWidgetHtml,
      
      // Amenities
      featuredAmenities: propertyToEdit.featuredAmenities
    };
    
    updatePropertyMutation.mutate({
      id: propertyToEdit.id,
      propertyData
    });
    
    setPropertyToEdit(null);
  };
  
  const handleUnpublish = (property: any) => {
    updatePropertyMutation.mutate({
      id: property.id,
      propertyData: { unpublish: true }
    });
  };
  
  const handleDelete = (property: any) => {
    setPropertyToDelete(property);
  };
  
  const confirmDelete = () => {
    if (propertyToDelete) {
      deletePropertyMutation.mutate(propertyToDelete.id);
      setPropertyToDelete(null);
    }
  };
  
  const handleFetchImages = (property: any) => {
    if (!property || !property.id) return;
    
    // For Hospitable API properties, we use either platformId or external_id
    let platformId = property.platformId || property.external_id;
    
    if (!platformId) {
      toast({
        title: "Missing Platform ID",
        description: "This property doesn't have a Platform ID. To fetch images, you need to connect this property to Hospitable by importing it from the Customer Listings page.",
        variant: "destructive",
      });
      return;
    }
    
    // Before making the API call, analyze if the platformId has the right format
    const { customerId, listingId } = extractPropertyIds(platformId.toString());
    
    // If the platformId doesn't have the correct format (customerId/listingId)
    if (!customerId || !listingId) {
      toast({
        title: "Invalid Platform ID Format",
        description: "This property has an incorrectly formatted Platform ID. Please reimport this property from the Hospitable integration page to properly format the ID.",
        variant: "destructive",
      });
      return;
    }
    
    fetchImagesMutation.mutate({ 
      propertyId: property.id, 
      platformId: platformId.toString() 
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Properties</CardTitle>
            <CardDescription>
              There was a problem fetching the property data. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Published Properties</h1>
            <p className="text-muted-foreground mt-1">
              Manage your published property listings
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="show-unpublished"
              checked={showUnpublished}
              onCheckedChange={setShowUnpublished}
            />
            <Label htmlFor="show-unpublished">Show All Properties</Label>
          </div>
        </div>
        
        {/* Edit Property Dialog */}
        <Dialog open={!!propertyToEdit} onOpenChange={(open) => !open && setPropertyToEdit(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Property</DialogTitle>
              <DialogDescription>
                Update the details of your property listing.
              </DialogDescription>
            </DialogHeader>
            
            {propertyToEdit && (
              <div className="space-y-4 py-4">
                <Tabs defaultValue="basic">
                  <TabsList className="mb-4 w-full">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="seo">SEO & URL</TabsTrigger>
                    <TabsTrigger value="embeds">Embed Codes</TabsTrigger>
                    <TabsTrigger value="amenities">Amenities</TabsTrigger>
                  </TabsList>
                
                  {/* Basic Info Tab */}
                  <TabsContent value="basic">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Property Title</Label>
                          <input
                            id="title"
                            className="w-full p-2 border rounded"
                            defaultValue={propertyToEdit.title || propertyToEdit.name}
                            onChange={(e) => setPropertyToEdit({...propertyToEdit, title: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="price">Price per night ($)</Label>
                          <input
                            id="price"
                            type="number"
                            className="w-full p-2 border rounded"
                            defaultValue={propertyToEdit.price}
                            onChange={(e) => setPropertyToEdit({...propertyToEdit, price: parseFloat(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Property Description</Label>
                        <textarea
                          id="description"
                          className="w-full p-2 border rounded h-32"
                          defaultValue={propertyToEdit.description}
                          onChange={(e) => setPropertyToEdit({...propertyToEdit, description: e.target.value})}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* SEO & URL Tab */}
                  <TabsContent value="seo">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="slug">URL Slug</Label>
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-2">/property/</span>
                          <input
                            id="slug"
                            className="flex-1 p-2 border rounded"
                            placeholder="your-custom-url-slug"
                            defaultValue={propertyToEdit.slug || ''}
                            onChange={(e) => setPropertyToEdit({...propertyToEdit, slug: e.target.value})}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Custom URL for better SEO. Use lowercase letters, numbers, and hyphens.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="metaTitle">Title Tag (SEO)</Label>
                        <input
                          id="metaTitle"
                          className="w-full p-2 border rounded"
                          placeholder="Vacation Rental in [Location] with [Feature] - Your Brand"
                          defaultValue={propertyToEdit.metaTitle || ''}
                          onChange={(e) => setPropertyToEdit({...propertyToEdit, metaTitle: e.target.value})}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended length: 50-60 characters
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <textarea
                          id="metaDescription"
                          className="w-full p-2 border rounded h-24"
                          placeholder="Experience a luxurious stay at our [Property Type] in [Location]. Features include [key amenities]. Perfect for [target guests]. Book now!"
                          defaultValue={propertyToEdit.metaDescription || ''}
                          onChange={(e) => setPropertyToEdit({...propertyToEdit, metaDescription: e.target.value})}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended length: 120-160 characters
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Embed Codes Tab */}
                  <TabsContent value="embeds">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bookingWidgetHtml">Booking Widget HTML</Label>
                        <textarea
                          id="bookingWidgetHtml"
                          className="w-full p-2 border rounded h-36 font-mono text-sm"
                          placeholder="<iframe src='your-booking-widget-url' width='100%' height='500'></iframe>"
                          defaultValue={propertyToEdit.bookingWidgetHtml || ''}
                          onChange={(e) => setPropertyToEdit({...propertyToEdit, bookingWidgetHtml: e.target.value})}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Paste the HTML code for the booking widget specific to this property
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="reviewsWidgetHtml">Reviews Widget HTML</Label>
                        <textarea
                          id="reviewsWidgetHtml"
                          className="w-full p-2 border rounded h-36 font-mono text-sm"
                          placeholder="<div class='reviews-widget' data-property-id='123'>...</div>"
                          defaultValue={propertyToEdit.reviewsWidgetHtml || ''}
                          onChange={(e) => setPropertyToEdit({...propertyToEdit, reviewsWidgetHtml: e.target.value})}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Paste the HTML code for the reviews widget specific to this property
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Amenities Tab */}
                  <TabsContent value="amenities">
                    <div className="space-y-4">
                      <div>
                        <Label className="block mb-3">Featured Amenities (Select up to 6)</Label>
                        <p className="text-xs text-muted-foreground mb-4">
                          Choose the 6 most important amenities to highlight on the property page
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { id: 'wifi', label: 'WiFi', icon: 'wifi' },
                            { id: 'pool', label: 'Swimming Pool', icon: 'pool' },
                            { id: 'hottub', label: 'Hot Tub', icon: 'hot-tub' },
                            { id: 'ac', label: 'Air Conditioning', icon: 'snowflake' },
                            { id: 'kitchen', label: 'Full Kitchen', icon: 'utensils' },
                            { id: 'tv', label: 'Smart TV', icon: 'tv' },
                            { id: 'washer', label: 'Washer/Dryer', icon: 'washing-machine' },
                            { id: 'parking', label: 'Free Parking', icon: 'car' },
                            { id: 'workspace', label: 'Workspace', icon: 'briefcase' },
                            { id: 'bbq', label: 'BBQ Grill', icon: 'flame' },
                            { id: 'patio', label: 'Patio/Balcony', icon: 'sun' },
                            { id: 'pets', label: 'Pet Friendly', icon: 'paw' },
                          ].map(amenity => (
                            <div 
                              key={amenity.id}
                              className={`
                                border rounded-md p-3 flex items-center space-x-2 cursor-pointer
                                ${propertyToEdit.featuredAmenities?.includes(amenity.id) 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-gray-200 hover:border-gray-300'
                                }
                              `}
                              onClick={() => {
                                const current = propertyToEdit.featuredAmenities || [];
                                const updated = current.includes(amenity.id)
                                  ? current.filter((id: string) => id !== amenity.id)
                                  : current.length < 6
                                    ? [...current, amenity.id]
                                    : current;
                                
                                setPropertyToEdit({
                                  ...propertyToEdit, 
                                  featuredAmenities: updated
                                });
                              }}
                            >
                              <div className="flex-shrink-0">
                                {/* Placeholder for icon - in a real app we'd have actual icons */}
                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                                  {amenity.icon.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className="flex-1 text-sm">{amenity.label}</div>
                              {propertyToEdit.featuredAmenities?.includes(amenity.id) && (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <p className="text-xs text-primary mt-3">
                          {propertyToEdit.featuredAmenities?.length || 0} of 6 amenities selected
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setPropertyToEdit(null)}
                disabled={updatePropertyMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                onClick={handleUpdateProperty}
                disabled={updatePropertyMutation.isPending}
              >
                {updatePropertyMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!propertyToDelete} onOpenChange={(open) => !open && setPropertyToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the property "{propertyToDelete?.title || propertyToDelete?.name}". 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletePropertyMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete} 
                disabled={deletePropertyMutation.isPending}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {deletePropertyMutation.isPending ? 'Deleting...' : 'Delete Property'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Tabs defaultValue="grid" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center">
              <Badge variant="outline" className="mr-2">
                {properties?.length || 0} Properties
              </Badge>
              <Link to="/customer-listings">
                <Button variant="outline" size="sm">
                  Add More Properties
                </Button>
              </Link>
            </div>
          </div>

          <TabsContent value="grid" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties?.length > 0 ? (
                properties.map((property: any) => (
                  <Card key={property.id} className={`overflow-hidden ${!property.isPublished ? 'opacity-60' : ''}`}>
                    <div className="relative h-48 overflow-hidden">
                      <AirbnbImageOptimizer 
                        imageUrl={property.imageUrl || '/placeholder-property.jpg'} 
                        alt={property.title || property.name || 'Property'} 
                        className="w-full h-full transition-transform hover:scale-105"
                        fallbackUrl={property.platformId ? 
                          `/api/hospitable/property-images/${extractPropertyIds(property.platformId).customerId}/${extractPropertyIds(property.platformId).listingId}/primary` : 
                          '/placeholder-property.jpg'
                        }
                      />
                      
                      {/* Property action menu */}
                      <PropertyActionMenu 
                        property={property}
                        onEdit={handleEdit}
                        onUnpublish={handleUnpublish}
                        onDelete={handleDelete}
                      />
                      
                      {property.isPublished && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Published
                          </Badge>
                        </div>
                      )}
                      {property.platformType && (
                        <div className="absolute bottom-2 left-2">
                          <Badge variant="secondary" className="bg-white/80 text-black">
                            {property.platformType}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="font-semibold line-clamp-1">{property.title || property.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {property.location || 'Location not available'}
                      </p>
                      <div className="mt-2 flex items-center text-sm">
                        <Users className="h-3.5 w-3.5 mr-1" /> 
                        <span>{property.maxGuests || 1} guests</span>
                        <span className="mx-1">•</span>
                        <Home className="h-3.5 w-3.5 mr-1" />
                        <span>{property.bedrooms || 1} bed{property.bedrooms !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="mt-1 font-medium">
                        ${property.price}/night
                      </div>
                      {property.publishedAt && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Published {formatDistanceToNow(new Date(property.publishedAt), { addSuffix: true })}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        asChild
                      >
                        <Link to={`/property/${property.id}`}>
                          <Search className="h-3 w-3 mr-1" /> View Details
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        asChild
                      >
                        <a 
                          href={`/property/${property.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Share2 className="h-3 w-3 mr-1" /> Share
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <div className="flex flex-col items-center justify-center">
                    <Globe className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
                    <h3 className="text-lg font-medium mb-1">No Properties Found</h3>
                    <p className="text-muted-foreground mb-4">
                      {showUnpublished 
                        ? "You don't have any properties yet."
                        : "You don't have any published properties yet."}
                    </p>
                    <Link to="/customer-listings">
                      <Button>
                        Import Properties
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted">
                      <tr>
                        <th scope="col" className="px-6 py-3">Property</th>
                        <th scope="col" className="px-6 py-3">Platform ID</th>
                        <th scope="col" className="px-6 py-3">Location</th>
                        <th scope="col" className="px-6 py-3">Price</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">SEO</th>
                        <th scope="col" className="px-6 py-3">Embeds</th>
                        <th scope="col" className="px-6 py-3">Featured Amenities</th>
                        <th scope="col" className="px-6 py-3">Published</th>
                        <th scope="col" className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties?.length > 0 ? (
                        properties.map((property: any) => (
                          <tr key={property.id} className="bg-white border-b hover:bg-muted/50">
                            <td className="px-6 py-4 font-medium">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded overflow-hidden mr-3 flex-shrink-0">
                                  <AirbnbImageOptimizer 
                                    imageUrl={property.imageUrl || '/placeholder-property.jpg'} 
                                    alt={property.title || property.name} 
                                    className="w-full h-full"
                                    fallbackUrl={property.platformId ? 
                                      `/api/hospitable/property-images/${extractPropertyIds(property.platformId).customerId}/${extractPropertyIds(property.platformId).listingId}/primary` : 
                                      '/placeholder-property.jpg'
                                    }
                                  />
                                </div>
                                <div className="line-clamp-1">
                                  {property.title || property.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                {property.platformId || property.external_id ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center">
                                          <span className="line-clamp-1 text-xs font-mono">
                                            {property.platformId || property.external_id}
                                          </span>
                                          <CheckCircle2 className="h-3.5 w-3.5 ml-1 text-green-500" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>This property has a platform ID and can fetch images</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <span className="text-muted-foreground text-xs">
                                    No platform ID
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <Building className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                <span className="line-clamp-1">
                                  {property.location || 'Unknown location'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <Tag className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                <span>${property.price}/night</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {property.isPublished ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  Published
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                                  Draft
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                {property.slug ? (
                                  <Badge variant="outline" className="inline-flex items-center">
                                    <LinkIcon className="h-3 w-3 mr-1" />
                                    {property.slug}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                                {property.metaTitle && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={property.metaTitle}>
                                    {property.metaTitle}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {property.bookingWidgetUrl ? (
                                  <Badge variant="outline" className="bg-blue-50 border-blue-100">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Booking
                                  </Badge>
                                ) : null}
                                {property.reviewWidgetCode ? (
                                  <Badge variant="outline" className="bg-yellow-50 border-yellow-100">
                                    <Star className="h-3 w-3 mr-1" />
                                    Reviews
                                  </Badge>
                                ) : null}
                                {!property.bookingWidgetUrl && !property.reviewWidgetCode && (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {property.featuredAmenities && property.featuredAmenities.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {property.featuredAmenities.map((amenity, index) => (
                                    <Badge 
                                      key={index} 
                                      variant="outline" 
                                      className="bg-green-50 border-green-100 text-xs"
                                    >
                                      {amenity}
                                    </Badge>
                                  )).slice(0, 3)}
                                  {property.featuredAmenities.length > 3 && (
                                    <Badge variant="outline" className="bg-green-50 border-green-100 text-xs">
                                      +{property.featuredAmenities.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {property.publishedAt ? (
                                <span className="text-muted-foreground">
                                  {formatDistanceToNow(new Date(property.publishedAt), { addSuffix: true })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <Link to={`/property/${property.id}`}>
                                  <Button variant="ghost" size="sm" className="h-8 px-2" title="View Details">
                                    <Search className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <a 
                                  href={`/property/${property.id}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <Button variant="ghost" size="sm" className="h-8 px-2" title="Open in New Tab">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </a>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2" 
                                  onClick={() => handleEdit(property)}
                                  title="Edit Property"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2"
                                        onClick={() => handleFetchImages(property)}
                                        disabled={fetchImagesMutation.isPending}
                                        title="Fetch Images"
                                      >
                                        <ImageIcon className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Fetch images for this property</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2" 
                                  onClick={() => handleUnpublish(property)}
                                  title="Unpublish Property"
                                >
                                  <EyeOff className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50" 
                                  onClick={() => handleDelete(property)}
                                  title="Delete Property"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <Globe className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                              <h3 className="text-lg font-medium mb-1">No Properties Found</h3>
                              <p className="text-muted-foreground mb-4">
                                {showUnpublished 
                                  ? "You don't have any properties yet."
                                  : "You don't have any published properties yet."}
                              </p>
                              <Link to="/customer-listings">
                                <Button size="sm">
                                  Import Properties
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PublishedProperties;