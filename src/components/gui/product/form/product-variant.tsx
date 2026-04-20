import {
  ProductOption,
  type ProductVariant,
} from "@/app/api/product/[id]/option/types";
import { Button } from "@/components/ui/button";
import { MaterialInput } from "@/components/ui/material-input";
import { produce } from "immer";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { v4 } from "uuid";
import { useProductForm } from "../context/product-form-context";
import { createDialogProductVariant } from "./dialog-create-product-variant";
import { ProductVariantList } from "./product-variant-list";

export function ProductVariant() {
  const { product, setProduct, isMovie } = useProductForm();
  const [allPrice, setAllPrice] = useState<string>("");

  const onClickOptions = useCallback(async () => {
    const res = await createDialogProductVariant.show({
      edit: product.productOption || [],
      id: product.productId || "",
    });
    if (res) {
      setProduct(
        produce(product, (draft) => {
          const options: ProductOption[] = res.option.map((option) => {
            return {
              id: option.id ? option.id : v4(),
              name: option.name,
              values: option.values,
            };
          });

          const variants: ProductVariant[] = res.generate.map((x) => {
            const find = product.productVariants.find(
              (f) =>
                x.name
                  .split("/")
                  .map((n) => n.trim())
                  .join("") ===
                  f.name
                    .split("/")
                    .map((n) => n.trim())
                    .join("") ||
                x.name
                  .split("/")
                  .map((n) => n.trim())
                  .join("") ===
                  f.name
                    .split("/")
                    .map((n) => n.trim())
                    .reverse()
                    .join("")
            );
            return {
              ...x,
              sku: "",
              id: find?.id ? find.id : v4(),
              price: find?.price ? find.price : 0,
              barcode: find?.barcode ? find.barcode : "",
              purchasedCost: find?.purchasedCost ?? 0,
              isDefault: find?.isDefault ?? x.isDefault,
            };
          });

          draft.productOption = options;
          draft.productVariants = variants.map((variant) => ({
            isComposite: false,
            compositeVariants: [],
            ...variant,
          }));
        })
      );
    }
  }, [product, setProduct]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
        <div className="flex-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onClickOptions}
            disabled={isMovie}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Configure Options
          </Button>
          {isMovie && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Movie products can only have one variant.
                Multiple variants are not allowed for cinema category.
              </p>
            </div>
          )}
          {(product.productOption.length || 0) > 0 && !isMovie && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Options:</strong>{" "}
                {product.productOption.map((x) => x.name).join(" • ")}
              </p>
            </div>
          )}
        </div>

        {product.productVariants.length > 0 && (
          <div className="flex-1 max-w-xs">
            <MaterialInput
              label="Set price for all variants"
              type="number"
              className="h-10"
              value={allPrice}
              onChange={(e) => {
                setAllPrice(e.target.value);
                setProduct(
                  produce(product, (draft) => {
                    draft.productVariants =
                      product.productVariants.map((x) => {
                        return {
                          ...x,
                          price: Number(e.target.value),
                        };
                      }) || [];
                  })
                );
              }}
              step={0.1}
              min={0}
              placeholder="0.00"
            />
          </div>
        )}
      </div>

      {/* Variants List */}
      {product.productVariants.length > 0 ? (
        <div className="border border-border/50 rounded-lg overflow-hidden">
          <ProductVariantList />
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border/50 rounded-lg">
          <div className="mb-3">📦</div>
          <p className="font-medium mb-1">No variants configured</p>
          <p className="text-sm">
            Click &quot;Configure Options&quot; to set up product variants
          </p>
        </div>
      )}
    </div>
  );
}
