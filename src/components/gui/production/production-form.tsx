/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProductSearchResult } from "@/app/api/product/search-product/types";
import {
  requestCompose,
  useMutationCompose,
} from "@/app/hooks/use-query-compose";
import {
  ComposeVariantProps,
  CompositeStockSlotInput,
  CompositionDraft,
} from "@/classes/composite-variant";
import { ImageWithFallback } from "@/components/image-with-fallback";
import SearchProductPicker from "@/components/search-product-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MaterialInput } from "@/components/ui/material-input";
import { cn } from "@/lib/utils";
import { useAuthentication } from "contexts/authentication-context";
import { produce } from "immer";
import { LoaderCircle, Package } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ProductSlotCombobox } from "../product/product-slot-combobox";

interface PropsInput {
  composedVariant: any;
  componentVariants: {
    id: string;
    variant: CompositionDraft;
    stockSlots: CompositeStockSlotInput[];
  }[];
}

interface Props {
  onSaved?: () => void;
}

export function ProductionForm(props: Props) {
  const { currentWarehouse, currency } = useAuthentication();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState<PropsInput>({
    componentVariants: [],
    composedVariant: {
      variantId: "",
      productLot: {},
      qty: 0,
      slotId: "",
    },
  });

  const { trigger, isMutating } = useMutationCompose();

  const onGenerateComposition = useCallback(
    async (qty: number, variantId?: string) => {
      if (value.composedVariant.variantId || variantId) {
        setLoading(true);
        const res = await requestCompose(
          variantId ?? value.composedVariant.variantId,
          qty
        );
        if (res.success) {
          setValue(
            produce((draft) => {
              draft.componentVariants = (res.result ?? []).map((x) => {
                return {
                  id: x.id || "",
                  variant: x,
                  stockSlots: x.stockSlots.map((s) => ({
                    slotId: s.slot?.id || "",
                    qty: s.qty,
                  })),
                };
              });
            })
          );
        } else {
          toast.error(res.error);
        }
        setLoading(false);
      }
    },
    [value]
  );

  // Helper function to calculate total quantity from stockSlots
  const getTotalQuantity = (stockSlots: CompositeStockSlotInput[]) => {
    return stockSlots.reduce((total, slot) => total + slot.qty, 0);
  };

  const getSuggestedQty = () => {
    return Math.min(
      ...value.componentVariants.map((item) => {
        const itemQty = getTotalQuantity(item.stockSlots);
        return Math.floor(
          item.variant.availableStock / (itemQty / value.composedVariant.qty)
        );
      })
    );
  };

  const onSave = useCallback(() => {
    const input: ComposeVariantProps = {
      composedVariant: {
        variantId: value.composedVariant.variantId,
        productLot: value.composedVariant.productLot,
        qty: value.composedVariant.qty,
        slotId: value.composedVariant.slotId,
      },
      componentVariants: value.componentVariants.map((x) => ({
        id: x.id,
        stockSlots: x.variant.stockSlots.map((s) => ({
          slotId: s.slot?.id || "",
          qty: s.qty,
        })),
      })),
    };

    trigger(input)
      .then((res) => {
        if (res.success) {
          toast.success("Composition saved successfully");
          props.onSaved?.();
        } else {
          toast.error(res.error || "Failed to save composition");
        }
      })
      .catch((err) => {
        toast.error(err.message || "Failed to save composition");
      });
  }, [props, trigger, value]);

  const onSelectProduct = useCallback(
    (v: ProductSearchResult) => {
      setValue(
        produce((draft) => {
          draft.composedVariant.variantId = v.variantId;
          draft.composedVariant.productLot = {
            costPerUnit: Number(v.price),
          };
        })
      );
      if (Number(value.composedVariant.qty) > 0) {
        onGenerateComposition(value.composedVariant.qty, v.variantId);
      }
    },
    [value.composedVariant.qty, onGenerateComposition]
  );

  const handleBlur = useCallback(() => {
    if (Number(value.composedVariant.qty) > 0) {
      onGenerateComposition(value.composedVariant.qty);
    }
  }, [onGenerateComposition, value.composedVariant.qty]);

  return (
    <div className="grid md:grid-cols-1 gap-6">
      <Card className="p-6">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Add Products
        </CardTitle>
        <CardContent className="py-4 px-0">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="col-span-2">
              <SearchProductPicker
                value={value.composedVariant.variantId}
                onChange={onSelectProduct}
                compositeOnly
                warehouse={currentWarehouse?.id}
              />
            </div>
            <div className="w-full">
              <Label className="text-gray-500 dark:text-gray-400 text-xs font-light">
                Slot
              </Label>
              <ProductSlotCombobox
                data={[]}
                slotSelected={value.composedVariant.slotId}
                all
                fullWidth
                onSlotSelected={(v) => {
                  setValue(
                    produce((draft) => {
                      draft.composedVariant.slotId = v;
                    })
                  );
                }}
              />
            </div>
            <div className="w-full mt-[1.40rem]">
              <MaterialInput
                label="Quantity"
                id="quantity"
                type="number"
                value={value.composedVariant.qty}
                onBlur={handleBlur}
                onChange={(e) => {
                  const qty = parseInt(e.target.value, 0);
                  setValue(
                    produce((draft) => {
                      draft.composedVariant.qty = isNaN(qty) ? 1 : qty;
                    })
                  );
                }}
                className="text-center w-full"
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    handleBlur();
                  }
                }}
                min="1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Composition Summary</span>
            <Badge variant="secondary">
              {value.componentVariants.length} items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <>
              <div className="text-center py-8 text-muted-foreground">
                <LoaderCircle className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
                <p>Processing</p>
              </div>
            </>
          ) : (
            <>
              {value.componentVariants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No products added yet</p>
                  <p className="text-sm">Start by selecting a product above</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                    {value.componentVariants.map((x, index) => {
                      const image = x.variant.basicProduct?.images.find(
                        (f) => f.productVariantId === x.id
                      );
                      const xQty = getTotalQuantity(x.stockSlots);
                      const isStockSufficient =
                        x.variant.availableStock >= xQty;
                      const unitRequired = Math.ceil(
                        xQty / value.composedVariant.qty
                      );
                      return (
                        <div
                          key={x.id}
                          className={cn(
                            "relative overflow-hidden rounded-lg border bg-card transition-all duration-200 hover:shadow-sm",
                            isStockSufficient
                              ? "border-border"
                              : "border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/10"
                          )}
                        >
                          {/* Header with item number and status indicator */}
                          <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">
                                #{index + 1}
                              </span>
                              <Badge
                                variant={
                                  isStockSufficient
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="text-xs px-2 py-0"
                              >
                                {isStockSufficient ? "Available" : "Low Stock"}
                              </Badge>
                            </div>
                          </div>

                          {/* Main content */}
                          <div className="px-3 pb-2">
                            <div className="flex gap-3">
                              {/* Product image */}
                              <div className="flex-shrink-0">
                                <ImageWithFallback
                                  alt={`${x.variant.basicProduct?.title} image`}
                                  className="w-12 h-12 border border-dashed rounded-md object-cover bg-muted"
                                  height={48}
                                  src={image?.url || ""}
                                  width={48}
                                  title={(x.variant.basicProduct?.title || "")
                                    .split(" ")
                                    .map((word) => word.charAt(0).toUpperCase())
                                    .join("")}
                                />
                              </div>

                              {/* Product details */}
                              <div className="flex-1 min-w-0">
                                <div className="space-y-1">
                                  <h4 className="font-medium text-sm leading-snug truncate">
                                    {x.variant.basicProduct?.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {x.variant.name}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="font-medium">
                                      {currency}
                                      {x.variant.price}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      SKU: {x.variant.sku || "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Quantity info */}
                              <div className="flex-shrink-0 text-right">
                                <div className="text-sm font-medium">
                                  {getTotalQuantity(x.stockSlots)} needed
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {unitRequired} × {value.composedVariant.qty}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {x.variant.availableStock} available
                                </div>
                              </div>
                            </div>

                            {/* Pickup slots */}
                            {x.variant.stockSlots &&
                              x.variant.stockSlots.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-dashed border-muted">
                                  <div className="flex flex-wrap gap-1">
                                    {x.variant.stockSlots.map((slot, index) => (
                                      <div
                                        key={slot.slot?.id ?? index}
                                        className={cn(
                                          "inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted",
                                          slot.slot ? "" : "italic"
                                        )}
                                      >
                                        <span>
                                          {slot.slot?.name ?? slot.message}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs px-1 py-0 h-4"
                                        >
                                          {slot.qty}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <br />
              <div className="border-t py-4 space-y-2 bg-muted px-2 rounded">
                <div className="flex justify-between items-center text-sm">
                  <span>Production Quantity:</span>
                  <span
                    className={cn(
                      "font-medium",
                      getSuggestedQty() < value.composedVariant.qty
                        ? "text-red-600"
                        : ""
                    )}
                  >
                    {value.composedVariant.qty} Quantity
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Max Compositions Possible:</span>
                  <span className="font-medium text-blue-600">
                    {getSuggestedQty()} Quantity
                  </span>
                </div>
                {getSuggestedQty() < value.composedVariant.qty && (
                  <div className="text-red-600 text-xs mt-1">
                    ⚠️ Exceeds available stock
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-row justify-end">
        <Button
          onClick={onSave}
          disabled={
            isMutating ||
            !value.composedVariant.variantId ||
            value.composedVariant.qty <= 0 ||
            loading ||
            !value.composedVariant.slotId ||
            value.componentVariants.length === 0 ||
            getSuggestedQty() < value.composedVariant.qty
          }
        >
          Produce
        </Button>
      </div>
    </div>
  );
}
