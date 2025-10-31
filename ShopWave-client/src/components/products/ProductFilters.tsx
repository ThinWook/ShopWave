
"use client";

import { useProducts } from '@/contexts/ProductContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RangeSlider } from '@/components/ui/range-slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';
import { StarRating } from './StarRating';
import { formatPrice } from '@/lib/format';

export function ProductFilters() {
  const { filters, setFilters, categories, minMaxPrice } = useProducts();
  const [currentMinPrice, currentMaxPrice] = filters.priceRange;
  const [minPossiblePrice, maxPossiblePrice] = minMaxPrice;

  const handleCategoryChange = (value: string) => {
    setFilters({ category: value === 'all' ? null : value });
  };

  const handlePriceChange = (value: [number, number]) => {
    setFilters({ priceRange: value });
  };

  const handleRatingChange = (rating: number) => {
    setFilters({ rating: filters.rating === rating ? null : rating });
  };
  
  const clearFilters = () => {
    setFilters({
      category: null,
      priceRange: [minPossiblePrice, maxPossiblePrice],
      rating: null,
      searchQuery: filters.searchQuery, // Keep search query
    });
  };

  const hasActiveFilters = filters.category || filters.priceRange[0] !== minPossiblePrice || filters.priceRange[1] !== maxPossiblePrice || filters.rating;

  if (categories.length === 0 && minPossiblePrice === 0 && maxPossiblePrice === 0) {
    // Still loading initial product data
    return <div className="w-full md:w-64 lg:w-72"><Card><CardHeader><CardTitle>Filters</CardTitle></CardHeader><CardContent><p>Loading filters...</p></CardContent></Card></div>;
  }

  return (
    <Card className="w-full md:w-60 lg:w-64 xl:w-72 sticky top-24 self-start shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl flex items-center"><Filter className="mr-2 h-5 w-5" />Filters</CardTitle>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            <X className="mr-1 h-3 w-3" /> Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="category-filter" className="text-base font-medium mb-2 block">Category</Label>
          <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
            <SelectTrigger id="category-filter" className="w-full">
              <SelectValue placeholder="Select category" />
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

        <div>
          <Label htmlFor="price-filter" className="text-base font-medium mb-2 block">Price Range</Label>
          <RangeSlider
            id="price-filter"
            min={minPossiblePrice}
            max={maxPossiblePrice}
            step={1000}
            value={filters.priceRange}
            onValueChange={(v) => handlePriceChange(v as [number, number])}
            className="w-full"
            aria-label="Price range slider"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{formatPrice(currentMinPrice)}</span>
            <span>{formatPrice(currentMaxPrice)}</span>
          </div>
        </div>

        <div>
          <Label className="text-base font-medium mb-2 block">Rating</Label>
          <div className="space-y-1">
            {[4, 3, 2, 1].map((rate) => (
              <Button
                key={rate}
                variant={filters.rating === rate ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => handleRatingChange(rate)}
                aria-pressed={filters.rating === rate}
              >
                <StarRating rating={rate} totalStars={rate} size={16} className="mr-2" />
                {rate} star{rate > 1 ? 's' : ''} & up
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
