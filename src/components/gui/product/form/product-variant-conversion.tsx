import React, { useMemo } from "react";
import { produce } from "immer";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaterialInput } from "@/components/ui/material-input";
import { useProductForm } from "../context/product-form-context";

export function ProductVariantConversion() {
  const { product, setProduct } = useProductForm();

  const availableVariants = useMemo(() => {
    return product.productVariants.filter(
      (v) => v.name && v.name.trim() !== ""
    );
  }, [product.productVariants]);

  const conversions = useMemo(() => {
    return product.productConversions || [];
  }, [product.productConversions]);

  // Get existing conversion pairs to prevent duplicates (including both directions)
  const existingPairs = useMemo(() => {
    const pairs = new Set<string>();
    conversions.forEach((conversion) => {
      if (conversion.fromVariantId && conversion.toVariantId) {
        // Add both directions to prevent bidirectional conversions
        pairs.add(`${conversion.fromVariantId}-${conversion.toVariantId}`);
        pairs.add(`${conversion.toVariantId}-${conversion.fromVariantId}`);
      }
    });
    return pairs;
  }, [conversions]);

  // Check if there are any more possible conversions to add
  const availableConversions = useMemo(() => {
    const total = availableVariants.length * (availableVariants.length - 1);
    // Since we block both directions, each conversion blocks 2 pairs
    return total - existingPairs.size;
  }, [availableVariants.length, existingPairs.size]);

  const addConversion = () => {
    setProduct(
      produce(product, (draft) => {
        if (!draft.productConversions) {
          draft.productConversions = [];
        }
        draft.productConversions.push({
          fromVariantId: "",
          toVariantId: "",
          productId: draft.productId || "",
          conversionRate: 2,
        });
      })
    );
  };

  const removeConversion = (index: number) => {
    setProduct(
      produce(product, (draft) => {
        draft.productConversions?.splice(index, 1);
      })
    );
  };

  const updateConversion = (
    index: number,
    field: keyof (typeof conversions)[0],
    value: string | number
  ) => {
    setProduct(
      produce(product, (draft) => {
        if (draft.productConversions && draft.productConversions[index]) {
          (draft.productConversions[index] as Record<string, string | number>)[
            field
          ] = value;
        }
      })
    );
  };

  // Filter available variants to prevent duplicates
  const getAvailableFromVariants = (currentIndex: number) => {
    return availableVariants.filter((variant) => {
      const currentConversion = conversions[currentIndex];
      return (
        availableVariants.filter((toVariant) => {
          if (toVariant.id === variant.id) return false;
          const pairKey = `${variant.id}-${toVariant.id}`;
          // Allow current conversion or non-existing pairs
          return (
            !existingPairs.has(pairKey) ||
            (variant.id === currentConversion?.fromVariantId &&
              toVariant.id === currentConversion?.toVariantId)
          );
        }).length > 0
      );
    });
  };

  const getAvailableToVariants = (currentIndex: number) => {
    const currentConversion = conversions[currentIndex];
    if (!currentConversion?.fromVariantId) return [];

    return availableVariants.filter((variant) => {
      if (variant.id === currentConversion.fromVariantId) return false;
      const pairKey = `${currentConversion.fromVariantId}-${variant.id}`;
      // Allow current conversion or non-existing pairs
      return (
        !existingPairs.has(pairKey) ||
        variant.id === currentConversion.toVariantId
      );
    });
  };

  // Don't show anything if there are less than 2 variants
  if (availableVariants.length < 2) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* No Conversions State */}
      {conversions.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          <div className="mb-2">🔄</div>
          <p className="font-medium mb-1">No conversions configured</p>
          <p className="text-xs mb-3">
            Set up automatic conversion between variant units when stock runs
            low.
          </p>
          {availableConversions > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addConversion}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Conversion
            </Button>
          )}
        </div>
      ) : (
        /* Conversions List */
        <div className="space-y-2">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-800 dark:text-blue-200">
            💡 When a variant is out of stock, the system will automatically
            break larger units into smaller ones.
          </div>

          {conversions.map((conversion, index) => {
            const fromVariant = availableVariants.find(
              (v) => v.id === conversion.fromVariantId
            );
            const toVariant = availableVariants.find(
              (v) => v.id === conversion.toVariantId
            );
            const isComplete =
              fromVariant && toVariant && conversion.conversionRate >= 2;

            return (
              <div
                key={index}
                className={`relative p-3 border rounded transition-all duration-200 ${
                  isComplete
                    ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                    : "bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                }`}
              >
                {/* Compact Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {/* From Variant */}
                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      From
                    </label>
                    <Select
                      value={conversion.fromVariantId}
                      onValueChange={(value) =>
                        updateConversion(index, "fromVariantId", value)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select variant" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableFromVariants(index).map((variant) => (
                          <SelectItem key={variant.id} value={variant.id || ""}>
                            {variant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conversion Rate */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Rate
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">1 =</span>
                      <MaterialInput
                        type="number"
                        min={2}
                        value={conversion.conversionRate}
                        onChange={(e) =>
                          updateConversion(
                            index,
                            "conversionRate",
                            Number(e.target.value)
                          )
                        }
                        className="h-8 w-16 text-xs text-center"
                        placeholder="2"
                      />
                    </div>
                  </div>

                  {/* To Variant */}
                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      To
                    </label>
                    <Select
                      value={conversion.toVariantId}
                      onValueChange={(value) =>
                        updateConversion(index, "toVariantId", value)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select variant" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableToVariants(index).map((variant) => (
                          <SelectItem key={variant.id} value={variant.id || ""}>
                            {variant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Delete Button */}
                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeConversion(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="absolute top-2 right-2">
                  {isComplete ? (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  ) : (
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Compact Add More Button */}
          {availableConversions > 0 && (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addConversion}
                className="h-8 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Another
              </Button>
            </div>
          )}

          {/* Compact No More Conversions Available */}
          {availableConversions === 0 && (
            <div className="text-center py-2 px-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
              <p className="text-xs text-blue-800 dark:text-blue-200 font-medium">
                ✅ All conversions configured
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
