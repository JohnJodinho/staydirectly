import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import FilterButton from '@/components/ui/FilterButton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { formatPrice } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface FilterListProps {
  onFilterChange: (filters: any) => void;
  currentFilters: any;
}

const FilterList: React.FC<FilterListProps> = ({ onFilterChange, currentFilters }) => {
  const [location, setLocation] = useLocation();
  
  // Price range filter
  const [priceRange, setPriceRange] = useState<[number, number]>([
    currentFilters.minPrice || 0,
    currentFilters.maxPrice || 1000
  ]);

  // City filter
  const [city, setCity] = useState<string>(
    currentFilters.city || ''
  );

  // Property type filter
  const [propertyType, setPropertyType] = useState<string>(
    currentFilters.propertyType || ''
  );

  // Guests filter
  const [guests, setGuests] = useState<number>(
    currentFilters.guests || 0
  );

  // Bedrooms filter
  const [bedrooms, setBedrooms] = useState<number>(
    currentFilters.bedrooms || 0
  );

  // Bathrooms filter
  const [bathrooms, setBathrooms] = useState<number>(
    currentFilters.bathrooms || 0
  );

  // Amenities filter
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    currentFilters.amenities ? currentFilters.amenities.split(',') : []
  );

  // Apply filters and update URL
  const applyFilters = (newFilters: any) => {
    const filters = { ...currentFilters, ...newFilters };
    onFilterChange(filters);
    
    // Update URL with filters
    const params = new URLSearchParams(location.split('?')[1] || '');
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });
    
    const newLocation = location.split('?')[0] + (params.toString() ? `?${params.toString()}` : '');
    setLocation(newLocation);
  };

  // Toggle amenity selection
  const toggleAmenity = (amenity: string) => {
    let newAmenities;
    if (selectedAmenities.includes(amenity)) {
      newAmenities = selectedAmenities.filter(a => a !== amenity);
    } else {
      newAmenities = [...selectedAmenities, amenity];
    }
    setSelectedAmenities(newAmenities);
    applyFilters({ amenities: newAmenities.length ? newAmenities.join(',') : undefined });
  };

  // Clear all filters
  const clearFilters = () => {
    setPriceRange([0, 1000]);
    setCity('');
    setPropertyType('');
    setGuests(0);
    setBedrooms(0);
    setBathrooms(0);
    setSelectedAmenities([]);
    
    const params = new URLSearchParams(location.split('?')[1] || '');
    ['minPrice', 'maxPrice', 'city', 'propertyType', 'guests', 'bedrooms', 'bathrooms', 'amenities'].forEach(key => {
      params.delete(key);
    });
    
    const query = params.get('q');
    const newLocation = location.split('?')[0] + (query ? `?q=${query}` : '');
    setLocation(newLocation);
    
    onFilterChange({});
  };

  return (
    <div className="flex flex-wrap gap-4">
      {/* City Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative">
            <FilterButton 
              label={city || "City"}
              active={!!currentFilters.city}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2">
          <div className="space-y-1">
            {['Miami', 'New York', 'Los Angeles', 'Nashville', 'Chicago', 'San Francisco'].map((c) => (
              <Button
                key={c}
                variant="ghost"
                className={`w-full justify-start text-left ${
                  city === c ? 'bg-primary/10 text-primary' : ''
                }`}
                onClick={() => {
                  setCity(c);
                  applyFilters({ city: c });
                }}
              >
                {c}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Guests Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative">
            <FilterButton 
              label={guests > 0 ? `${guests} Guests` : "Guests"}
              active={currentFilters.guests !== undefined && currentFilters.guests > 0}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2">
          <div className="space-y-1">
            {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
              <Button
                key={num}
                variant="ghost"
                className={`w-full justify-start text-left ${
                  guests === num ? 'bg-primary/10 text-primary' : ''
                }`}
                onClick={() => {
                  setGuests(num);
                  applyFilters({ guests: num > 0 ? num : undefined });
                }}
              >
                {num === 0 ? 'Any' : num === 12 ? '12+' : num} {num === 1 ? 'Guest' : 'Guests'}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Bedrooms Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative">
            <FilterButton 
              label={bedrooms > 0 ? `${bedrooms}+ Bedrooms` : "Bedrooms"}
              active={currentFilters.bedrooms !== undefined && currentFilters.bedrooms > 0}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2">
          <div className="space-y-1">
            {[0, 1, 2, 3, 4, 5].map((num) => (
              <Button
                key={num}
                variant="ghost"
                className={`w-full justify-start text-left ${
                  bedrooms === num ? 'bg-primary/10 text-primary' : ''
                }`}
                onClick={() => {
                  setBedrooms(num);
                  applyFilters({ bedrooms: num > 0 ? num : undefined });
                }}
              >
                {num === 0 ? 'Any' : num === 5 ? '5+' : num} {num === 1 ? 'Bedroom' : 'Bedrooms'}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Bathrooms Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative">
            <FilterButton 
              label={bathrooms > 0 ? `${bathrooms}+ Bathrooms` : "Bathrooms"}
              active={currentFilters.bathrooms !== undefined && currentFilters.bathrooms > 0}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2">
          <div className="space-y-1">
            {[0, 1, 1.5, 2, 2.5, 3, 4].map((num) => (
              <Button
                key={num.toString()}
                variant="ghost"
                className={`w-full justify-start text-left ${
                  bathrooms === num ? 'bg-primary/10 text-primary' : ''
                }`}
                onClick={() => {
                  setBathrooms(num);
                  applyFilters({ bathrooms: num > 0 ? num : undefined });
                }}
              >
                {num === 0 ? 'Any' : num === 4 ? '4+' : num} {num === 1 ? 'Bathroom' : 'Bathrooms'}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Price Range Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative">
            <FilterButton 
              label={
                priceRange[0] === 0 && priceRange[1] === 1000
                  ? "Price Range"
                  : `${formatPrice(priceRange[0])} - ${formatPrice(priceRange[1])}`
              }
              active={currentFilters.minPrice !== undefined || currentFilters.maxPrice !== undefined}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="space-y-4">
            <h4 className="font-medium">Price Range</h4>
            <div className="pt-4">
              <Slider
                defaultValue={priceRange}
                min={0}
                max={1000}
                step={10}
                value={priceRange}
                onValueChange={(value: [number, number]) => setPriceRange(value)}
              />
            </div>
            <div className="flex justify-between">
              <span>{formatPrice(priceRange[0])}</span>
              <span>{formatPrice(priceRange[1])}</span>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button 
                variant="outline" 
                className="text-sm"
                onClick={() => setPriceRange([0, 1000])}
              >
                Reset
              </Button>
              <Button 
                className="text-sm"
                onClick={() => applyFilters({ minPrice: priceRange[0], maxPrice: priceRange[1] })}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Amenities Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative">
            <FilterButton 
              label={selectedAmenities.length > 0 ? `Amenities (${selectedAmenities.length})` : "Amenities"}
              active={selectedAmenities.length > 0}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4">
          <div className="space-y-4">
            <h4 className="font-medium">Amenities</h4>
            <div className="grid grid-cols-1 gap-2">
              {['WiFi', 'Pool', 'Kitchen', 'Air Conditioning', 'Washer/Dryer', 'Free Parking', 
                'TV', 'Hot Tub', 'Gym', 'Pets Allowed', 'Workspace'].map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`amenity-${amenity}`} 
                    checked={selectedAmenities.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <Label 
                    htmlFor={`amenity-${amenity}`} 
                    className="text-sm cursor-pointer"
                  >
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Property Type Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative">
            <FilterButton 
              label={propertyType || "Property Type"}
              active={!!currentFilters.propertyType}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2">
          <div className="space-y-1">
            {['Apartment', 'House', 'Villa', 'Condo', 'Cabin', 'Cottage'].map((type) => (
              <Button
                key={type}
                variant="ghost"
                className={`w-full justify-start text-left ${
                  propertyType === type ? 'bg-primary/10 text-primary' : ''
                }`}
                onClick={() => {
                  setPropertyType(type);
                  applyFilters({ propertyType: type });
                }}
              >
                {type}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Filters Button (only show if filters are applied) */}
      {Object.keys(currentFilters).length > 0 && (
        <Button 
          variant="ghost" 
          className="text-primary hover:text-primary/80"
          onClick={clearFilters}
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
};

export default FilterList;
