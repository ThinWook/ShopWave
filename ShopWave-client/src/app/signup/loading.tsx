import { Skeleton } from "@/components/ui/skeleton";

export default function SignUpLoading() {
  return (
    <div className="max-w-md mx-auto w-full py-12">
      <Skeleton className="h-8 w-48 mx-auto mb-6" />
      <div className="shadow-md rounded-lg p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full mb-4" />
        ))}
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
