import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownToLine, Check, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitable } from '@/lib/api';
import { Property } from '@shared/schema';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Define a simplified Hospitable property type
interface HospitableProperty {
  id: string;
  name: string;
  beds: { type: string; count: number }[];
  image: string;
  address?: any;
}

interface HospitableListingImporterProps {
  customerId?: string;
  onImportComplete?: (properties: Property[]) => void;
}

const HospitableListingImporter: React.FC<HospitableListingImporterProps> = ({ 
  customerId = "24RZHJ", // Default to the customer ID we know works
  onImportComplete 
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Hospitable customer listings
  const { data: properties, isLoading, isError, error } = useQuery({
    queryKey: ['/api/hospitable/customers', customerId, 'listings'],
    queryFn: async () => {
      try {
        const response = await hospitable.getCustomerListings(customerId);
        
        // Check if response is an array
        if (!Array.isArray(response)) {
          console.warn('Response from getCustomerListings is not an array:', response);
          return [] as HospitableProperty[];
        }
        
        // Map the response to match our HospitableProperty interface
        return response.map((prop: any) => {
          // Get image URL and remove '/im\' to get high-quality version
          let imageUrl = prop.picture || prop.photos?.[0]?.url || prop.image_url || '';
          imageUrl = imageUrl.replace('/im\\', '/');
          
          return {
            id: prop.id || prop.id_str,
            name: prop.private_name || prop.public_name || prop.name || `Property ${prop.id}`,
            image: imageUrl,
            beds: prop.beds || Array.isArray(prop.bedrooms) 
              ? prop.bedrooms 
              : [{ type: 'Default', count: prop.bedrooms || 1 }],
            address: prop.address || {},
          };
        }) as HospitableProperty[];
      } catch (error) {
        console.error('Error fetching Hospitable properties:', error);
        throw error;
      }
    },
    // Only fetch on component mount
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      setIsImporting(true);
      setImportProgress(0);
      setImportedCount(0);

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setImportProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 500);

        // Pass the customer ID to the import endpoint
        const data = await hospitable.importListings(customerId);
        
        clearInterval(progressInterval);
        setImportProgress(100);
        
        // If there's a callback function, call it with the imported properties
        if (onImportComplete) {
          // Make sure we're always passing an array to the callback
          const propertiesArray = Array.isArray(data) ? data : [];
          onImportComplete(propertiesArray);
        }
        
        return data;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      setIsImporting(false);
      const count = Array.isArray(data) ? data.length : 0;
      setImportedCount(count);
      
      toast({
        title: 'Import completed',
        description: `Successfully imported ${count} properties`,
        variant: 'default',
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties/featured'] });
    },
    onError: (error: any) => {
      setIsImporting(false);
      toast({
        title: 'Import failed',
        description: error.response?.data?.message || 'An error occurred during import',
        variant: 'destructive',
      });
    }
  });

  // Handle import button click
  const handleImport = () => {
    importMutation.mutate();
  };

  // Simple progress circle component
  const ProgressCircle = ({ 
    value, 
    size = 40, 
    strokeWidth = 4 
  }: {
    value: number;
    size?: number;
    strokeWidth?: number;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;
    
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="stroke-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="stroke-primary"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dy=".3em"
          textAnchor="middle"
          className="text-xs font-medium fill-gray-500"
        >
          {value}%
        </text>
      </svg>
    );
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownToLine className="h-5 w-5" />
          Import Listings from Hospitable
        </CardTitle>
        <CardDescription>
          Import your property listings from Hospitable to display on your website
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {(error as any)?.response?.data?.message || 'Failed to fetch properties from Hospitable.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : properties && Array.isArray(properties) && properties.length > 0 ? (
            <div>
              <p className="mb-2 font-medium">Found {properties.length} properties in your Hospitable account:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-2 border rounded-md">
                {properties.map((property) => (
                  <div key={property.id} className="flex items-center gap-2 p-2 border rounded-md bg-secondary/10">
                    <img 
                      src={property.image || '/placeholder-property.jpg'} 
                      alt={property.name} 
                      className="h-10 w-10 object-cover rounded-md"
                    />
                    <div className="flex-1 truncate">
                      <p className="text-sm font-medium truncate">{property.name}</p>
                      <p className="text-xs text-gray-500">ID: {property.id}</p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {property.beds?.length || 0} {property.beds?.length === 1 ? 'bed' : 'beds'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border rounded-md bg-secondary/10">
              <p className="text-gray-500">No properties found in your Hospitable account</p>
              <p className="text-sm text-gray-400 mt-1">
                Connect your Hospitable account or add properties first
              </p>
            </div>
          )}
        </div>

        {importMutation.isSuccess && (
          <Alert className="mb-4">
            <Check className="h-4 w-4" />
            <AlertTitle>Import completed</AlertTitle>
            <AlertDescription>
              Successfully imported {importedCount} properties from Hospitable.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {(isImporting || importMutation.isPending) && (
            <div className="flex items-center gap-2">
              <ProgressCircle value={importProgress} size={36} strokeWidth={4} />
              <span className="text-sm text-gray-500">Importing...</span>
            </div>
          )}
        </div>

        <Button 
          onClick={handleImport} 
          disabled={isLoading || isImporting || importMutation.isPending || isError || !properties || !Array.isArray(properties) || properties.length === 0}
        >
          {(isImporting || importMutation.isPending) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Import Listings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HospitableListingImporter;