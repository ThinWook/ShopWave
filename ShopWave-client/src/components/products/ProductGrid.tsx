
"use client";

import { ProductCard, ProductCardSkeleton } from './ProductCard';
import type { Product } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Frown } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  skeletonsCount?: number;
}

export function ProductGrid({ products, isLoading = false, skeletonsCount = 8 }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {Array.from({ length: skeletonsCount }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
       <Alert className="mt-8 text-center">
         <Frown className="h-6 w-6 mx-auto mb-2" />
         <AlertTitle className="font-semibold">No Products Found</AlertTitle>
         <AlertDescription>
           Sorry, we couldn&apos;t find any products matching your criteria. Try adjusting your filters or search.
         </AlertDescription>
       </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default ProductGrid;
