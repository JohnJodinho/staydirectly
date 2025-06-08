import React from 'react';
import { Link } from 'wouter';
import { City } from '@shared/schema';
import { slugify } from '@/lib/utils';

interface DestinationCardProps {
  destination: City;
}

const DestinationCard: React.FC<DestinationCardProps> = ({ destination }) => {
  const { name, imageUrl, propertyCount } = destination;
  
  return (
    <Link href={`/city/${name}`} className="group">
      <div className="relative h-64 rounded-lg overflow-hidden">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover transition duration-300 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 text-white">
          <h3 className="text-xl font-bold">{name}</h3>
          <p className="text-sm">{propertyCount} properties</p>
        </div>
      </div>
    </Link>
  );
};

export default DestinationCard;
