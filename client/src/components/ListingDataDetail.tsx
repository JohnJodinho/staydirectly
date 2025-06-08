import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, FileJson, Clipboard, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ListingDataDetailProps {
  listing: any;
}

// Component to display all raw data points from the Hospitable API listing
const ListingDataDetail: React.FC<ListingDataDetailProps> = ({ listing }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Format JSON for display
  const formattedJson = JSON.stringify(listing, null, 2);
  
  // Get a count of how many data points are available
  const dataPointCount = Object.keys(listing).length;
  
  // Copy JSON to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full border rounded-md p-2 my-4"
    >
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <FileJson className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-medium">
            Complete API Data
          </h3>
          <Badge variant="outline" className="ml-2">
            {dataPointCount} fields
          </Badge>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent className="px-4 pt-2 pb-4">
        <div className="relative">
          <Button 
            variant="outline" 
            size="sm" 
            className="absolute right-2 top-2 z-10"
            onClick={copyToClipboard}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Clipboard className="h-4 w-4" />
            )}
            {copied ? 'Copied' : 'Copy JSON'}
          </Button>
          
          <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-[500px] mt-2 text-xs">
            {formattedJson}
          </pre>
        </div>
        
        {/* Structured Data View */}
        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-medium">Structured Data Points</h4>
          
          {/* Display data in categorized sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="border rounded-md p-4">
              <h5 className="text-sm font-semibold mb-2">Basic Information</h5>
              <ul className="text-xs space-y-1">
                <li><strong>ID:</strong> {listing.id}</li>
                <li><strong>Private Name:</strong> {listing.private_name || 'Not Set'}</li>
                <li><strong>Public Name:</strong> {listing.public_name || 'Not Set'}</li>
                <li><strong>Platform:</strong> {listing.platform || 'Not Set'}</li>
                <li><strong>Platform ID:</strong> {listing.platform_id || 'Not Set'}</li>
                <li><strong>Available:</strong> {listing.available ? 'Yes' : 'No'}</li>
                <li><strong>Property Type:</strong> {listing.property_type || 'Not Set'}</li>
                <li><strong>Room Type:</strong> {listing.room_type || 'Not Set'}</li>
              </ul>
            </div>
            
            {/* Location */}
            <div className="border rounded-md p-4">
              <h5 className="text-sm font-semibold mb-2">Location</h5>
              <ul className="text-xs space-y-1">
                {listing.address ? (
                  <>
                    <li><strong>Street:</strong> {listing.address.street || 'Not Set'}</li>
                    <li><strong>Apartment:</strong> {listing.address.apt || 'Not Set'}</li>
                    <li><strong>City:</strong> {listing.address.city || 'Not Set'}</li>
                    <li><strong>State:</strong> {listing.address.state || 'Not Set'}</li>
                    <li><strong>ZIP:</strong> {listing.address.zipcode || 'Not Set'}</li>
                    <li><strong>Country:</strong> {listing.address.country_code || 'Not Set'}</li>
                    <li><strong>Latitude:</strong> {listing.address.latitude || 'Not Set'}</li>
                    <li><strong>Longitude:</strong> {listing.address.longitude || 'Not Set'}</li>
                  </>
                ) : (
                  <li>No address information available</li>
                )}
              </ul>
            </div>
            
            {/* Capacity and Features */}
            <div className="border rounded-md p-4">
              <h5 className="text-sm font-semibold mb-2">Capacity & Features</h5>
              <ul className="text-xs space-y-1">
                {listing.capacity ? (
                  <>
                    <li><strong>Max Guests:</strong> {listing.capacity.max || 'Not Set'}</li>
                    <li><strong>Bedrooms:</strong> {listing.capacity.bedrooms || 'Not Set'}</li>
                    <li><strong>Beds:</strong> {listing.capacity.beds || 'Not Set'}</li>
                    <li><strong>Bathrooms:</strong> {listing.capacity.bathrooms || 'Not Set'}</li>
                  </>
                ) : (
                  <>
                    <li><strong>Max Guests:</strong> {listing.max_guests || 'Not Set'}</li>
                    <li><strong>Bedrooms:</strong> {listing.bedrooms || 'Not Set'}</li>
                    <li><strong>Bathrooms:</strong> {listing.bathrooms || 'Not Set'}</li>
                  </>
                )}
                <li><strong>Amenities:</strong> {listing.amenities?.length || 0} available</li>
                {listing.amenities && listing.amenities.length > 0 && (
                  <li className="pt-1">
                    <div className="flex flex-wrap gap-1 mt-1">
                      {listing.amenities.slice(0, 8).map((amenity: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-[9px]">
                          {amenity.toLowerCase().replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {listing.amenities.length > 8 && (
                        <Badge variant="secondary" className="text-[9px]">
                          +{listing.amenities.length - 8} more
                        </Badge>
                      )}
                    </div>
                  </li>
                )}
              </ul>
            </div>
            
            {/* Pricing and Schedule */}
            <div className="border rounded-md p-4">
              <h5 className="text-sm font-semibold mb-2">Pricing & Schedule</h5>
              <ul className="text-xs space-y-1">
                <li><strong>Base Price:</strong> {listing.base_price ? `$${listing.base_price}` : 'Not Set'}</li>
                <li><strong>Check-in:</strong> {listing.check_in || 'Not Set'}</li>
                <li><strong>Check-out:</strong> {listing.check_out || 'Not Set'}</li>
                <li><strong>Min Nights:</strong> {listing.min_nights || 'Not Set'}</li>
                <li><strong>Max Nights:</strong> {listing.max_nights || 'Not Set'}</li>
                <li>
                  <strong>Fees:</strong> {listing.fees?.length || 0} fees
                  {listing.fees && listing.fees.length > 0 && (
                    <div className="pt-1 ml-2">
                      {listing.fees.map((fee: any, index: number) => (
                        <div key={index} className="text-[9px] mt-1">
                          - {fee.name}: {fee.fee.formatted}
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ListingDataDetail;