import { Skeleton } from "@/components/ui/skeleton";
import { ProductCardSkeleton } from "@/components/products/ProductCard";

export default function RootLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Hero/Banner */}
      <div className="w-full overflow-hidden rounded-xl">
        <Skeleton className="h-52 sm:h-64 md:h-80 w-full" />
      </div>

      {/* Filters bar skeleton */}
      <div className="w-full border rounded-lg p-3 md:p-4 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-64 rounded-full" />
          <Skeleton className="h-3 w-20" />
          <div className="ml-auto">
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>

      <section className="w-full">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
        <div className="mt-12">
          <Skeleton className="h-8 w-56 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
