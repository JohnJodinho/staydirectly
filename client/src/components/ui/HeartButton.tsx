import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addFavorite, removeFavorite } from '@/lib/api';

interface HeartButtonProps {
  propertyId: number;
  userId?: number;
  initialFavorited?: boolean;
  className?: string;
}

const HeartButton: React.FC<HeartButtonProps> = ({
  propertyId,
  userId = 1, // Default user ID for demo purposes
  initialFavorited = false,
  className,
}) => {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!userId) {
      // Handle unauthenticated users (e.g., show login modal)
      return;
    }
    
    setIsLoading(true);
    try {
      if (isFavorited) {
        await removeFavorite(userId, propertyId);
      } else {
        await addFavorite(userId, propertyId);
      }
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={cn(
        "transition-all focus:outline-none",
        isFavorited ? "text-red-500" : "text-gray-200 hover:text-white",
        "hover:scale-110 transition-transform duration-200",
        className
      )}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart 
        className={cn(
          "h-6 w-6",
          isFavorited && "fill-current",
          isFavorited && "heart-beat active"
        )} 
      />
    </button>
  );
};

export default HeartButton;
