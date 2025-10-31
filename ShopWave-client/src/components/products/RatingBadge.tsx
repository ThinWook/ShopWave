"use client";

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingBadgeProps {
  rating: number; // 0-5
  className?: string;
  size?: number; // icon size
  showMax?: boolean; // optionally show /5
}

export function RatingBadge({ rating, className, size = 14, showMax = false }: RatingBadgeProps) {
  const value = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border border-border bg-background/80 px-2 py-0.5 text-xs font-semibold shadow-sm',
        className
      )}
      aria-label={`Đánh giá ${value.toFixed(1)} trên 5 sao`}
    >
      <Star
        size={size}
        className="text-yellow-500 fill-yellow-400 drop-shadow-[0_0_1px_rgba(0,0,0,0.15)]"
        strokeWidth={0}
      />
      <span className="leading-none">
        {value.toFixed(1)}{showMax && ' /5'}
      </span>
    </span>
  );
}
