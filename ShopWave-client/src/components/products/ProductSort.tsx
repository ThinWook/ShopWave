
"use client";

import { useProducts } from '@/contexts/ProductContext';
import type { SortOption } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function ProductSort() {
  const { sortOption, setSortOption } = useProducts();

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'rating', label: 'Average Rating' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="sort-select" className="text-sm font-medium">Sort by:</Label>
      <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
        <SelectTrigger id="sort-select" className="w-[180px] h-10 shadow-sm">
          <SelectValue placeholder="Sort products" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
