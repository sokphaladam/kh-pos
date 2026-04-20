/* eslint-disable jsx-a11y/alt-text */
import { cn } from "@/lib/utils";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { ChefHat, Image } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  RestaurantOrderItem,
  useRestaurant,
} from "../contexts/restaurant-context";
import { restaurantCustomOrder } from "../custom-order/restaurant-custom-order";
import { RestaurantItemMenu } from "./restaurant-item-menu";
import { RestaurantItemModifier } from "./restaurant-item-modifier";
import { RestaurantItemStatus } from "./restaurant-item-status";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";

interface RestaurantItemProps extends WithLayoutPermissionProps {
  item: RestaurantOrderItem;
  idx: number;
  viewOnly?: boolean;
}

/* eslint-disable @next/next/no-img-element */
export function RestaurantItem({
  item,
  viewOnly,
  ...rest
}: RestaurantItemProps) {
  const { formatForDisplay } = useCurrencyFormat();
  const { state, loading } = useRestaurant();
  const [loadingInput, setLoadingInput] = useState(false);
  const [isQtyAnimating, setIsQtyAnimating] = useState(false);
  const [prevQty, setPrevQty] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const params = useSearchParams();

  // Tick every minute so kitchen time stays fresh
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const current = state.activeTables.find(
    (t) => t.tables?.id === params.get("table"),
  );

  const currentQty = item.status?.reduce((a, b) => a + b.qty, 0) || 0;

  const lastKitchenLog =
    item.kitchenLogs && item.kitchenLogs.length > 0
      ? item.kitchenLogs.reduce((latest, log) =>
          new Date(log.printedAt || 0) > new Date(latest.printedAt || 0)
            ? log
            : latest,
        )
      : null;

  const kitchenMinutesAgo = lastKitchenLog
    ? Math.floor(
        (now - new Date(lastKitchenLog.printedAt || 0).getTime()) / 60000,
      )
    : null;

  const isKitchenAlert =
    kitchenMinutesAgo !== null &&
    kitchenMinutesAgo >= 5 &&
    kitchenMinutesAgo % 5 === 0;

  // Animation effect when quantity changes
  useEffect(() => {
    if (prevQty !== 0 && currentQty !== prevQty && currentQty > prevQty) {
      setIsQtyAnimating(true);
      const timer = setTimeout(() => {
        setIsQtyAnimating(false);
      }, 1200); // Longer animation duration for more obvious effect
      return () => clearTimeout(timer);
    }
    setPrevQty(currentQty);
  }, [currentQty, prevQty]);

  useEffect(() => {
    if (!!loadingInput) {
      setLoadingInput(false);
    }
  }, [loadingInput]);

  const image =
    (item.productVariant?.basicProduct?.images || []).length > 0
      ? item.productVariant?.basicProduct?.images?.find(
          (f) => f.productVariantId === item.productVariant?.id,
        )?.url
      : "";

  const title = item.productVariant?.basicProduct?.title || "";

  const handleOpenEdit = useCallback(async () => {
    if (loading || loadingInput || !!viewOnly) return;
    const variant = item.productVariant;
    const data = {
      ...variant,
      id: variant?.id || "",
      productId: variant?.productId || "",
      name: variant?.name || "",
      sku: variant?.sku || "",
      barcode: variant?.barcode || "",
      price: Number(variant?.price),
      notes: item.notes,
      quantity: item.status?.reduce((a, b) => a + b.qty, 0) || 1,
      modifiers: item.productVariant?.basicProduct?.modifiers || [],
      createdAt: "",
      idealStockQty: variant?.idealStockQty || 0,
      lowStockQty: variant?.lowStockQty || 0,
      optionValues: variant?.optionValues || [],
      purchasePrice: variant?.purchasePrice || 0,
      stock: variant?.stock || 0,
      updatedAt: "",
      selectedModifiers:
        item.orderModifiers?.map((x) => x.modifierItemId) || [],
      visible: variant?.visible || true,
      movie: variant?.movie ?? null,
    };
    const res = await restaurantCustomOrder.show({
      selectedMenuItem: data,
      allowDiscount: true,
      productId: variant?.productId || "",
      orderDetailId: item.orderDetailId,
      orderId: current?.orders?.orderId || "",
      status: item.status,
      table: current?.tables,
      orderItem: item,
    });
    if (res) {
      console.log(res);
    }
  }, [item, current, loading, loadingInput, viewOnly]);

  return (
    <div
      className={cn(
        "p-4 bg-white transition-all duration-500",
        loading || loadingInput
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer",
        isQtyAnimating && "bg-green-50 border-green-200 shadow-md",
        isKitchenAlert && !isQtyAnimating && "bg-orange-50 border-orange-300",
        !viewOnly && "border-b",
      )}
      onClick={handleOpenEdit}
    >
      {/* Kitchen check-progress alert banner */}
      {isKitchenAlert && (
        <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded bg-orange-100 border border-orange-300 animate-pulse">
          <ChefHat className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <span className="text-xs font-semibold text-orange-700">
            Check progress — {kitchenMinutesAgo} min in kitchen
          </span>
        </div>
      )}
      {/* First Row: Image with Index Overlay | Product Name, SKU, Price | Three Dots */}
      <div className="flex items-start gap-2 mb-1">
        {/* Product Image with Index Overlay */}
        <div className="flex-shrink-0 relative">
          {image ? (
            <img
              src={image}
              alt={title || ""}
              className="w-10 h-10 object-contain rounded border"
            />
          ) : (
            <div className="w-10 h-10 rounded border bg-muted text-muted-foreground text-center flex justify-center items-center">
              <Image className="w-4 h-4" />
            </div>
          )}
          <div
            className={cn(
              "absolute -top-1 -left-1 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center transition-all duration-700 ease-out",
              isQtyAnimating &&
                "animate-bounce scale-150 bg-gradient-to-r from-green-400 to-green-600 shadow-2xl shadow-green-500/70 border-2 border-white ring-2 ring-green-300",
            )}
          >
            <span
              className={cn(
                "text-xs font-bold transition-all duration-500",
                isQtyAnimating && "animate-pulse text-white scale-110",
              )}
            >
              {currentQty}
            </span>
          </div>
        </div>

        {/* Product Name, SKU, Price */}
        <div className="flex-1 min-w-0 h-5 flex flex-col gap-1">
          <div className="relative flex flex-row gap-2">
            <h3 className="font-semibold text-xs leading-tight overflow-hidden whitespace-nowrap flex flex-nowrap gap-2">
              {title}{" "}
            </h3>
          </div>
          <div className="flex flex-row gap-1 items-center">
            <span className="text-xs font-medium">
              {formatForDisplay(item.price)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({item.productVariant?.name})
            </span>
          </div>
        </div>

        {/* Three Dots Menu */}
        {!viewOnly && (
          <RestaurantItemMenu
            item={item}
            orderId={current?.orders?.orderId || ""}
            table={current?.tables}
            {...rest}
          />
        )}
      </div>

      {/* Second Row: Qty Controls | Total Amount */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex gap-4 items-center"></div>
      </div>

      {/* Third Row: Modifiers and Notes */}
      <div>
        <div className="flex flex-row justify-between">
          <div className="flex flex-col gap-0.5">
            <RestaurantItemStatus status={item.status} />
            {kitchenMinutesAgo !== null && (
              <div className="flex items-center gap-1 text-xs text-orange-500">
                <ChefHat className="w-3 h-3" />
                <span>
                  {kitchenMinutesAgo === 0
                    ? "Sent to kitchen just now"
                    : `Sent to kitchen ${kitchenMinutesAgo} min ago`}
                </span>
              </div>
            )}
          </div>
          <div className="text-right">
            {Number(item.discountAmount) > 0 ? (
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-muted-foreground line-through">
                  {formatForDisplay(
                    Number(item.totalAmount) + Number(item.discountAmount),
                  )}
                </span>
                <span className="font-bold text-sm text-green-600">
                  {formatForDisplay(item.totalAmount)}
                </span>
              </div>
            ) : (
              <div className="font-bold text-sm">
                {formatForDisplay(item.totalAmount)}
              </div>
            )}
          </div>
        </div>
        {/* Modifiers And Notes Display */}
        {((item.orderModifiers?.length || 0) > 0 || item.notes) && (
          <RestaurantItemModifier
            modifiers={item.productVariant?.basicProduct?.modifiers}
            orderModifier={item.orderModifiers}
            notes={item.notes}
            orderedQty={currentQty}
          />
        )}
      </div>
    </div>
  );
}
