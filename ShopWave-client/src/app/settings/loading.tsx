import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="container mx-auto py-8">
      <Skeleton className="h-8 w-48 mb-8" />
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="shadow-md rounded-lg p-6">
            <Skeleton className="h-6 w-56 mb-2" />
            <Skeleton className="h-4 w-80 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
