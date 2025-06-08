import React from 'react';
import { Link } from 'wouter';
import { Property } from '@shared/schema';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import HeartButton from '@/components/ui/HeartButton';
import { formatPrice } from '@/lib/utils';
import { getPropertyUrl } from '@/lib/slugify';
import '@/lib/animations.css';

interface PropertyCardProps {
  property: Property;
  showLocation?: boolean;
  totalPrice?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  showLocation = true,
  totalPrice = false,
}) => {
  const {
    id,
    name,
    title,
    location,
    price,
    rating,
    reviewCount,
    imageUrl,
    bedrooms,
    bathrooms,
    maxGuests,
    type
  } = property;

  // Calculate room features text
  const featureText = `${bedrooms} ${bedrooms === 1 ? 'bedroom' : 'bedrooms'} · ${bathrooms} ${bathrooms === 1 ? 'bath' : 'baths'} · ${maxGuests} ${maxGuests === 1 ? 'guest' : 'guests'}`;

  return (
    <div id={`property-${id}`} className="property-card-container p-1">
      <Link href={getPropertyUrl(id, title || name)}>
        <Card className="bg-white rounded-xl overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.12)] hover-lift h-full fade-in">
          <div className="relative aspect-[4/3] overflow-hidden img-zoom-container">
            <img 
              src={imageUrl} 
              alt={title || name} 
              className="w-full h-full object-cover img-zoom"
            />
            <div className="absolute top-3 right-3">
              <HeartButton propertyId={id} className="pulse" />
            </div>
            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary" className="bg-white/80 hover:bg-white/90 text-black font-medium shadow-sm hover-scale transition-all">
                {type}
              </Badge>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg line-clamp-1">{title || name}</h3>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-amber-500 fill-current" />
                <span className="ml-1 text-sm font-medium">{rating?.toFixed(2)}</span>
              </div>
            </div>
            {showLocation && <p className="text-gray-600 text-sm mb-2">{location}</p>}
            <p className="text-gray-600 text-sm mb-3">{featureText}</p>
            <div className="flex justify-between items-center">
              <p>
                <span className="font-bold">{formatPrice(price)}</span> 
                <span className="text-gray-600"> night</span>
              </p>
              {totalPrice && (
                <p className="text-sm text-gray-500">{formatPrice(price * 6)} total</p>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

export default PropertyCard;
