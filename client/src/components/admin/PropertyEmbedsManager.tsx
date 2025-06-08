import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

interface PropertyEmbeds {
  id: number;
  name: string;
  bookingWidgetUrl: string | null;
  reviewWidgetCode: string | null;
}

const PropertyEmbedsManager = () => {
  const { data: properties, isLoading } = useQuery<PropertyEmbeds[]>({
    queryKey: ['/api/properties'],
  });

  const updatePropertyEmbed = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { bookingWidgetUrl?: string; reviewWidgetCode?: string } }) => {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update property');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Property Embed Codes Manager</h1>
      
      <div className="grid grid-cols-1 gap-6">
        {properties?.map((property) => (
          <PropertyEmbedCard 
            key={property.id}
            property={property}
            onSave={(data) => updatePropertyEmbed.mutate({ id: property.id, data })}
            isSaving={updatePropertyEmbed.isPending}
          />
        ))}
      </div>
    </div>
  );
};

interface PropertyEmbedCardProps {
  property: PropertyEmbeds;
  onSave: (data: { bookingWidgetUrl: string; reviewWidgetCode: string }) => void;
  isSaving: boolean;
}

const PropertyEmbedCard = ({ property, onSave, isSaving }: PropertyEmbedCardProps) => {
  const [bookingWidgetUrl, setBookingWidgetUrl] = useState(property.bookingWidgetUrl || '');
  const [reviewWidgetCode, setReviewWidgetCode] = useState(property.reviewWidgetCode || '');

  useEffect(() => {
    setBookingWidgetUrl(property.bookingWidgetUrl || '');
    setReviewWidgetCode(property.reviewWidgetCode || '');
  }, [property]);

  const handleSave = () => {
    onSave({
      bookingWidgetUrl,
      reviewWidgetCode,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{property.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`booking-widget-${property.id}`}>Booking Widget URL</Label>
          <Input
            id={`booking-widget-${property.id}`}
            value={bookingWidgetUrl}
            onChange={(e) => setBookingWidgetUrl(e.target.value)}
            placeholder="https://booking.hospitable.com/widget/..."
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            The full URL for the booking widget iframe (Hospitable.com or similar)
          </p>
        </div>
        
        <div>
          <Label htmlFor={`review-widget-${property.id}`}>Review Widget Code</Label>
          <Input
            id={`review-widget-${property.id}`}
            value={reviewWidgetCode}
            onChange={(e) => setReviewWidgetCode(e.target.value)}
            placeholder="eyJwIjoiNjVlMGZiNTg5MjBlYWEwMDYxMjdlNWVjIn0="
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            The data-revyoos-embed code for the Revyoos widget
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PropertyEmbedsManager;