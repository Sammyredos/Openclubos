import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface WizardSkeletonProps {
  steps?: number;
  className?: string;
}

export function WizardSkeleton({ steps = 8, className }: WizardSkeletonProps) {
  return (
    <div className={cn("p-6 space-y-6 bg-white rounded-2xl", className)}>
      {/* Header Skeleton */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 bg-gray-100" />
          <Skeleton className="h-4 w-64 bg-gray-50" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full bg-gray-100" />
      </div>

      {/* Progress Steps Skeleton */}
      <div className="flex gap-2 justify-between py-2">
        {[...Array(steps)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-1">
            <Skeleton className="h-8 w-8 rounded-full bg-gray-100" />
            <Skeleton className="h-2 w-12 bg-gray-50" />
          </div>
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="space-y-6 py-6 border-t border-gray-50 mt-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-gray-100" />
          <Skeleton className="h-12 w-full rounded-xl bg-gray-50" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 bg-gray-100" />
            <Skeleton className="h-12 w-full rounded-xl bg-gray-50" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 bg-gray-100" />
            <Skeleton className="h-12 w-full rounded-xl bg-gray-50" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-gray-100" />
          <Skeleton className="h-32 w-full rounded-xl bg-gray-50" />
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="flex justify-between pt-6 border-t border-gray-100 mt-auto">
        <Skeleton className="h-11 w-24 rounded-xl bg-gray-100" />
        <div className="flex gap-3">
          <Skeleton className="h-11 w-24 rounded-xl bg-gray-100" />
          <Skeleton className="h-11 w-32 rounded-xl bg-emerald-100" />
        </div>
      </div>
    </div>
  );
}
