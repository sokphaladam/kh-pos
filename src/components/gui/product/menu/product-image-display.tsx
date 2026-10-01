"use client";

import { cn } from "@/lib/utils";
import { VariantBadge } from "@/lib/variant-badges";
import { ProductCardBadges } from "@/components/product-card-badges";

interface ProductImageDisplayProps {
  images: { url: string }[];
  title: string;
  className?: string;
  stockStatus?: {
    stock: number;
    isInStock: boolean;
  };
  price?: string;
  /** Pre-discount price, struck through when it differs from `price`. */
  originalPrice?: string;
  /** Short badge text, e.g. "-10%". */
  discountLabel?: string;
  /** Admin-set menu badges (popular / new / most-order). */
  badges?: VariantBadge[];
}

function PriceTag({
  price,
  originalPrice,
}: {
  price?: string;
  originalPrice?: string;
}) {
  if (price === undefined) return null;
  const discounted = originalPrice !== undefined && originalPrice !== price;
  return (
    <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-white bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">
      {discounted && (
        <span className="line-through opacity-70 font-normal">
          {originalPrice}
        </span>
      )}
      <span className={cn(discounted && "text-success/80")}>{price}</span>
    </span>
  );
}

export function ProductImageDisplay({
  images,
  title,
  className = "",
  stockStatus,
  price,
  originalPrice,
  discountLabel,
  badges,
}: ProductImageDisplayProps) {
  const discounted = originalPrice !== undefined && originalPrice !== price;

  const overlay = (
    <>
      <ProductCardBadges
        discountLabel={discounted ? discountLabel : undefined}
        badges={badges}
      />
      <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:bottom-4 sm:left-4 sm:right-4 flex items-center justify-between">
        <PriceTag price={price} originalPrice={originalPrice} />
        {stockStatus && (
          <div
            className={cn(
              "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-card shadow-sm",
              stockStatus.isInStock ? "bg-success" : "bg-destructive"
            )}
          />
        )}
      </div>
    </>
  );

  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div
          className={cn(
            "bg-muted flex items-center justify-center rounded-t-xl aspect-[5/5] w-full relative",
            className
          )}
        >
          <span className="text-muted-foreground/70 text-xs sm:text-sm">No Image</span>
          {overlay}
        </div>
        <div className="flex-1 p-1.5 sm:p-2 flex flex-col justify-center">
          <h3 className="text-xs sm:text-sm font-medium text-foreground leading-tight line-clamp-2 text-center">
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
          <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground/70 text-xs sm:text-sm">
            No Image
          </div>
        )}

        {overlay}
      </div>

      <div className="flex-1 p-1.5 sm:p-2 flex flex-col justify-center">
        <h3 className="text-xs sm:text-sm font-medium text-foreground leading-tight line-clamp-2 text-center">
          {title}
        </h3>
      </div>
    </div>
  );
}
