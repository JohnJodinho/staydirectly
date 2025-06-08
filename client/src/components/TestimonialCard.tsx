import React from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Testimonial {
  quote: string;
  name: string;
  location: string;
  avatarUrl: string;
  rating: number;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => {
  const { quote, name, location, avatarUrl, rating } = testimonial;
  
  // Create an array of stars based on the rating
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(rating));

  return (
    <Card className="bg-white shadow-sm h-full">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="text-amber-500">
            {stars.map((full, index) => (
              <Star 
                key={index} 
                className={`inline-block w-4 h-4 ${full ? 'fill-current' : ''}`}
              />
            ))}
          </div>
        </div>
        <p className="text-gray-600 mb-4 line-clamp-4">{quote}</p>
        <div className="flex items-center">
          <img 
            src={avatarUrl} 
            alt={name} 
            className="w-10 h-10 rounded-full mr-3 object-cover" 
          />
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-sm text-gray-500">{location}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestimonialCard;
