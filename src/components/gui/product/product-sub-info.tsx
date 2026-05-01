import { ProductV2 } from "@/classes/product-v2";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

export function ProductSubInfo({
  product,
  variantId,
}: {
  product: ProductV2;
  variantId?: string;
}) {
  const { formatForDisplay } = useCurrencyFormat();
  const variant = product.productVariants.find((f) => f.id === variantId);
  return (
    <div className="flex flex-row gap-2 text-sm justify-start items-start">
      <div>
        <ImageWithFallback
          src={product.productImages[0]?.url}
          alt={product.title || "Product image"}
          width={40}
          height={40}
          className="object-contain aspect-square rounded-sm border"
        />
      </div>
      <div className="text-muted-foreground hidden md:block">
        <div>
          {product.title} ({variant?.name})
        </div>
        <div>
          {variant?.sku} ({formatForDisplay(variant?.purchasePrice || "0")})
        </div>
      </div>
    </div>
  );
}
