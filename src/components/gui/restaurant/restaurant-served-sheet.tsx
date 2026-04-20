import { createSheet } from "@/components/create-sheet";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  RestaurantOrderItem,
  useRestaurant,
} from "./contexts/restaurant-context";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useRestaurantActions } from "./hooks/use-restaurant-actions";
import { Separator } from "@/components/ui/separator";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { MaterialInput } from "@/components/ui/material-input";

export const sheetRestaurantServed = createSheet<
  { data: RestaurantOrderItem },
  unknown
>(
  ({ data, close }) => {
    const { state, loading, isRequest } = useRestaurant();
    const { completedProduct } = useRestaurantActions();
    const params = useSearchParams();
    const [servedQty, setServedQty] = useState<number>(1);

    const current = state.activeTables.find(
      (x) => x.tables?.id === params.get("table")
    );

    // Get all items with the same orderDetailId to show different statuses
    const allItemsWithSameId =
      current?.orders?.items.filter(
        (item) => item.orderDetailId === data.orderDetailId
      ) || [];

    // Get cooking items for this product
    const cookingItems = allItemsWithSameId.filter((item) =>
      item.status?.find((f) => f.status === "cooking")
    );

    const totalCookingQty = cookingItems.reduce(
      (sum, item) => sum + item.qty,
      0
    );
    const totalReadyQty = allItemsWithSameId
      .filter((item) => item.status?.find((f) => f.status === "ready"))
      .reduce((sum, item) => sum + item.qty, 0);
    const totalServedQty = allItemsWithSameId
      .filter((item) => item.status?.find((f) => f.status === "served"))
      .reduce((sum, item) => sum + item.qty, 0);

    const handleServeItems = async () => {
      if (!current?.tables || servedQty <= 0 || servedQty > totalCookingQty) {
        return;
      }

      try {
        await completedProduct(current?.tables, data.orderDetailId, servedQty);
        close(true); // Close the sheet after successful update
      } catch (error) {
        console.error("Error serving items:", error);
      }
    };

    const maxServableQty = Math.min(totalCookingQty, 99);

    // Get product image from productVariant
    const productImage = data.productVariant?.basicProduct?.images?.[0]?.url;
    const productTitle = data.productVariant?.basicProduct?.title || data.title;
    const productCategory = ""; // Category is not available in BasicProductType

    return (
      <>
        <SheetHeader>
          <SheetTitle>Mark as Served</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 p-4">
          {/* Product Info */}
          <div className="flex items-start space-x-4">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
              <ImageWithFallback
                src={productImage || ""}
                alt={productTitle}
                title={productTitle}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{productTitle}</h3>
              {productCategory && (
                <p className="text-sm text-gray-600">{productCategory}</p>
              )}
              <p className="text-sm font-medium text-blue-600">
                ${Number(data.price).toFixed(2)} each
              </p>
            </div>
          </div>

          <Separator />

          {/* Status Overview */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Order Status Overview</h4>

            <div className="grid grid-cols-1 gap-3">
              {/* Cooking Status */}
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-orange-700 text-white">Cooking</Badge>
                </div>
                <span className="text-lg font-bold text-orange-700">
                  {totalCookingQty} {totalCookingQty === 1 ? "item" : "items"}
                </span>
              </div>

              {/* Ready Status */}
              {totalReadyQty > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-700 text-white">Ready</Badge>
                    <span className="text-sm font-medium">
                      Already completed
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-700">
                    {totalReadyQty} {totalReadyQty === 1 ? "item" : "items"}
                  </span>
                </div>
              )}

              {/* Served Status */}
              {totalServedQty > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-700 text-white">Served</Badge>
                    <span className="text-sm font-medium">Already served</span>
                  </div>
                  <span className="text-lg font-bold text-blue-700">
                    {totalServedQty} {totalServedQty === 1 ? "item" : "items"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Serve Items Form */}
          {totalCookingQty > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">
                Mark Items as Served
              </h4>

              <div className="space-y-2">
                <MaterialInput
                  value={servedQty}
                  type="number"
                  min={1}
                  max={maxServableQty}
                  onChange={(e) => setServedQty(Number(e.target.value || 1))}
                  className="w-full"
                  placeholder={`Quantity to serve (Max: ${totalCookingQty})`}
                  label={`Quantity to serve (Max: ${totalCookingQty})`}
                  disabled={loading || isRequest}
                />
              </div>

              <div className="flex space-x-2 justify-end">
                <Button
                  onClick={handleServeItems}
                  disabled={
                    servedQty <= 0 ||
                    servedQty > totalCookingQty ||
                    loading ||
                    isRequest
                  }
                >
                  Mark {servedQty} {servedQty === 1 ? "Item" : "Items"} as
                  Served
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setServedQty(totalCookingQty);
                    setTimeout(() => {
                      handleServeItems();
                    }, 300);
                  }}
                  disabled={totalCookingQty === 0 || loading || isRequest}
                >
                  Serve All
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500">
                <p className="text-lg font-medium">No items ready to serve</p>
                <p className="text-sm">
                  All items for this product have already been served or are not
                  yet ready.
                </p>
              </div>
            </div>
          )}
        </div>
      </>
    );
  },
  { defaultValue: null }
);
