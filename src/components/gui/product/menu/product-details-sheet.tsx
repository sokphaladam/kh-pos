"use client";
import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { createSheet } from "@/components/create-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { cn } from "@/lib/utils";
import { Hash, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useCart } from "./context/cart-provider";
import { useCartActions } from "./context/use-cart-action";
import { ProductImageDisplay } from "./product-image-display";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

// Props passed to the sheet when calling .show()
interface ProductDetailsSheetInput {
  product: ProductSearchResult;
}

// Full props including the close function provided by createSheet
interface ProductDetailsSheetProps extends ProductDetailsSheetInput {
  close: (value: boolean | null) => void;
}

export function ProductDetailsSheet({
  product,
  close,
}: ProductDetailsSheetProps) {
  const { state, isRequest } = useCart();
  const { selectProduct } = useCartActions();
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, string[]>
  >({});
  const { formatForDisplay } = useCurrencyFormat();
  // Get product variant details
  const variant = useMemo(() => {
    return (product.variants as ProductVariantType[])?.find(
      (f) => f.id === product.variantId
    );
  }, [product]);

  const imageByVariant = useMemo(() => {
    return product.images?.find(
      (f) => f.productVariantId === product.variantId
    );
  }, [product]);

  const images = useMemo(() => {
    return imageByVariant
      ? [imageByVariant]
      : [
          {
            productVariantId: product.variantId,
            url: "",
          },
        ];
  }, [imageByVariant, product.variantId]);

  const stock = variant?.stock || product.stock || 0;
  const price = variant?.price || product.price || 0;

  const availableModifiers = useMemo(() => {
    if (!product.modifiers || product.modifiers.length === 0) {
      return [];
    }

    return product.modifiers.map((modifier) => ({
      id: modifier.modifierId,
      name: modifier.title,
      description: modifier.description,
      required: false, // You might want to add a required field to your modifier schema
      options:
        modifier.items?.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price || 0,
        })) || [],
    }));
  }, [product.modifiers]);

  // Calculate total price including modifiers
  const totalPrice = useMemo(() => {
    let total = price;

    availableModifiers.forEach((modifier) => {
      const selectedOptions = selectedModifiers[modifier.id] || [];
      selectedOptions.forEach((selectedOptionId) => {
        const option = modifier.options?.find(
          (opt) => opt.id === selectedOptionId
        );
        if (option) {
          total += option.price;
        }
      });
    });

    return total * quantity;
  }, [price, quantity, selectedModifiers, availableModifiers]);

  const handleQuantityChange = useCallback(
    (newQuantity: number) => {
      if (newQuantity < 1) return;
      if (stock && newQuantity > stock) return;
      setQuantity(newQuantity);
    },
    [stock]
  );

  const handleModifierChange = useCallback(
    (modifierId: string, optionId: string, checked: boolean) => {
      setSelectedModifiers((prev) => {
        const updated = { ...prev };
        const currentSelections = updated[modifierId] || [];

        if (checked) {
          // Add the option if it's not already selected
          if (!currentSelections.includes(optionId)) {
            updated[modifierId] = [...currentSelections, optionId];
          }
        } else {
          // Remove the option
          const filteredSelections = currentSelections.filter(
            (id) => id !== optionId
          );
          if (filteredSelections.length === 0) {
            delete updated[modifierId];
          } else {
            updated[modifierId] = filteredSelections;
          }
        }

        return updated;
      });
    },
    []
  );

  const handleAddToCart = useCallback(async () => {
    // Validate required modifiers
    const missingRequired = availableModifiers
      .filter(
        (modifier) =>
          modifier.required &&
          (!selectedModifiers[modifier.id] ||
            selectedModifiers[modifier.id].length === 0)
      )
      .map((modifier) => modifier.name);

    if (missingRequired.length > 0) {
      // You might want to show an error toast here
      return;
    }

    const filteredModifier = product.modifiers
      ?.map((mod) => {
        const selectedItemIds = selectedModifiers[mod.modifierId];

        if (!selectedItemIds) return null;

        // filter only selected items
        const filteredItems = mod.items?.filter((item) =>
          selectedItemIds.includes(item.id)
        );
        return filteredItems && filteredItems.length > 0
          ? { ...mod, items: filteredItems }
          : null;
      })
      .filter(Boolean);

    const cartItem = {
      ...product,
      id: product.variantId,
      name: variant?.name || "",
      barcode: variant?.barcode || "",
      purchasePrice: variant?.purchasePrice || null,
      lowStockQty: variant?.lowStockQty || null,
      idealStockQty: variant?.idealStockQty || null,
      stock: variant?.stock || null,
      createdAt: variant?.createdAt || "",
      updatedAt: variant?.updatedAt || "",
      optionValues: variant?.optionValues || [],
      visible: variant?.visible || false,
      sku: variant?.sku || product.sku || "",
      price: variant?.price || product.price || 0,
      quantity: quantity,
      modifiers: filteredModifier || undefined,
      productId: product.productId,
      notes: specialInstructions
        ? {
            notes: specialInstructions,
            price: 0,
          }
        : undefined,
    };

    if (state.tables) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selectProduct(cartItem as any, state.tables);
      close(true);
    }
  }, [
    availableModifiers,
    close,
    product,
    quantity,
    selectProduct,
    selectedModifiers,
    state.tables,
    variant,
    specialInstructions,
  ]);

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Product Details</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Product Image and Basic Info */}
        <div className="p-4 space-y-4">
          <div className="flex gap-4">
            <div className="w-32 h-32 flex-shrink-0">
              <ProductImageDisplay
                images={images}
                title={product.productTitle || ""}
                stockStatus={{
                  stock,
                  isInStock: true,
                }}
                price={formatForDisplay(price)}
              />
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {product.productTitle}
                </h3>
                {variant?.name && (
                  <p className="text-sm text-gray-600">{variant.name}</p>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Hash className="h-4 w-4" />
                  <span>SKU: {variant?.sku || product.sku || "N/A"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-green-600">
                  {formatForDisplay(price)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Quantity Selector */}
        <div className="p-4 space-y-3">
          <Label className="text-base font-medium">Quantity</Label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="h-10 w-10 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <div className="flex-1 max-w-20">
              <Input
                type="number"
                min="1"
                max={stock}
                value={quantity}
                onChange={(e) =>
                  handleQuantityChange(parseInt(e.target.value) || 1)
                }
                className="text-center h-10"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={!!(stock && quantity >= stock)}
              className="h-10 w-10 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Modifiers */}
        {availableModifiers.length > 0 && (
          <div className="p-4 space-y-4">
            <Label className="text-base font-medium">
              Customize Your Order
            </Label>

            {availableModifiers.map((modifier) => (
              <Card key={modifier.id} className="p-4 space-y-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">{modifier.name}</Label>
                    {modifier.required && (
                      <Badge variant="secondary" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  {modifier.description && (
                    <p className="text-sm text-gray-500">
                      {modifier.description}
                    </p>
                  )}
                </div>

                {modifier.options && modifier.options.length > 0 && (
                  <div className="space-y-2">
                    {modifier.options.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`${modifier.id}-${option.id}`}
                            checked={(
                              selectedModifiers[modifier.id] || []
                            ).includes(option.id)}
                            onChange={(e) =>
                              handleModifierChange(
                                modifier.id,
                                option.id,
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 text-primary rounded focus:ring-primary"
                          />
                          <label
                            htmlFor={`${modifier.id}-${option.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {option.name}
                          </label>
                        </div>
                        {option.price > 0 && (
                          <span className="text-sm text-green-600 font-medium">
                            +${option.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        <Separator />

        {/* Special Instructions */}
        <div className="p-4 space-y-3">
          <Label className="text-base font-medium">Special Instructions</Label>
          <Textarea
            placeholder="Add any special requests or notes for the kitchen..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-gray-50 p-4 space-y-4">
        {/* Price Summary */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              {quantity} × {formatForDisplay(totalPrice / quantity)}
            </p>
            <p className="text-lg font-semibold text-gray-900">
              Total: {formatForDisplay(totalPrice)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => close(null)}
            className="flex-1"
            disabled={isRequest}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddToCart}
            className={cn("flex-1 gap-2", "bg-primary hover:bg-primary/90")}
            disabled={isRequest}
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}

// Export the sheet creator with proper typing
export const productDetailsSheet = createSheet<
  ProductDetailsSheetInput,
  boolean | null
>(ProductDetailsSheet, {
  defaultValue: null,
});
