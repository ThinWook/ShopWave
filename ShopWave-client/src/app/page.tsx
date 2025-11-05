
"use client";

import dynamic from 'next/dynamic';
import { useProducts } from '@/contexts/ProductContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductFiltersBar } from '@/components/products/ProductFiltersBar';
import { ProductSort } from '@/components/products/ProductSort';

// Lazy-load heavier client components to cut initial bundle size
const ProductGrid = dynamic(() => import('@/components/products/ProductGrid').then(m => m.ProductGrid), {
  // Shown on the client while the chunk is loading (SSR still renders content)
  loading: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col h-full overflow-hidden rounded-lg shadow-lg">
          <div className="relative aspect-square">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  ),
});

// ProductSuggestions removed from scope

const HomeBanner = dynamic(() => import('@/components/common/HomeBanner'), {
  loading: () => <Skeleton className="w-full h-[220px] sm:h-[300px] md:h-[700px] rounded-xl" />,
});

export default function HomePage() {
  const { filteredProducts } = useProducts();

  return (
    <div className="flex flex-col gap-6">
      <HomeBanner />
      <ProductFiltersBar />
      <section className="w-full">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Khám phá sản phẩm
          </h1>
          <ProductSort />
        </div>
        <ProductGrid products={filteredProducts} />
        {/* Product suggestions section removed */}
      </section>
    </div>
  );
}
