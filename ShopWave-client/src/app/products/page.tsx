
"use client"; // This page uses client-side context for products

import dynamic from 'next/dynamic';
import { useProducts } from '@/contexts/ProductContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const ProductGrid = dynamic(() => import('@/components/products/ProductGrid').then(m => m.ProductGrid), {
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

const ProductFiltersBar = dynamic(() => import('@/components/products/ProductFiltersBar').then(m => m.ProductFiltersBar), {
  loading: () => <div className="w-full"><Skeleton className="h-10 w-full" /></div>,
});

const ProductSort = dynamic(() => import('@/components/products/ProductSort').then(m => m.ProductSort), {
  loading: () => <Skeleton className="h-10 w-40" />,
});

export default function AllProductsPage() {
  const { filteredProducts, isLoading, error } = useProducts();

  return (
    <div className="flex flex-col gap-6">
      <ProductFiltersBar />
      <section className="flex-1 min-w-0">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            All Products
          </h1>
          <ProductSort />
        </div>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Failed to load products</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <ProductGrid products={filteredProducts} isLoading={isLoading} />
      </section>
    </div>
  );
}
