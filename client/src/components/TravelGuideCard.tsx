import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TravelGuide {
  id: number;
  title: string;
  category: string;
  categoryColor: string;
  excerpt: string;
  imageUrl: string;
}

interface TravelGuideCardProps {
  guide: TravelGuide;
}

const TravelGuideCard: React.FC<TravelGuideCardProps> = ({ guide }) => {
  const { title, category, categoryColor, excerpt, imageUrl } = guide;
  
  // Map category color to Tailwind classes
  const getCategoryColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      'blue': 'bg-blue-100 text-primary',
      'green': 'bg-green-100 text-secondary',
      'amber': 'bg-amber-100 text-amber-600',
      'red': 'bg-red-100 text-red-600',
      'purple': 'bg-purple-100 text-purple-600'
    };
    
    return colorMap[color] || 'bg-gray-100 text-gray-800';
  };
  
  return (
    <Link href="#">
      <Card className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full group">
        <div className="aspect-[16/9]">
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover" 
          />
        </div>
        <CardContent className="p-4">
          <span className={cn(
            "inline-block px-3 py-1 text-xs rounded-full mb-3",
            getCategoryColorClasses(categoryColor)
          )}>
            {category}
          </span>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{excerpt}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default TravelGuideCard;
