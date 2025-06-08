import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';
import HospitableSearchBar from '@/components/HospitableSearchBar';
import { 
  Menu, 
  User, 
  Home, 
  MapPin, 
  Heart, 
  LogIn, 
  Building, 
  ChevronDown, 
  Link as LinkIcon, 
  ListChecks, 
  Globe,
  LayoutDashboard
} from 'lucide-react';

const Navbar: React.FC = () => {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isHomePage = location === '/';

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-primary text-2xl font-bold">StayDirectly</span>
          </Link>

          {/* Spacer for centering links and dropdown */}
          <div className="hidden lg:flex items-center flex-1 max-w-2xl mx-8"></div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/search" className="text-gray-600 hover:text-primary transition-colors">
              Book Your Stay
            </Link>
            
            {/* Markets Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center text-gray-600 hover:text-primary transition-colors">
                  <Building className="mr-1 h-4 w-4" />
                  <span>Markets</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/city/shenandoah" className="flex cursor-pointer">
                    <MapPin className="mr-2 h-4 w-4" /> Shenandoah, VA
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/city/annapolis" className="flex cursor-pointer">
                    <MapPin className="mr-2 h-4 w-4" /> Annapolis, MD
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/city/nashville" className="flex cursor-pointer">
                    <MapPin className="mr-2 h-4 w-4" /> Nashville, TN
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/city/blue-ridge" className="flex cursor-pointer">
                    <MapPin className="mr-2 h-4 w-4" /> Blue Ridge, GA
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            

            {/* User Menu Dropdown - temporarily hidden
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full flex items-center gap-2 px-4">
                  <Menu className="h-4 w-4" />
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogIn className="mr-2 h-4 w-4" /> Sign in
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Home className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Heart className="mr-2 h-4 w-4" /> Favorites
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <MapPin className="mr-2 h-4 w-4" /> Host your place
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            */}
          </nav>
          
          {/* Mobile menu button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="py-4">
                <div className="space-y-4 mt-4">
                  <Link to="/" className="block py-2 px-4 hover:bg-gray-100 rounded-md">
                    Home
                  </Link>
                  <Link to="/search" className="block py-2 px-4 hover:bg-gray-100 rounded-md">
                    Book Your Stay
                  </Link>
                  
                  {/* Mobile Markets Section */}
                  <div className="block py-2 px-4">
                    <div className="font-medium mb-2 flex items-center">
                      <Building className="mr-2 h-4 w-4" />
                      Markets
                    </div>
                    <div className="ml-4 space-y-2">
                      <Link to="/city/shenandoah" className="flex items-center py-1 hover:text-primary transition-colors">
                        <MapPin className="mr-2 h-4 w-4" />
                        Shenandoah, VA
                      </Link>
                      <Link to="/city/annapolis" className="flex items-center py-1 hover:text-primary transition-colors">
                        <MapPin className="mr-2 h-4 w-4" />
                        Annapolis, MD
                      </Link>
                      <Link to="/city/nashville" className="flex items-center py-1 hover:text-primary transition-colors">
                        <MapPin className="mr-2 h-4 w-4" />
                        Nashville, TN
                      </Link>
                      <Link to="/city/blue-ridge" className="flex items-center py-1 hover:text-primary transition-colors">
                        <MapPin className="mr-2 h-4 w-4" />
                        Blue Ridge, GA
                      </Link>
                    </div>
                  </div>
                  

                  {/* Sign in link hidden for now
                  <Link href="#" className="block py-2 px-4 hover:bg-gray-100 rounded-md">
                    Sign in
                  </Link>
                  */}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* No mobile search bar - using hero search instead */}
      </div>
    </header>
  );
};

export default Navbar;
