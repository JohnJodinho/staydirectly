import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface SearchWidgetProps {
  className?: string;
  variant?: 'hero' | 'sidebar';
}

const SearchWidget: React.FC<SearchWidgetProps> = ({ 
  className = '',
  variant = 'hero' 
}) => {
  const [, navigate] = useLocation();
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [guests, setGuests] = useState('1 guest');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination) {
      navigate(`/search?q=${encodeURIComponent(destination)}`);
    }
  };

  const isHero = variant === 'hero';
  const containerClasses = isHero 
    ? "bg-white rounded-lg shadow-lg p-4 w-full max-w-4xl text-gray-800"
    : "bg-white rounded-lg shadow-sm p-4 w-full";

  return (
    <div className={`${containerClasses} ${className}`}>
      <form onSubmit={handleSearch}>
        <div className={`grid grid-cols-1 ${isHero ? 'md:grid-cols-3' : ''} gap-4`}>
          <div className="relative">
            <Label className="block text-sm font-medium text-gray-700 mb-1">Where</Label>
            <Input
              type="text"
              placeholder="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div className="relative">
            <Label className="block text-sm font-medium text-gray-700 mb-1">Dates</Label>
            <Input
              type="text"
              placeholder="Add dates"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div className="relative">
            <Label className="block text-sm font-medium text-gray-700 mb-1">Guests</Label>
            <Select value={guests} onValueChange={setGuests}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select guests" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1 guest">1 guest</SelectItem>
                <SelectItem value="2 guests">2 guests</SelectItem>
                <SelectItem value="3 guests">3 guests</SelectItem>
                <SelectItem value="4+ guests">4+ guests</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-center">
          <Button
            type="submit"
            className={`${isHero ? 'bg-primary hover:bg-blue-600 text-white' : 'bg-primary'} font-medium px-6 py-2 rounded-full transition-colors w-full md:w-auto`}
          >
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SearchWidget;
