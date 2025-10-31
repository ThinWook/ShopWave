import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="container mx-auto py-8">
      <Skeleton className="h-8 w-32 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="shadow-md rounded-lg p-6 text-center">
            <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-40 mx-auto mb-2" />
            <Skeleton className="h-4 w-56 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto mt-4" />
            <Skeleton className="h-10 w-full mt-6" />
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="shadow-md rounded-lg p-6">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-4 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
