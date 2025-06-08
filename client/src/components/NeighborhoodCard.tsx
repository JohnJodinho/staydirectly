import React from 'react';
import { Link } from 'wouter';
import { Neighborhood } from '@shared/schema';

interface NeighborhoodCardProps {
  neighborhood: Neighborhood;
}

const NeighborhoodCard: React.FC<NeighborhoodCardProps> = ({ neighborhood }) => {
  const { name, imageUrl, propertyCount, cityId } = neighborhood;
  
  return (
    <Link href={`/search?q=${name}`} className="group">
      <div className="relative h-48 rounded-lg overflow-hidden">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
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

export default NeighborhoodCard;
