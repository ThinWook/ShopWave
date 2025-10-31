
"use client";

import dynamic from 'next/dynamic';
import { useProducts } from '@/contexts/ProductContext';
import { Skeleton } from '@/components/ui/skeleton';

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

const ProductSuggestions = dynamic(() => import('@/components/products/ProductSuggestions').then(m => m.ProductSuggestions), {
  loading: () => (
    <div className="mt-12">
      <Skeleton className="h-8 w-48 mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
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
    </div>
  ),
});

const ProductFiltersBar = dynamic(() => import('@/components/products/ProductFiltersBar').then(m => m.ProductFiltersBar), {
  loading: () => <div className="w-full"><Skeleton className="h-10 w-full" /></div>,
});

const ProductSort = dynamic(() => import('@/components/products/ProductSort').then(m => m.ProductSort), {
  loading: () => <Skeleton className="h-10 w-40" />,
});

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
            Discover Our Products
          </h1>
          <ProductSort />
        </div>
        <ProductGrid products={filteredProducts} />
        <div className="mt-12">
          <ProductSuggestions title="You Might Also Like" context="homepage" />
        </div>
      </section>
    </div>
  );
}
