import React from 'react';
import { Link } from 'wouter';
import { Meta } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Home, Search, Map } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <>
      <Meta 
        title="Page Not Found | StayDirectly"
        description="We couldn't find the page you were looking for. Navigate back to our homepage to find your perfect vacation rental."
        canonical="/404"
        type="website"
      />
      
      <div className="container mx-auto px-4 py-16 text-center max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-5xl md:text-6xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6">Page Not Found</h2>
          
          <p className="text-gray-600 mb-8">
            We couldn't find the page you were looking for. It might have been removed, 
            renamed, or is temporarily unavailable.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Button asChild variant="outline" className="flex items-center justify-center">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Return Home
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="flex items-center justify-center">
              <Link href="/search">
                <Search className="mr-2 h-4 w-4" />
                Search Properties
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="flex items-center justify-center">
              <Link href="/cities">
                <Map className="mr-2 h-4 w-4" />
                Browse Cities
              </Link>
            </Button>
          </div>
          
          <p className="text-sm text-gray-500">
            If you believe this is an error, please <a href="/contact" className="text-primary hover:underline">contact us</a>.
          </p>
        </div>
      </div>
    </>
  );
};

export default NotFound;