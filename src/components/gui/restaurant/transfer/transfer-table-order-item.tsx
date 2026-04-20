import { ImageWithFallback } from "@/components/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CheckCircle, ChefHat, Clock, ImageIcon } from "lucide-react";
import { RestaurantItemModifier } from "../item/restaurant-item-modifier";
import { TransferItem } from "./transfer-table";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

interface Props {
  item: TransferItem;
  handleQuantityChangeByStatus: (
    orderDetailId: string,
    status: "pending" | "cooking" | "served",
    newQty: number
  ) => void;
  handleSelectAll: (selectAll: boolean) => void;
}

export function TransferTableOrderItem({
  item,
  handleQuantityChangeByStatus,
  handleSelectAll,
}: Props) {
  const { formatForDisplay } = useCurrencyFormat();
  const image =
    (item.productVariant?.basicProduct?.images || []).length > 0
      ? item.productVariant?.basicProduct?.images?.find(
          (f) => f.productVariantId === item.productVariant?.id
        )?.url
      : "";

  const title = item.productVariant?.basicProduct?.title || "";
  const variantName = item.productVariant?.name || "";
  const price = Number(item.price || 0);
  const totalAmount = Number(item.totalAmount || 0);
  const discountAmount = Number(item.discountAmount || 0);

  // Get status quantities from the item status
  const pendingQty = item.status?.find((s) => s.status === "pending")?.qty || 0;
  const cookingQty = item.status?.find((s) => s.status === "cooking")?.qty || 0;
  const servedQty = item.status?.find((s) => s.status === "served")?.qty || 0;

  const totalSelected = item.selectedQty;
  const isAnySelected = totalSelected > 0;

  // Helper function to handle status quantity change
  const handleStatusQtyChange = (
    status: "pending" | "cooking" | "served",
    newQty: number
  ) => {
    handleQuantityChangeByStatus(item.orderDetailId, status, newQty);
  };

  return (
    <div
      key={item.orderDetailId}
      className={cn(
        "border rounded-xl p-4 bg-white hover:bg-gray-50/70 transition-all duration-200",
        isAnySelected && "ring-2 ring-blue-500/20 border-blue-200 bg-blue-50/30"
      )}
    >
      <div className="flex flex-col space-y-4">
        {/* Header section with checkbox and product info */}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isAnySelected}
            onCheckedChange={handleSelectAll}
            className="mt-1 flex-shrink-0 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            aria-label={`Select ${title} for transfer`}
          />

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              {/* Product Image */}
              <div className="flex-shrink-0">
                {image ? (
                  <ImageWithFallback
                    src={image}
                    alt={title}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-cover rounded-lg border-2 border-gray-100"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg border-2 border-gray-100 bg-gray-50 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold text-sm leading-tight text-gray-900">
                      {title}
                    </h3>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium text-gray-900">
                        {formatForDisplay(price)}
                      </span>
                      {variantName && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {variantName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price Info */}
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      {discountAmount > 0 ? (
                        <div className="flex flex-col items-end space-y-1">
                          <span className="text-xs text-gray-400 line-through">
                            {totalAmount + discountAmount}
                          </span>
                          <span className="font-semibold text-sm text-green-600">
                            {formatForDisplay(totalAmount)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-semibold text-sm text-gray-900">
                          {formatForDisplay(totalAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modifiers And Notes Display */}
                {((item.orderModifiers?.length || 0) > 0 || item.notes) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <RestaurantItemModifier
                      modifiers={item.productVariant?.basicProduct?.modifiers}
                      orderModifier={item.orderModifiers}
                      notes={item.notes}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status-based Quantity Input Sections */}
        <div className="space-y-3">
          {/* Pending Items */}
          {pendingQty > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-100 text-gray-700 border-gray-300"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Pending Items
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Available: {pendingQty}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleStatusQtyChange(
                        "pending",
                        Math.max(0, item.selectedQtyByStatus.pending - 1)
                      )
                    }
                    disabled={item.selectedQtyByStatus.pending <= 0}
                    className="h-8 w-8 p-0 flex-shrink-0 hover:bg-gray-100"
                    aria-label="Decrease pending quantity"
                  >
                    -
                  </Button>

                  <Input
                    type="number"
                    min="0"
                    max={pendingQty}
                    value={item.selectedQtyByStatus.pending}
                    onChange={(e) =>
                      handleStatusQtyChange(
                        "pending",
                        Math.min(
                          pendingQty,
                          Math.max(0, parseInt(e.target.value) || 0)
                        )
                      )
                    }
                    className="w-20 h-8 text-center text-sm font-medium"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleStatusQtyChange(
                        "pending",
                        Math.min(
                          pendingQty,
                          item.selectedQtyByStatus.pending + 1
                        )
                      )
                    }
                    disabled={item.selectedQtyByStatus.pending >= pendingQty}
                    className="h-8 w-8 p-0 flex-shrink-0 hover:bg-gray-100"
                    aria-label="Increase pending quantity"
                  >
                    +
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusQtyChange("pending", pendingQty)}
                    disabled={item.selectedQtyByStatus.pending >= pendingQty}
                    className="ml-2 h-8 text-xs px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                  >
                    All
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Cooking Items */}
          {cookingQty > 0 && (
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="text-xs bg-orange-100 text-orange-700 border-orange-300"
                  >
                    <ChefHat className="w-3 h-3 mr-1" />
                    Cooking Items
                  </Badge>
                  <span className="text-xs text-orange-600">
                    Available: {cookingQty}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleStatusQtyChange(
                        "cooking",
                        Math.max(0, item.selectedQtyByStatus.cooking - 1)
                      )
                    }
                    disabled={item.selectedQtyByStatus.cooking <= 0}
                    className="h-8 w-8 p-0 flex-shrink-0 hover:bg-orange-100"
                    aria-label="Decrease cooking quantity"
                  >
                    -
                  </Button>

                  <Input
                    type="number"
                    min="0"
                    max={cookingQty}
                    value={item.selectedQtyByStatus.cooking}
                    onChange={(e) =>
                      handleStatusQtyChange(
                        "cooking",
                        Math.min(
                          cookingQty,
                          Math.max(0, parseInt(e.target.value) || 0)
                        )
                      )
                    }
                    className="w-20 h-8 text-center text-sm font-medium"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleStatusQtyChange(
                        "cooking",
                        Math.min(
                          cookingQty,
                          item.selectedQtyByStatus.cooking + 1
                        )
                      )
                    }
                    disabled={item.selectedQtyByStatus.cooking >= cookingQty}
                    className="h-8 w-8 p-0 flex-shrink-0 hover:bg-orange-100"
                    aria-label="Increase cooking quantity"
                  >
                    +
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusQtyChange("cooking", cookingQty)}
                    disabled={item.selectedQtyByStatus.cooking >= cookingQty}
                    className="ml-2 h-8 text-xs px-3 bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300"
                  >
                    All
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Served Items */}
          {servedQty > 0 && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-100 text-green-700 border-green-300"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Served Items
                  </Badge>
                  <span className="text-xs text-green-600">
                    Available: {servedQty}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleStatusQtyChange(
                        "served",
                        Math.max(0, item.selectedQtyByStatus.served - 1)
                      )
                    }
                    disabled={item.selectedQtyByStatus.served <= 0}
                    className="h-8 w-8 p-0 flex-shrink-0 hover:bg-green-100"
                    aria-label="Decrease served quantity"
                  >
                    -
                  </Button>

                  <Input
                    type="number"
                    min="0"
                    max={servedQty}
                    value={item.selectedQtyByStatus.served}
                    onChange={(e) =>
                      handleStatusQtyChange(
                        "served",
                        Math.min(
                          servedQty,
                          Math.max(0, parseInt(e.target.value) || 0)
                        )
                      )
                    }
                    className="w-20 h-8 text-center text-sm font-medium"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleStatusQtyChange(
                        "served",
                        Math.min(servedQty, item.selectedQtyByStatus.served + 1)
                      )
                    }
                    disabled={item.selectedQtyByStatus.served >= servedQty}
                    className="h-8 w-8 p-0 flex-shrink-0 hover:bg-green-100"
                    aria-label="Increase served quantity"
                  >
                    +
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusQtyChange("served", servedQty)}
                    disabled={item.selectedQtyByStatus.served >= servedQty}
                    className="ml-2 h-8 text-xs px-3 bg-green-100 hover:bg-green-200 text-green-700 border-green-300"
                  >
                    All
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Summary section when items are selected */}
          {totalSelected > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  Total Selected for Transfer:
                </span>
                <span className="text-sm font-bold text-blue-900">
                  {totalSelected} item{totalSelected !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
