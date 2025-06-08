import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import DestinationCard from '@/components/DestinationCard';
import TestimonialCard from '@/components/TestimonialCard';
import CustomSearchBar from '@/components/CustomSearchBar';
import { getFeaturedProperties, getFeaturedCities } from '@/lib/api';
import { Meta } from '@/lib/seo';

const Home: React.FC = () => {
  const { data: featuredProperties, isLoading: isLoadingProperties } = useQuery({
    queryKey: ['/api/properties/featured'],
    queryFn: () => getFeaturedProperties(),
  });

  const { data: featuredCities, isLoading: isLoadingCities } = useQuery({
    queryKey: ['/api/cities/featured'],
    queryFn: () => getFeaturedCities(),
  });

  // Sample testimonials data
  const testimonials = [
    {
      quote: "Booking directly through StayDirectly was so easy and saved us money. The property was exactly as described and the host was incredibly helpful.",
      name: "Sarah L.",
      location: "New York, USA",
      avatarUrl: "https://randomuser.me/api/portraits/women/45.jpg",
      rating: 5
    },
    {
      quote: "As a frequent traveler, I appreciate the direct communication with property owners. It makes for a much more personal experience than traditional hotel stays.",
      name: "Michael T.",
      location: "London, UK",
      avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: 5
    },
    {
      quote: "The interface is clean and easy to use. I found exactly what I was looking for within minutes and the booking process was seamless. Highly recommend!",
      name: "Emma R.",
      location: "Sydney, Australia",
      avatarUrl: "https://randomuser.me/api/portraits/women/68.jpg",
      rating: 4.5
    }
  ];

  return (
    <>
      <Meta 
        title="StayDirectly - Book Unique Accommodations Directly"
        description="Find and book unique accommodations directly from hosts - no fees, no middlemen, just authentic stays."
        canonical="/"
      />

      {/* Hero Section */}
      <div className="relative h-[70vh] bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')" }}>
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">Find your next perfect stay</h1>
          <p className="text-xl md:text-2xl mb-8 text-center max-w-2xl">Book directly with hosts worldwide and save on booking fees</p>
          
          {/* Custom Search Widget */}
          <div className="w-full max-w-4xl">
            <CustomSearchBar className="w-full" />
          </div>
        </div>
      </div>

      {/* Featured Destinations */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-8">Popular Destinations</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoadingCities ? (
            // Skeleton loading state
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="relative h-64 rounded-lg overflow-hidden bg-gray-200 animate-pulse"></div>
            ))
          ) : (
            featuredCities?.map((city) => (
              <DestinationCard key={city.id} destination={city} />
            ))
          )}
        </div>
      </div>

      {/* Featured Properties */}
      <div className="container mx-auto px-4 py-12 bg-gray-50">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Featured Properties</h2>
          <Link href="/search" className="text-primary hover:text-blue-700 font-medium flex items-center">
            View all <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoadingProperties ? (
            // Skeleton loading state
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm h-[300px]">
                <div className="aspect-[4/3] bg-gray-200 animate-pulse"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse mb-2 w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse mb-3 w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                </div>
              </div>
            ))
          ) : (
            featuredProperties?.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))
          )}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">What Our Guests Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </>
  );
};

export default Home;
