import React, { useState, useEffect } from 'react';
import { useProperties } from '@/lib/hospitable';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'wouter';
import { MapPin, Bed, Bath, Users, Star, AlertCircle } from 'lucide-react';

export default function HospitablePropertiesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: properties, isLoading, error } = useProperties();

  // Filter properties based on search term
  const filteredProperties = properties?.filter((property: any) => 
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // We'll handle the error display in the parent component with HospitableApiSetupInfo

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search properties by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {filteredProperties && filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property: any) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {property.images && property.images.length > 0 ? (
                      <img 
                        src={property.images[0].url} 
                        alt={property.name}
                        className="w-full h-48 object-cover" 
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <p className="text-muted-foreground">No image available</p>
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-primary/90">Hospitable API</Badge>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold line-clamp-1">{property.name}</h3>
                    <div className="flex items-center text-muted-foreground text-sm mt-1">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      <span className="truncate">
                        {property.address?.city}, {property.address?.state}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 my-3">
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{property.capacity?.guests} guests</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Bed className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{property.capacity?.bedrooms} beds</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Bath className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{property.capacity?.bathrooms} baths</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-baseline">
                        <span className="text-lg font-bold">${property.pricing?.basePrice}</span>
                        <span className="text-sm text-muted-foreground ml-1">/ night</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-500 fill-yellow-500" />
                        <span>4.9</span>
                      </div>
                    </div>
                    
                    <Button asChild className="w-full mt-4" variant="outline">
                      <Link to={`/api-properties/${property.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-muted-foreground mb-2">
                {searchTerm ? "No properties match your search" : "No properties found"}
              </h3>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}