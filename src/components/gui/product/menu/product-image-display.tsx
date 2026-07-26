"use client";

import { cn } from "@/lib/utils";

interface ProductBadges {
  topSale?: boolean;
  isNew?: boolean;
  mostOrder?: boolean;
}

interface ProductImageDisplayProps {
  images: { url: string }[];
  title: string;
  className?: string;
  stockStatus?: {
    stock: number;
    isInStock: boolean;
  };
  price?: string;
  badges?: ProductBadges;
}

function ProductBadgeList({ badges }: { badges?: ProductBadges }) {
  if (!badges || (!badges.topSale && !badges.isNew && !badges.mostOrder)) {
    return null;
  }
  return (
    <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
      {badges.topSale && (
        <span className="text-[10px] sm:text-xs font-semibold text-white bg-amber-500/90 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
          Top Sale
        </span>
      )}
      {badges.isNew && (
        <span className="text-[10px] sm:text-xs font-semibold text-white bg-emerald-500/90 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
          New
        </span>
      )}
      {badges.mostOrder && (
        <span className="text-[10px] sm:text-xs font-semibold text-white bg-blue-500/90 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
          Most Order
        </span>
      )}
    </div>
  );
}

export function ProductImageDisplay({
  images,
  title,
  className = "",
  stockStatus,
  price,
  badges,
}: ProductImageDisplayProps) {
  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div
          className={cn(
            "bg-gray-100 flex items-center justify-center rounded-t-xl aspect-[5/5] w-full relative",
            className
          )}
        >
          <span className="text-gray-400 text-xs sm:text-sm">No Image</span>
          <ProductBadgeList badges={badges} />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            {price !== undefined && (
              <span className="text-xs sm:text-sm font-semibold text-white bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">
                {price}
              </span>
            )}
            {stockStatus && (
              <div
                className={cn(
                  "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-white shadow-sm",
                  stockStatus.isInStock ? "bg-green-500" : "bg-red-500"
                )}
              />
            )}
          </div>
        </div>
        <div className="flex-1 p-1.5 sm:p-2 flex flex-col justify-center">
          <h3 className="text-xs sm:text-sm font-medium text-gray-800 leading-tight line-clamp-2 text-center">
            {title}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className={cn(
          "relative overflow-hidden group aspect-[5/5] w-full rounded-t-xl",
          className
        )}
      >
        {images[0].url ? (
          <div className="w-full h-full p-1.5 sm:p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0].url}
              alt={title}
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs sm:text-sm">
            No Image
          </div>
        )}

        <ProductBadgeList badges={badges} />

        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          {price !== undefined && (
            <span className="text-xs sm:text-sm font-semibold text-white bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">
              {price}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 p-1.5 sm:p-2 flex flex-col justify-center">
        <h3 className="text-xs sm:text-sm font-medium text-gray-800 leading-tight line-clamp-2 text-center">
          {title}
        </h3>
      </div>
    </div>
  );
}
