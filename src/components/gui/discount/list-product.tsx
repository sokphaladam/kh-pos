import { ProductV2 } from "@/classes/product-v2";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { DiscountSearchProduct } from "./discount-search-product";

export function DiscountProductList({
  productApplied,
  onAddProduct,
  onRemoveProduct,
}: {
  discountId: string;
  productApplied: ProductV2[];
  onAddProduct: (product: ProductV2) => void;
  onRemoveProduct?: (productId: string) => void;
  loading?: boolean;
}) {
  return (
    <div className="space-y-4 h-full">
      <DiscountSearchProduct
        clearInput
        onChange={(v) => {
          onAddProduct(v);
        }}
      />

      {/* Applied Products List */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">
          Applied Products ({productApplied.length})
        </h3>
        <div className="max-h-[70vh] overflow-y-auto space-y-2">
          {productApplied.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No products applied to this discount</p>
              <p className="text-xs text-gray-400 mt-1">
                Search and select products above to add them
              </p>
            </div>
          ) : (
            productApplied.map((product, index) => (
              <Card key={index} className="p-3">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    {/* Product Image */}
                    <div className="flex-shrink-0 h-14 w-14">
                      <ImageWithFallback
                        src={product.productImages?.[0]?.url}
                        alt={product.title || "Product image"}
                        height={56}
                        width={56}
                        className="rounded-md max-w-full max-h-full object-contain w-auto h-auto p-0.5"
                      />
                    </div>

                    {/* Product Information */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {product.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {product.productCategories?.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            {product.productCategories[0].title}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    {onRemoveProduct && (
                      <div className="flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveProduct(product.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
