
"use client";

import { Star, StarHalf, LucideIcon } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface StarRatingProps extends HTMLAttributes<HTMLDivElement> {
  rating: number;
  totalStars?: number;
  size?: number;
  className?: string;
  iconClassName?: string;
}

export function StarRating({ rating, totalStars = 5, size = 20, className, iconClassName, ...props }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center", className)} {...props} aria-label={`Rating: ${rating} out of ${totalStars} stars`}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} fill="currentColor" strokeWidth={0} size={size} className={cn("text-accent", iconClassName)} />
      ))}
      {halfStar && <StarHalf key="half" fill="currentColor" strokeWidth={0} size={size} className={cn("text-accent", iconClassName)} />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} fill="currentColor" strokeWidth={0} size={size} className={cn("text-muted-foreground opacity-50", iconClassName)} />
      ))}
    </div>
  );
}
