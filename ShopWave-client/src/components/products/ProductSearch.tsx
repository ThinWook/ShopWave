
"use client";

import { useState, useEffect } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ProductSearchProps = {
  className?: string;
};

export function ProductSearch({ className }: ProductSearchProps) {
  const { filters, setFilters } = useProducts();
  const [searchTerm, setSearchTerm] = useState(filters.searchQuery);

  useEffect(() => {
    // Update internal search term if global filter changes (e.g. cleared elsewhere)
    setSearchTerm(filters.searchQuery);
  }, [filters.searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ searchQuery: searchTerm });
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilters({ searchQuery: '' });
  };

  return (
    <form onSubmit={handleSearch} className={`relative w-full max-w-md flex items-center ${className ?? ''}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Tìm sản phẩm..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 pr-10 py-2 h-10 shadow-sm focus-visible:ring-primary focus-visible:border-primary"
        aria-label="Tìm sản phẩm"
      />
      {searchTerm && (
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={clearSearch}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="Xóa tìm kiếm"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}
