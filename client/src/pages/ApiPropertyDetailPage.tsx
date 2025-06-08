import React from 'react';
import { useProperty } from '@/lib/hospitable';
import { Button } from '@/components/ui/button';
import { Link, useParams } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users, Bed, Bath, Star, DollarSign, ExternalLink } from 'lucide-react';

export default function ApiPropertyDetailPage() {
  const params = useParams();
  const id = params?.id || '';
  const { data: property, isLoading, error } = useProperty(id);

  if (isLoading) {
    return (
      <div className="container py-10 max-w-7xl mx-auto">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/api-properties">← Back to Properties</Link>
        </Button>
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-80 w-full" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container py-10 max-w-7xl mx-auto">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/api-properties">← Back to Properties</Link>
        </Button>
        
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading Property</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              {error instanceof Error ? error.message : 'Failed to fetch property from Hospitable API'}
            </p>
            <p className="text-sm mt-2 text-red-500">
              Property ID: {id}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <Button asChild variant="ghost" className="mb-4">
        <Link to="/api-properties">← Back to Properties</Link>
      </Button>
      
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{property.name}</h1>
          <div className="flex items-center mt-2 text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span>
              {property.address?.street}, {property.address?.city}, {property.address?.state}, {property.address?.zip}
            </span>
          </div>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          Hospitable API
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Property Images */}
          <div className="overflow-hidden rounded-lg">
            {property.images && property.images.length > 0 ? (
              <img
                src={property.images[0].url}
                alt={property.name}
                className="w-full h-auto object-cover"
              />
            ) : (
              <div className="bg-muted h-80 flex items-center justify-center">
                <p className="text-muted-foreground">No image available</p>
              </div>
            )}
          </div>
          
          {/* Property Details */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                <span>{property.capacity?.guests} guests</span>
              </div>
              <div className="flex items-center">
                <Bed className="h-5 w-5 mr-2 text-muted-foreground" />
                <span>{property.capacity?.bedrooms} bedrooms</span>
              </div>
              <div className="flex items-center">
                <Bath className="h-5 w-5 mr-2 text-muted-foreground" />
                <span>{property.capacity?.bathrooms} bathrooms</span>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mt-6">Description</h2>
            <p>{property.description}</p>
            
            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mt-6">Amenities</h2>
                <ul className="grid grid-cols-2 mt-2 gap-y-2">
                  {property.amenities.map((amenity: any, index: number) => (
                    <li key={index} className="flex items-center">
                      <span className="mr-2">•</span>
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Booking Information */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="text-2xl font-bold">
                  ${property.pricing?.basePrice}
                  <span className="text-sm font-normal text-muted-foreground"> / night</span>
                </span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 text-yellow-500 fill-yellow-500" />
                  <span>4.9</span>
                </div>
              </CardTitle>
              <CardDescription>
                {property.availability?.minStay} night minimum stay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="border rounded-md p-3">
                    <div className="text-sm text-muted-foreground">Check-in</div>
                    <div className="font-medium flex items-center gap-1 mt-1">
                      <CalendarDays className="h-4 w-4" />
                      <span>{property.availability?.checkIn}</span>
                    </div>
                  </div>
                  <div className="border rounded-md p-3">
                    <div className="text-sm text-muted-foreground">Check-out</div>
                    <div className="font-medium flex items-center gap-1 mt-1">
                      <CalendarDays className="h-4 w-4" />
                      <span>{property.availability?.checkOut}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span>${property.pricing?.basePrice} x 5 nights</span>
                    <span>${property.pricing?.basePrice * 5}</span>
                  </div>
                  {property.pricing?.cleaningFee && (
                    <div className="flex justify-between mb-2">
                      <span>Cleaning fee</span>
                      <span>${property.pricing.cleaningFee}</span>
                    </div>
                  )}
                  {property.pricing?.serviceFee && (
                    <div className="flex justify-between mb-2">
                      <span>Service fee</span>
                      <span>${property.pricing.serviceFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t pt-4 mt-4">
                    <span>Total</span>
                    <span>
                      ${(property.pricing?.basePrice * 5) + 
                        (property.pricing?.cleaningFee || 0) + 
                        (property.pricing?.serviceFee || 0)}
                    </span>
                  </div>
                </div>
                
                <Button className="w-full">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Reserve Now
                </Button>
                
                <p className="text-center text-xs text-muted-foreground">
                  You won't be charged yet
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-4">
            <Button variant="outline" className="w-full" asChild>
              <a 
                href={`https://app.hospitable.com/property/${property.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Hospitable
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}