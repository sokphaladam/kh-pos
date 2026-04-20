export function ProductMenuFallback() {
  return (
    <div className="w-full flex flex-col gap-4 relative">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="relative max-w-md mx-auto">
          <div className="h-10 bg-gray-200 animate-pulse rounded-lg" />
        </div>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="overflow-hidden border-0 shadow-sm bg-white rounded-xl h-full"
          >
            <div className="aspect-[5/5] w-full bg-gray-200 animate-pulse rounded-t-xl" />
            <div className="p-2 flex justify-center">
              <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
