import React from 'react';
import { Link } from 'wouter';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Heart, 
  LinkIcon, 
  ListChecks,
  Globe,
  LayoutDashboard
} from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h3 className="font-bold text-lg mb-4">Blog</h3>
            <ul className="space-y-3 text-gray-600">
              <li><Link href="#" className="hover:text-primary transition-colors">Travel Guides</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Destination Tips</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Guest Stories</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Hosting Advice</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Properties</h3>
            <ul className="space-y-3 text-gray-600">
              <li><Link href="#" className="hover:text-primary transition-colors">Featured Stays</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Luxury Homes</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Unique Experiences</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">For Property Owners</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Locations</h3>
            <ul className="space-y-3 text-gray-600">
              <li><Link href="/city/shenandoah" className="hover:text-primary transition-colors">Shenandoah, VA</Link></li>
              <li><Link href="/city/annapolis" className="hover:text-primary transition-colors">Annapolis, MD</Link></li>
              <li><Link href="/city/nashville" className="hover:text-primary transition-colors">Nashville, TN</Link></li>
              <li><Link href="/city/blue-ridge" className="hover:text-primary transition-colors">Blue Ridge, GA</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center">
              <LayoutDashboard className="mr-2 h-5 w-5" />
              Admin Dashboard
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li>
                <Link to="/connect" className="flex items-center hover:text-primary transition-colors">
                  <LinkIcon className="mr-2 h-4 w-4" /> Connect Account
                </Link>
              </li>
              <li>
                <Link to="/customer-listings" className="flex items-center hover:text-primary transition-colors">
                  <ListChecks className="mr-2 h-4 w-4" /> View Listings
                </Link>
              </li>
              <li>
                <Link to="/published-properties" className="flex items-center hover:text-primary transition-colors">
                  <Globe className="mr-2 h-4 w-4" /> Published Properties
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <Link href="#" aria-label="Facebook" className="text-gray-500 hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" aria-label="Twitter" className="text-gray-500 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" aria-label="Instagram" className="text-gray-500 hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" aria-label="LinkedIn" className="text-gray-500 hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
            
            <div className="text-gray-500 text-sm text-center md:text-right">
              <p>&copy; {new Date().getFullYear()} StayDirectly. All rights reserved.</p>
              <div className="flex justify-center md:justify-end space-x-4 mt-2">
                <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
                <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
                <Link href="#" className="hover:text-primary transition-colors">Sitemap</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
