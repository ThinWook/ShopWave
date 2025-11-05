"use client";

import { useProducts } from '@/contexts/ProductContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RangeSlider } from '@/components/ui/range-slider';
import { X, Filter } from 'lucide-react';
import { formatPrice } from '@/lib/format';

export function ProductFiltersBar() {
  const { filters, setFilters, categories, minMaxPrice } = useProducts();
  const [currentMinPrice, currentMaxPrice] = filters.priceRange;
  const [minPossiblePrice, maxPossiblePrice] = minMaxPrice;

  const handleCategoryChange = (value: string) => {
    setFilters({ category: value === 'all' ? null : value });
  };

  const handlePriceChange = (value: [number, number]) => {
    setFilters({ priceRange: value });
  };

  // Rating filter removed

  const clearFilters = () => {
    setFilters({
      category: null,
      priceRange: [minPossiblePrice, maxPossiblePrice],
      searchQuery: filters.searchQuery, // keep search query
    });
  };

  const hasActiveFilters =
  !!filters.category ||
  filters.priceRange[0] !== minPossiblePrice ||
  filters.priceRange[1] !== maxPossiblePrice;

  return (
    <div className="w-full border rounded-lg p-3 md:p-4 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </div>

        {/* Category */}
        <div className="min-w-[160px]">
          <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
            <SelectTrigger aria-label="Category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rating filter removed */}

        {/* Price Range */}
        <div className="flex items-center gap-2 grow basis-full sm:basis-auto sm:grow-0 sm:min-w-[260px]">
          <div className="hidden sm:block text-xs text-muted-foreground min-w-[52px] text-right">
            {formatPrice(currentMinPrice)}
          </div>
          <RangeSlider
            min={minPossiblePrice}
            max={maxPossiblePrice}
            step={1000}
            value={filters.priceRange}
            onValueChange={(v) => handlePriceChange(v as [number, number])}
            className="w-full sm:w-64 md:w-72"
            aria-label="Price range"
          />
          <div className="hidden sm:block text-xs text-muted-foreground min-w-[52px]">
            {formatPrice(currentMaxPrice)}
          </div>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
            <X className="mr-1 h-3 w-3" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}
