import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { MapPin, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import '@/lib/animations.css';

interface CustomSearchBarProps {
  className?: string;
}

const locations = [
  { id: 'miami', name: 'Miami, FL' },
  { id: 'shenandoah', name: 'Shenandoah, VA' },
  { id: 'annapolis', name: 'Annapolis, MD' },
  { id: 'nashville', name: 'Nashville, TN' },
  { id: 'blue-ridge', name: 'Blue Ridge, GA' },
];

const CustomSearchBar: React.FC<CustomSearchBarProps> = ({ className }) => {
  const [, setLocation] = useLocation();
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);
  const [guests, setGuests] = useState<string>('1');

  const handleSearch = () => {
    // Build the search query with available parameters
    const searchParams = new URLSearchParams();
    
    if (selectedLocation) {
      searchParams.append('location', selectedLocation);
    }
    
    if (checkIn) {
      searchParams.append('checkIn', format(checkIn, 'yyyy-MM-dd'));
    }
    
    if (checkOut) {
      searchParams.append('checkOut', format(checkOut, 'yyyy-MM-dd'));
    }
    
    if (guests) {
      searchParams.append('guests', guests);
    }
    
    // Navigate to search results page with query parameters
    setLocation(`/search?${searchParams.toString()}`);
  };

  return (
    <div className={cn("bg-white rounded-full shadow-md border border-gray-200 flex flex-col md:flex-row items-center", className)}>
      {/* Where */}
      <div className="flex-1 py-3 px-6 border-b md:border-b-0 md:border-r border-gray-200 w-full">
        <div className="font-medium text-xs mb-1 text-center">Where</div>
        <div className="flex items-center">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="border-0 p-0 h-auto font-normal text-gray-600 w-full [&>svg]:hidden">
              <SelectValue placeholder="Search destinations" className="text-center" />
            </SelectTrigger>
            <SelectContent 
              className="max-h-[300px] rounded-lg bg-white py-2 px-1 shadow-2xl border-0 w-60 overflow-auto"
              position="popper"
              sideOffset={5}
            >
              {locations.map((loc) => (
                <SelectItem 
                  key={loc.id} 
                  value={loc.id} 
                  className="hover:bg-gray-50 rounded-md py-3 px-4 transition-colors duration-150 text-base font-normal data-[state=checked]:bg-gray-50 data-[state=checked]:font-semibold"
                >
                  <div className="flex items-center w-full">
                    {selectedLocation === loc.id && (
                      <svg className="mr-3" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor" />
                      </svg>
                    )}
                    <span className={`${selectedLocation === loc.id ? '' : 'ml-8'}`}>
                      {loc.name}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Check in */}
      <div className="flex-1 py-3 px-6 border-b md:border-b-0 md:border-r border-gray-200 w-full">
        <div className="font-medium text-xs mb-1 text-center">Check in</div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="p-0 h-auto font-normal text-center text-gray-600 w-full"
            >
              {checkIn ? (
                format(checkIn, 'MMM d, yyyy')
              ) : (
                <span>Add dates</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-lg border-0 shadow-2xl" align="start">
            <Calendar
              mode="single"
              selected={checkIn}
              onSelect={setCheckIn}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Check out */}
      <div className="flex-1 py-3 px-6 border-b md:border-b-0 md:border-r border-gray-200 w-full">
        <div className="font-medium text-xs mb-1 text-center">Check out</div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="p-0 h-auto font-normal text-center text-gray-600 w-full"
            >
              {checkOut ? (
                format(checkOut, 'MMM d, yyyy')
              ) : (
                <span>Add dates</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-lg border-0 shadow-2xl" align="start">
            <Calendar
              mode="single"
              selected={checkOut}
              onSelect={setCheckOut}
              initialFocus
              disabled={(date) => 
                date < new Date() || (checkIn ? date <= checkIn : false)
              }
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Who */}
      <div className="flex-1 py-3 px-6 border-b md:border-b-0 w-full">
        <div className="font-medium text-xs mb-1 text-center">Who</div>
        <div className="flex items-center justify-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="p-0 h-auto font-normal text-center text-gray-600 w-full"
              >
                {parseInt(guests) > 0 ? (
                  <span>{parseInt(guests) === 1 ? '1 guest' : `${guests} guests`}</span>
                ) : (
                  <span>Add guests</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-72 p-4 rounded-lg border-0 shadow-2xl" 
              align="center"
              sideOffset={5}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-base font-medium">Adults</span>
                    <span className="text-sm text-gray-500">Ages 13 or above</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 rounded-full p-0 flex items-center justify-center border-gray-400"
                      onClick={() => {
                        const current = parseInt(guests);
                        if (current > 0) setGuests((current - 1).toString());
                      }}
                      disabled={parseInt(guests) === 0}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </Button>
                    <span className="w-5 text-center">{guests}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 rounded-full p-0 flex items-center justify-center border-gray-400"
                      onClick={() => {
                        const current = parseInt(guests);
                        setGuests((current + 1).toString());
                      }}
                      disabled={parseInt(guests) >= 16}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Search button */}
      <div className="p-2 md:ml-1 mt-2 md:mt-0 md:mr-1">
        <Button 
          className="rounded-full bg-[#FF385C] hover:bg-[#E00B41] text-white aspect-square w-12 h-12 flex items-center justify-center"
          onClick={handleSearch}
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default CustomSearchBar;