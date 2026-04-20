import { createSheet } from "@/components/create-sheet";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCallback, useMemo } from "react";
import { ProductV2 } from "@/classes/product-v2";
import {
  useMutationAddBindProduct,
  useMutationRemoveBindProduct,
  useQueryModifierBindProduct,
} from "@/app/hooks/use-query-modifier";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { BasicProductType } from "@/dataloader/basic-product-loader";
import { ProductImage } from "@/repository/product-image-repository";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DiscountSearchProduct } from "../discount/discount-search-product";

export const bindProductModifier = createSheet<{ id: string }>(({ id }) => {
  const { data, isLoading, mutate, isValidating } =
    useQueryModifierBindProduct(id);
  const { trigger: triggerAdd, isMutating: isAdding } =
    useMutationAddBindProduct(id);
  const { trigger: triggerRemove, isMutating: isRemoving } =
    useMutationRemoveBindProduct(id);

  const products: ProductV2[] = useMemo(() => {
    return data
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data.result as any[]).map(
          (x: {
            product: BasicProductType;
            images: ProductImage[];
            variants: ProductVariantType[];
          }) => {
            return {
              id: x.product.id,
              title: x.product.title,
              description: x.product.description,
              productImages: x.images,
              productVariants: x.variants,
              productCategories: [],
            };
          }
        )
      : [];
  }, [data]);

  const onSelectProduct = useCallback(
    (item: ProductV2) => {
      const existingProduct = products.find((p) => p.id === item.id);

      if (existingProduct) {
        toast.error("Product is already bound to this modifier.");
      }

      if (!existingProduct) {
        triggerAdd({ productId: item.id }).then(() => {
          mutate();
        });
      }
    },
    [triggerAdd, mutate, products]
  );

  return (
    <>
      <SheetHeader>
        <SheetTitle>Applies Modifier</SheetTitle>
      </SheetHeader>
      <div className="my-4">
        <DiscountSearchProduct
          clearInput
          disabled={isLoading || isValidating || isAdding || isRemoving}
          onChange={onSelectProduct}
        />
        {products.length > 0 && (
          <div
            className={cn(
              "my-4",
              isLoading || isValidating || isAdding || isRemoving
                ? "blur-md"
                : ""
            )}
          >
            {products.map((item, idx) => {
              const image = item.productImages?.[0];
              const stock = item.productVariants.reduce(
                (a, b) => a + Number(b.stock),
                0
              );
              const prices = item.productVariants.map((v) => Number(v.price));
              const priceRange =
                prices.length > 0
                  ? `$${Math.min(...prices).toFixed(2)} - $${Math.max(
                      ...prices
                    ).toFixed(2)}`
                  : "N/A";

              return (
                <div
                  key={idx}
                  className="flex flex-row justify-between items-center gap-3 py-3 px-4 border-b border-gray-100 last:border-b-0
            hover:bg-blue-50 transition-colors duration-150 cursor-pointer"
                >
                  {image ? (
                    <div className="w-14 h-14 flex items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                      <ImageWithFallback
                        src={image.url}
                        alt={item.title || ""}
                        title={item.title || ""}
                        className="max-w-full max-h-full object-contain w-auto h-auto p-0.5"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 border border-gray-200">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="text-sm flex-1 min-w-0 flex flex-col">
                    <span className="truncate font-medium text-gray-800">
                      {item.title || ""}
                    </span>
                    <div className="flex flex-row gap-2 items-center mt-0.5">
                      <span className="text-xs text-gray-500 truncate">
                        SKU: {item.productVariants.length}
                      </span>
                      <div className="h-3 w-px bg-gray-300"></div>
                      <span className="text-xs font-semibold text-emerald-700">
                        {priceRange}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={stock > 0 ? "secondary" : "outline"}
                      className={`text-xs rounded-full h-[22px] min-w-[70px] px-3 font-medium whitespace-nowrap flex items-center justify-center ${
                        stock <= 0
                          ? "bg-red-50 text-red-600 border-red-200"
                          : stock < 5
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {stock > 0 ? `${stock} in stock` : "Out of stock"}
                    </Badge>
                    <BasicMenuAction
                      value={item}
                      onDelete={() => {
                        triggerRemove({
                          productId: item.id,
                        }).then(() => {
                          mutate();
                        });
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
});
