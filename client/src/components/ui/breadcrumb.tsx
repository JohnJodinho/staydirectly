import React from 'react';
import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  return (
    <nav className={cn("text-sm mb-4", className)} aria-label="Breadcrumb">
      <ol className="flex flex-wrap">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="text-gray-400 mx-2 h-4 w-4" />
            )}
            
            {item.href && index !== items.length - 1 ? (
              <Link href={item.href} className="text-primary hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-600">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
