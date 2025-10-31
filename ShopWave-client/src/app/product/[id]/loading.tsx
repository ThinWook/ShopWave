import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto py-8">
      <Skeleton className="h-10 w-40 mb-6" />
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="bg-card p-4 sm:p-6 rounded-lg shadow-lg">
          <Skeleton className="w-full aspect-square rounded-md" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3 mb-4" />
          <div className="py-4 border-t border-b space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 flex-1" />
          </div>
        </div>
      </div>
      <div className="mt-8">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
      <div className="mt-8">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
