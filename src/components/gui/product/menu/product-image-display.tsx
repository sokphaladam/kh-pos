"use client";

import { cn } from "@/lib/utils";

interface ProductImageDisplayProps {
  images: { url: string }[];
  title: string;
  className?: string;
  stockStatus?: {
    stock: number;
    isInStock: boolean;
  };
  price?: string;
}

export function ProductImageDisplay({
  images,
  title,
  className = "",
  stockStatus,
  price,
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
