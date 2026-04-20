import { Skeleton } from "@/components/ui/skeleton";

// Loading skeleton components
export const HeaderSkeleton = () => (
  <div className="mb-8">
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-10 w-80 mb-2" />
        <Skeleton className="h-6 w-96" />
      </div>
      <div className="text-right">
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="h-6 w-40" />
      </div>
    </div>
  </div>
);

export const SummaryCardsSkeleton = () => (
  <div className="space-y-6 mb-8">
    {/* Overview Stats Skeleton */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <Skeleton className="h-5 w-5 mr-2" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-8 w-24 mb-1" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </div>

    {/* Status Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-6 w-20 mb-2" />
          <Skeleton className="h-10 w-16 mb-2" />
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-4 w-28 mb-3" />
          <Skeleton className="h-3 w-32 mb-4" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

export const FiltersSkeleton = () => (
  <div className="mb-8">
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <Skeleton className="h-5 w-5 mr-2" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </div>
  </div>
);

export const ProductTableSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Skeleton className="h-5 w-5 mr-2" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>
    </div>

    <div className="p-6">
      <div className="space-y-4">
        {/* Table Header */}
        <div className="flex items-center space-x-4 pb-2 border-b">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Table Rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center space-x-4 py-3">
            <Skeleton className="h-4 w-8" />
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
