"use client";

import { createSheet } from "@/components/create-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Receipt, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { RestaurantOrderItem } from "../../restaurant/contexts/restaurant-context";
import { CartItemQty } from "./cart-item-qty";
import { useCart } from "./context/cart-provider";
import { useCartActions } from "./context/use-cart-action";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

export const customerWalkInCartSheet = createSheet(
  () => {
    const { state, loading } = useCart();
    const { removeProduct, updateProductQty } = useCartActions();
    const [activeTab, setActiveTab] = useState("pending");
    const { formatForDisplay } = useCurrencyFormat();

    // Calculate items by status
    const getItemsByStatus = (status: string) => {
      return (
        state.orders?.items.filter((item) => {
          const statusItem = item.status?.find((s) => s.status === status);
          return statusItem && statusItem.qty > 0;
        }) || []
      );
    };

    const pendingItems = getItemsByStatus("pending");

    // Calculate accurate counts for tabs
    const pendingCount =
      state.orders?.items.reduce((acc, item) => {
        const pendingStatus = item.status?.find((s) => s.status === "pending");
        return acc + (pendingStatus?.qty || 0);
      }, 0) || 0;

    const otherCount =
      state.orders?.items.reduce((acc, item) => {
        const cookingStatus = item.status?.find((s) => s.status === "cooking");
        const servedStatus = item.status?.find((s) => s.status === "served");
        return acc + (cookingStatus?.qty || 0) + (servedStatus?.qty || 0);
      }, 0) || 0;

    const totalItems =
      state.orders?.items.reduce((acc, item) => {
        const itemQty =
          item.status?.reduce((sum, status) => sum + status.qty, 0) || 0;
        return acc + itemQty;
      }, 0) || 0;

    // Helper function to render item for specific status (for others tab)
    const renderCartItemForStatus = (
      item: RestaurantOrderItem,
      statusType: string
    ) => {
      // Get image from the correct path based on the data structure
      const basicProduct = item.productVariant?.basicProduct;

      // Type the productVariant to handle potential additional fields
      const productVariantExtended = item.productVariant as
        | {
            basicProduct?: {
              title?: string;
              images?: { url: string; productVariantId?: string }[];
            };
            images?: { url: string; productVariantId?: string }[];
            productTitle?: string;
          }
        | undefined;

      const image =
        // First try to find image by variant ID from basicProduct
        basicProduct?.images?.find(
          (img) => img.productVariantId === item.variantId
        ) ||
        // Then try first image from basicProduct
        basicProduct?.images?.[0] ||
        // Fallback: try direct productVariant images if they exist
        productVariantExtended?.images?.find(
          (img) => img.productVariantId === item.variantId
        ) ||
        productVariantExtended?.images?.[0];

      // Get title from the correct path
      const title =
        item.title ||
        basicProduct?.title ||
        productVariantExtended?.productTitle ||
        "Unknown Product";

      // Get quantity for specific status
      const statusQty =
        item.status?.find((s) => s.status === statusType)?.qty || 0;

      return (
        <div className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
          {/* Main Item Info */}
          <div className="flex items-start gap-4">
            {/* Product Image */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                {image?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.url}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove(
                        "hidden"
                      );
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full bg-gray-100 flex items-center justify-center ${
                    image?.url ? "hidden" : ""
                  }`}
                >
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              </div>
              {/* Quantity Badge */}
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground"
              >
                {statusQty}
              </Badge>
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight line-clamp-2">
                  {title}
                </h4>
                {item.variantId && item.productVariant?.name && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {item.productVariant.name}
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    statusType === "cooking"
                      ? "bg-orange-500 text-white"
                      : "bg-green-500 text-white"
                  }`}
                >
                  {statusType === "cooking" ? "Cooking" : "Served"}
                </Badge>
              </div>

              {/* Base Price */}
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">
                  {formatForDisplay(Number(item.price))}
                </span>
                <span className="text-sm text-gray-500">each</span>
              </div>

              {/* Add-ons Section */}
              {(item.orderModifiers?.length || 0) > 0 && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                      Add-ons
                    </span>
                  </div>
                  <div className="space-y-1">
                    {item.orderModifiers?.map((modifier, idx) => {
                      const productModifier =
                        item.productVariant?.basicProduct?.modifiers
                          .flatMap((m) => m.items)
                          .find((f) => f?.id === modifier.modifierItemId);
                      return (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs"
                        >
                          <span className="text-blue-700">
                            + {productModifier?.name || "Add-on"}
                          </span>
                          <span className="font-semibold text-blue-800">
                            +{formatForDisplay(Number(modifier.price || 0))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes Charge */}
              {item.notes && (
                <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-amber-700 font-medium">
                      {item.notes.notes}
                    </span>
                    <span className="font-semibold text-amber-800">
                      +{formatForDisplay(Number(item.notes.price))}
                    </span>
                  </div>
                </div>
              )}

              {/* Discounts Section */}
              {(item.discounts?.length || 0) > 0 && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                      Discounts Applied
                    </span>
                  </div>
                  <div className="space-y-1">
                    {item.discounts?.map((discount, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs"
                      >
                        <span className="text-green-700">{discount.name}</span>
                        <span className="font-semibold text-green-800">
                          -{formatForDisplay(discount.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quantity and Total */}
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                Quantity:
              </span>
              <span className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md">
                {statusQty}
              </span>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500">Subtotal</div>
              <div className="text-lg font-bold text-gray-900">
                {formatForDisplay(
                  (parseFloat(item.totalAmount || "0") * statusQty) /
                    (item.status?.reduce(
                      (sum, status) => sum + status.qty,
                      0
                    ) || 1)
                )}
              </div>
            </div>
          </div>
        </div>
      );
    };

    const renderCartItem = (item: RestaurantOrderItem, isReadOnly = false) => {
      // Get image from the correct path based on the data structure
      const basicProduct = item.productVariant?.basicProduct;

      // Type the productVariant to handle potential additional fields
      const productVariantExtended = item.productVariant as
        | {
            basicProduct?: {
              title?: string;
              images?: { url: string; productVariantId?: string }[];
            };
            images?: { url: string; productVariantId?: string }[];
            productTitle?: string;
          }
        | undefined;

      const image =
        // First try to find image by variant ID from basicProduct
        basicProduct?.images?.find(
          (img) => img.productVariantId === item.variantId
        ) ||
        // Then try first image from basicProduct
        basicProduct?.images?.[0] ||
        // Fallback: try direct productVariant images if they exist
        productVariantExtended?.images?.find(
          (img) => img.productVariantId === item.variantId
        ) ||
        productVariantExtended?.images?.[0];

      // Get title from the correct path
      const title =
        item.title ||
        basicProduct?.title ||
        productVariantExtended?.productTitle ||
        "Unknown Product";

      // Calculate quantity for current tab's status
      const currentStatus = item.status?.find((s) => s.status === activeTab);
      const qtyForActiveTab = currentStatus?.qty || 0;

      return (
        <div
          key={`${item.variantId}-${activeTab}`}
          className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
        >
          {/* Main Item Info */}
          <div className="flex items-start gap-4">
            {/* Product Image */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                {image?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.url}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove(
                        "hidden"
                      );
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full bg-gray-100 flex items-center justify-center ${
                    image?.url ? "hidden" : ""
                  }`}
                >
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              </div>
              {/* Quantity Badge */}
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground"
              >
                {qtyForActiveTab}
              </Badge>
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight line-clamp-2">
                  {title}
                </h4>
                {item.variantId && item.productVariant?.name && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {item.productVariant.name}
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge
                  variant={activeTab === "pending" ? "default" : "secondary"}
                  className={`text-xs ${
                    activeTab === "pending"
                      ? "bg-blue-500 text-white"
                      : activeTab === "cooking"
                      ? "bg-orange-500 text-white"
                      : "bg-green-500 text-white"
                  }`}
                >
                  {activeTab === "pending"
                    ? "Pending"
                    : activeTab === "cooking"
                    ? "Cooking"
                    : "Served"}
                </Badge>
              </div>

              {/* Base Price */}
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">
                  {formatForDisplay(Number(item.price))}
                </span>
                <span className="text-sm text-gray-500">each</span>
              </div>

              {/* Add-ons Section */}
              {(item.orderModifiers?.length || 0) > 0 && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                      Add-ons
                    </span>
                  </div>
                  <div className="space-y-1">
                    {item.orderModifiers?.map((modifier, idx) => {
                      const productModifier =
                        item.productVariant?.basicProduct?.modifiers
                          .flatMap((m) => m.items)
                          .find((f) => f?.id === modifier.modifierItemId);
                      return (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs"
                        >
                          <span className="text-blue-700">
                            + {productModifier?.name || "Add-on"}
                          </span>
                          <span className="font-semibold text-blue-800">
                            +{formatForDisplay(Number(modifier.price || 0))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes Charge */}
              {item.notes && (
                <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-amber-700 font-medium">
                      {item.notes.notes}
                    </span>
                    <span className="font-semibold text-amber-800">
                      +{formatForDisplay(Number(item.notes.price))}
                    </span>
                  </div>
                </div>
              )}

              {/* Discounts Section */}
              {(item.discounts?.length || 0) > 0 && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                      Discounts Applied
                    </span>
                  </div>
                  <div className="space-y-1">
                    {item.discounts?.map((discount, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs"
                      >
                        <span className="text-green-700">{discount.name}</span>
                        <span className="font-semibold text-green-800">
                          -{formatForDisplay(discount.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Section */}
            <div className="flex flex-col items-end gap-3">
              {!isReadOnly && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (state.tables) {
                      const otherQty = item.status?.reduce((a, b) => {
                        if (b.status !== "pending") {
                          return a + b.qty;
                        }
                        return a;
                      }, 0);
                      if (otherQty === 0) {
                        removeProduct(item.orderDetailId, state.tables);
                      } else {
                        updateProductQty(item.orderDetailId, 0, state.tables!);
                      }
                    }
                  }}
                  disabled={loading}
                  className="h-8 w-8 p-0 text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Quantity Controls & Item Total */}
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                Quantity:
              </span>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                {!isReadOnly ? (
                  <CartItemQty
                    qty={qtyForActiveTab}
                    setQty={(qty) => {
                      if (qty !== qtyForActiveTab) {
                        updateProductQty(
                          item.orderDetailId,
                          qty,
                          state.tables!
                        );
                      }
                    }}
                  />
                ) : (
                  <span className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md">
                    {qtyForActiveTab}
                  </span>
                )}
              </div>
            </div>

            {/* Item Total */}
            <div className="text-right">
              <div className="text-sm text-gray-500">Subtotal</div>
              <div className="text-lg font-bold text-gray-900">
                {formatForDisplay(
                  (parseFloat(item.totalAmount || "0") * qtyForActiveTab) /
                    (item.status?.reduce(
                      (sum, status) => sum + status.qty,
                      0
                    ) || 1)
                )}
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <>
        <SheetHeader className="p-4 sm:p-6 pt-9 border-b bg-gradient-to-r from-primary/5 to-transparent -m-6">
          <SheetTitle className="flex items-center gap-2 text-gray-900">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <span className="text-base sm:text-lg font-semibold">
              Your Order
            </span>
            <Badge variant="secondary" className="ml-auto">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </Badge>
          </SheetTitle>
          <SheetDescription className="text-sm text-gray-600 mt-2 -ml-4">
            Review your items before placing the order
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 px-2 sm:px-6 -m-6">
          {(state.orders?.items.length || 0) <= 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-10 w-10 text-gray-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Your cart is empty
              </h3>
              <p className="text-gray-500 max-w-sm">
                Browse our delicious menu and add some items to get started with
                your order
              </p>
            </div>
          ) : (
            <div className="py-7">
              <Tabs
                defaultValue="pending"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger
                    value="pending"
                    className="flex items-center gap-2"
                  >
                    <span>Pending</span>
                    <Badge
                      variant="secondary"
                      className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {pendingCount}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="others"
                    className="flex items-center gap-2"
                  >
                    <span>In Progress & Served</span>
                    <Badge
                      variant="secondary"
                      className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {otherCount}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                  {pendingItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Package className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-500">No pending items</p>
                    </div>
                  ) : (
                    pendingItems
                      .map((item) => {
                        // Only render if this item has pending quantity
                        const pendingStatus = item.status?.find(
                          (s) => s.status === "pending"
                        );
                        if (!pendingStatus || pendingStatus.qty === 0)
                          return null;
                        return (
                          <div key={`${item.orderDetailId}-pending`}>
                            {renderCartItem(item, false)}
                          </div>
                        );
                      })
                      .filter(Boolean)
                  )}
                </TabsContent>

                <TabsContent value="others" className="space-y-4">
                  {(() => {
                    // Get all items that have cooking or served status with quantities
                    const itemsWithOtherStatuses =
                      state.orders?.items.flatMap((item) => {
                        const results = [];

                        // Check for cooking status
                        const cookingStatus = item.status?.find(
                          (s) => s.status === "cooking"
                        );
                        if (cookingStatus && cookingStatus.qty > 0) {
                          results.push({
                            ...item,
                            currentStatus: "cooking",
                            statusQty: cookingStatus.qty,
                          });
                        }

                        // Check for served status
                        const servedStatus = item.status?.find(
                          (s) => s.status === "served"
                        );
                        if (servedStatus && servedStatus.qty > 0) {
                          results.push({
                            ...item,
                            currentStatus: "served",
                            statusQty: servedStatus.qty,
                          });
                        }

                        return results;
                      }) || [];

                    return itemsWithOtherStatuses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Package className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500">
                          No items in progress or served
                        </p>
                      </div>
                    ) : (
                      itemsWithOtherStatuses.map((itemWithStatus, index) => (
                        <div
                          key={`${itemWithStatus.orderDetailId}-${itemWithStatus.currentStatus}-${index}`}
                        >
                          {renderCartItemForStatus(
                            itemWithStatus,
                            itemWithStatus.currentStatus
                          )}
                        </div>
                      ))
                    );
                  })()}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </ScrollArea>
        {/* Enhanced Order Total Footer */}
        {(state.orders?.items.length || 0) > 0 && (
          <div className="border-t bg-white -m-6 p-2 shadow-lg mt-auto">
            <div className="space-y-4">
              {/* Order Summary Header */}
              <div className="flex items-center gap-2 pb-2">
                <Receipt className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Order Summary
                </h3>
              </div>

              {/* Subtotal breakdown */}
              <div className="space-y-3 text-sm">
                {(() => {
                  const subtotal =
                    state.orders?.items.reduce((acc, item) => {
                      const itemQty =
                        item.status?.reduce(
                          (sum, status) => sum + status.qty,
                          0
                        ) || 0;
                      const itemPrice = parseFloat(item.price);
                      return acc + itemPrice * itemQty;
                    }, 0) || 0;

                  const totalModifiers =
                    state.orders?.items.reduce((acc, item) => {
                      const itemQty =
                        item.status?.reduce(
                          (sum, status) => sum + status.qty,
                          0
                        ) || 0;
                      const modifierAmount = parseFloat(
                        item.modiferAmount || "0"
                      );
                      return acc + modifierAmount * itemQty;
                    }, 0) || 0;

                  const totalDiscounts =
                    state.orders?.items.reduce((acc, item) => {
                      const discountAmount = parseFloat(
                        item.discountAmount || "0"
                      );
                      return acc + discountAmount;
                    }, 0) || 0;

                  return (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-gray-700">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          Subtotal ({totalItems}{" "}
                          {totalItems === 1 ? "item" : "items"})
                        </span>
                        <span className="font-semibold">
                          {formatForDisplay(subtotal)}
                        </span>
                      </div>

                      {totalModifiers > 0 && (
                        <div className="flex justify-between items-center text-blue-700">
                          <span className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Add-ons & Special Notes
                          </span>
                          <span className="font-semibold">
                            +{formatForDisplay(totalModifiers)}
                          </span>
                        </div>
                      )}

                      {totalDiscounts > 0 && (
                        <div className="flex justify-between items-center text-green-700">
                          <span className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Discounts Applied
                          </span>
                          <span className="font-semibold">
                            -{formatForDisplay(totalDiscounts)}
                          </span>
                        </div>
                      )}

                      <Separator className="my-3" />

                      {/* Final Total */}
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xl font-bold text-gray-900">
                          Total Amount
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          {(() => {
                            const total =
                              state.orders?.items.reduce((acc, item) => {
                                const itemQty =
                                  item.status?.reduce(
                                    (sum, status) => sum + status.qty,
                                    0
                                  ) || 0;
                                const itemTotal = parseFloat(
                                  item.totalAmount || "0"
                                );
                                const itemPrice = parseFloat(item.price);
                                return acc + (itemTotal || itemPrice * itemQty);
                              }, 0) || 0;
                            return formatForDisplay(total);
                          })()}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
  { defaultValue: null }
);
