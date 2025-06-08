import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combine class names with clsx and tailwind-merge
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Format price with currency symbol
export function formatPrice(price: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(price);
}

// Format date in readable format
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// Truncate text to specified length with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

// Calculate total price for a stay
export function calculateTotalPrice(
  nightPrice: number,
  nights: number,
  cleaningFee: number = 85,
  serviceFee: number = 0
): number {
  return nightPrice * nights + cleaningFee + serviceFee;
}

// Format location string (e.g., "Brooklyn, New York" -> "Brooklyn")
export function formatLocation(location: string): string {
  return location.split(",")[0].trim();
}

// Generates a slug from text
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

// Create a random ID (useful for temporary items)
export function createTempId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Get image placeholder if image is missing
export function getImagePlaceholder(): string {
  return "https://via.placeholder.com/300x200/e2e8f0/64748b?text=No+Image";
}

// Helper for constructing rating percentages
export function getRatingPercentage(rating: number): string {
  return `${Math.round((rating / 5) * 100)}%`;
}

// Create an array of stars for ratings display
export function createRatingStars(rating: number): ('full' | 'half' | 'empty')[] {
  const stars: ('full' | 'half' | 'empty')[] = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push('full');
  }
  
  // Add half star if needed
  if (hasHalfStar) {
    stars.push('half');
  }
  
  // Add empty stars
  while (stars.length < 5) {
    stars.push('empty');
  }
  
  return stars;
}
