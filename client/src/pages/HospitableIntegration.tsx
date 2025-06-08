import React, { useState } from 'react';
import { Link } from 'wouter';
import HospitableListingImporter from '@/components/HospitableListingImporter';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Property } from '@/types';

export default function HospitableIntegration() {
  const [importedProperties, setImportedProperties] = useState<Property[]>([]);

  const handleImportComplete = (properties: Property[]) => {
    setImportedProperties(properties);
  };

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Hospitable Integration</h1>
          <p className="text-gray-600 mt-2">
            Import and manage your Hospitable listings
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/connect">
            <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 shadow-sm">
              Connect Hospitable Account
            </a>
          </Link>
          <Link href="/customer-listings">
            <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 shadow-sm">
              View Customer Listings
            </a>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="import">
        <TabsList className="mb-6">
          <TabsTrigger value="import">Import Listings</TabsTrigger>
          <TabsTrigger value="imported">Imported Properties</TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <HospitableListingImporter 
            customerId="24RZHJ" 
            onImportComplete={handleImportComplete} 
          />
        </TabsContent>

        <TabsContent value="imported">
          {importedProperties.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {importedProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden">
                  <div className="relative h-48 w-full">
                    <img
                      src={property.imageUrl || 'https://placehold.co/600x400?text=No+Image'}
                      alt={property.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-1">
                      <Link href={`/property/${property.slug}`}>
                        <a className="hover:text-blue-600">{property.name}</a>
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {property.city}, {property.state || property.country}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        {property.bedrooms} Beds • {property.bathrooms} Baths • {property.maxGuests} Guests
                      </div>
                      <div className="text-lg font-semibold">${property.price}/night</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Properties Imported Yet</CardTitle>
                <CardDescription>
                  Import Hospitable listings to see them here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-6 text-gray-500">
                  Switch to the "Import Listings" tab to import properties from your Hospitable account.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}