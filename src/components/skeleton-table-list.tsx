import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonTableList() {
  return (
    <div className="flex flex-col w-full h-[340px] min-h-[340px] max-h-[340px] overflow-hidden">
      <div className="flex flex-row justify-between items-center mb-2">
        <Skeleton className="h-6 w-40 rounded" />
        <Skeleton className="h-8 w-24 rounded" />
      </div>
      <div className="flex-1 flex flex-col justify-center overflow-x-auto">
        <div className="w-full min-w-[480px]">
          <div className="grid grid-cols-5 gap-2 border-b pb-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-5 gap-2 items-center py-2 border-b last:border-b-0"
            >
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-8 w-8 rounded-full mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
