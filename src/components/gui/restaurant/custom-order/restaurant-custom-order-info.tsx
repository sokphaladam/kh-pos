import { ImageWithFallback } from "@/components/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { ShoppingCart } from "lucide-react";
import { useMemo } from "react";
import { SelectProductItem } from "./restaurant-custom-order";

export function RestaurantCustomOrderInfo({
  product,
}: {
  product: SelectProductItem;
}) {
  const { formatForDisplay } = useCurrencyFormat();
  // Find the product variant image
  const productImage = useMemo(() => {
    return (
      product.basicProduct?.images?.find(
        (img) => img.productVariantId === product.id
      ) || product.basicProduct?.images?.[0]
    );
  }, [product.basicProduct?.images, product.id]);

  // Calculate total price including modifiers
  const totalPrice = useMemo(() => {
    const basePrice = product?.price || 0;
    const modifierPrice =
      product.selectedModifiers?.reduce((total, modifierId) => {
        const modifier = product.basicProduct?.modifiers
          ?.flatMap((m) => m.items)
          .find((f) => f?.id === modifierId);
        return total + (modifier?.price ? Number(modifier.price) : 0);
      }, 0) || 0;

    return (basePrice + modifierPrice) * product.quantity;
  }, [
    product?.price,
    product.selectedModifiers,
    product.basicProduct?.modifiers,
    product.quantity,
  ]);

  return (
    <Card className="border-border bg-gradient-to-r from-background to-muted/20">
      <CardHeader className="pb-3">
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          <div className="flex items-start gap-3 mb-3">
            {/* Product Image */}
            <div className="flex-shrink-0">
              <ImageWithFallback
                src={productImage?.url}
                alt={product.basicProduct?.title || "Product"}
                title={
                  product.basicProduct?.title?.charAt(0).toUpperCase() || "P"
                }
                width={60}
                height={60}
                className="rounded-lg border-2 border-muted shadow-sm"
                fallbackClassName="rounded-lg border-2 border-muted text-xs"
              />
            </div>

            {/* Product Title */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground leading-tight mb-1">
                {product.basicProduct?.title}
              </h3>
              {product?.name &&
                product?.name !== product.basicProduct?.title && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                    {product?.name}
                  </p>
                )}
            </div>
          </div>

          {/* Mobile Price Row */}
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Qty:</span>
              <span className="font-medium">{product.quantity}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">@</span>
              <span className="font-medium">
                {formatForDisplay(product.price || 0)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total:</span>
              <span className="text-lg font-bold text-primary">
                {formatForDisplay(totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:block">
          <div className="flex items-start gap-4">
            {/* Product Image */}
            <div className="flex-shrink-0">
              <ImageWithFallback
                src={productImage?.url}
                alt={product.basicProduct?.title || "Product"}
                title={
                  product.basicProduct?.title?.charAt(0).toUpperCase() || "P"
                }
                width={80}
                height={80}
                className="rounded-lg border-2 border-muted shadow-sm"
                fallbackClassName="rounded-lg border-2 border-muted text-xs"
              />
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0 h-20 flex flex-col justify-between">
              {/* Product Title & Variant */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground leading-tight mb-1">
                  {product.basicProduct?.title}
                </h3>
                {product?.name &&
                  product?.name !== product.basicProduct?.title && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product?.name}
                    </p>
                  )}
              </div>

              {/* Desktop Price Row */}
              <div className="flex items-center justify-between gap-4 mt-auto">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Qty:</span>
                    <span className="font-medium">{product.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Unit Price:
                    </span>
                    <span className="font-medium">
                      {formatForDisplay(product.price || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-xl font-bold text-primary">
                    {formatForDisplay(totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Additional Info Section */}
      {(product.selectedModifiers?.length > 0 ||
        product.basicProduct?.description) && (
        <CardContent className="pt-0">
          {product.basicProduct?.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {product.basicProduct.description}
            </p>
          )}

          {product.selectedModifiers?.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">
                Selected Add-ons:
              </p>
              <div className="flex flex-wrap gap-1">
                {product.selectedModifiers.map((modifierId) => {
                  const modifier = product.basicProduct?.modifiers
                    ?.flatMap((m) => m.items)
                    .find((f) => f?.id === modifierId);
                  if (!modifier) return null;

                  return (
                    <Badge
                      key={modifierId}
                      variant="secondary"
                      className="text-xs px-1.5 py-0.5"
                    >
                      {modifier.name}
                      {modifier.price && modifier.price > 0 && (
                        <span className="ml-1 text-primary">
                          +{formatForDisplay(modifier.price)}
                        </span>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
