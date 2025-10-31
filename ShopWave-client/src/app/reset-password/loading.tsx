import { Skeleton } from "@/components/ui/skeleton";

export default function ResetPasswordLoading() {
  return (
    <div className="max-w-md mx-auto w-full py-12">
      <Skeleton className="h-8 w-64 mx-auto mb-6" />
      <div className="shadow-md rounded-lg p-6">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
