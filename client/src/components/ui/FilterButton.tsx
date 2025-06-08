import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterButtonProps {
  label: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  label,
  onClick,
  active = false,
  className,
}) => {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className={cn(
        "rounded-full flex items-center gap-2 hover:shadow-sm transition",
        active && "bg-primary/10 border-primary",
        className
      )}
    >
      <span>{label}</span>
      <ChevronDown className="h-4 w-4" />
    </Button>
  );
};

export default FilterButton;
