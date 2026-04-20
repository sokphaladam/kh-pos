"use client";
import { Button } from "@/components/ui/button";
import { useWindowSize } from "@/components/use-window-size";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { usePermission } from "@/hooks/use-permissions";
import {
  Check,
  ChefHat,
  CookingPot,
  Percent,
  PersonStanding,
  Printer,
  ReplaceAll,
  ShoppingBag,
  Truck,
  Utensils,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RestaurantOrderItem,
  useRestaurant,
} from "./contexts/restaurant-context";
import { restartCustomCustomer } from "./custom-order/restaurant-custom-customer";
import { useRestaurantActions } from "./hooks/use-restaurant-actions";
import { RestaurantItem } from "./item/restaurant-item";
import { RestaurantCheckout } from "./restaurant-checkout";
import { restaurantDiscountSheet } from "./restaurant-discount-sheet";
import { transferTable } from "./transfer/transfer-table";
import { DeleteOrderButton } from "./components/delete-order-button";
import { cn } from "@/lib/utils";
import { restaurantCustomFoodDelivery } from "./custom-order/restaurant-custom-food-delivery";

export function RestaurantSummary(props: WithLayoutPermissionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [prevOrderCount, setPrevOrderCount] = useState(0);
  const prevOrderItemsRef = useRef<RestaurantOrderItem[]>([]);
  const { height } = useWindowSize();
  const { state, loading, isRequest, onRefetch } = useRestaurant();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { sendAllToKitchent, serverAllItems, setOrderPrintTime } =
    useRestaurantActions();
  const { setPrintingOrder } = useRestaurant();
  const orderPreparationPermissions = usePermission("order-preparation");
  const canUpdateStatus = orderPreparationPermissions.includes("update");

  const currentTable = state.activeTables.find(
    (t) => t.tables?.id === params.get("table") || "",
  );

  const currentOrder = useMemo(
    () => currentTable?.orders?.items || [],
    [currentTable?.orders?.items],
  );

  // Function to scroll to a specific item using refs
  const scrollToItem = useCallback((itemIndex: number) => {
    if (scrollContainerRef.current) {
      setTimeout(() => {
        const itemElement = scrollContainerRef.current?.querySelector(
          `[data-item-index="${itemIndex}"]`,
        ) as HTMLElement;

        if (itemElement && scrollContainerRef.current) {
          const containerTop = scrollContainerRef.current.scrollTop;
          const containerHeight = scrollContainerRef.current.clientHeight;
          const elementTop = itemElement.offsetTop;
          const elementHeight = itemElement.offsetHeight;

          // Check if element is not fully visible
          if (
            elementTop < containerTop ||
            elementTop + elementHeight > containerTop + containerHeight
          ) {
            scrollContainerRef.current.scrollTo({
              top: elementTop - 45, // 40px padding from top
              behavior: "smooth",
            });
          }
        }
      }, 150);
    }
  }, []);

  // Auto-scroll when items are added or updated
  useEffect(() => {
    const currentOrderCount = currentOrder.length;

    // New item added - scroll to bottom
    if (currentOrderCount > prevOrderCount && scrollContainerRef.current) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 150);
    }
    // Existing item updated - find which item changed and scroll to it
    else if (currentOrderCount === prevOrderCount && currentOrderCount > 0) {
      for (let i = 0; i < currentOrder.length; i++) {
        const currentItem = currentOrder[i];
        const prevItem = prevOrderItemsRef.current[i];

        if (
          prevItem &&
          (currentItem.qty !== prevItem.qty ||
            JSON.stringify(currentItem.status) !==
              JSON.stringify(prevItem.status) ||
            currentItem.totalAmount !== prevItem.totalAmount)
        ) {
          scrollToItem(i);
          break;
        }
      }
    }

    setPrevOrderCount(currentOrderCount);
    prevOrderItemsRef.current = [...currentOrder];
  }, [currentOrder, prevOrderCount, scrollToItem]);
  const allowSendToKitchen = currentOrder.reduce(
    (a, b) => a + (b.status?.find((f) => f.status === "pending")?.qty || 0),
    0,
  );
  const allowServeItems = currentOrder.reduce(
    (a, b) => a + (b.status?.find((f) => f.status === "cooking")?.qty || 0),
    0,
  );

  const renderServedType = () => {
    if (currentTable?.orders?.servedType === "dine_in") {
      return (
        <>
          <Utensils /> Dine In
        </>
      );
    } else if (currentTable?.orders?.servedType === "take_away") {
      return (
        <>
          <ShoppingBag /> Take Away
        </>
      );
    } else {
      return (
        <>
          <Truck /> Delivery
        </>
      );
    }
  };

  return (
    <>
      <div style={{ height: height - 65 }} className="hidden md:block">
        {/* Desktop Cart Sidebar - More Compact */}
        <div
          ref={scrollContainerRef}
          className="w-[350px] lg:w-[400px] p-0 hidden md:block overflow-y-auto bg-white border-l border-gray-200 shadow-lg"
          style={{ height: height - 65 }}
        >
          {/* Compact Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 p-3 z-10">
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {currentTable?.orders?.items.length || 0} items
                </span>
              </div>
              <div className="flex gap-2">
                {currentTable?.orders?.invoiceNo ? (
                  <div>
                    <Button
                      size={"sm"}
                      disabled={
                        !currentTable?.orders?.invoiceNo || loading || isRequest
                      }
                      className={cn(
                        "w-full text-sm font-semibold",
                        currentTable?.orders?.servedType === "dine_in"
                          ? "bg-red-600 hover:bg-red-700"
                          : "",
                        currentTable?.orders?.servedType === "take_away"
                          ? "bg-orange-600 hover:bg-orange-700"
                          : "",
                        currentTable?.orders?.servedType === "food_delivery"
                          ? "bg-green-600 hover:bg-green-700"
                          : "",
                      )}
                      onClick={async () => {
                        await restaurantCustomFoodDelivery.show({
                          currentTable,
                        });
                      }}
                    >
                      {renderServedType()}
                    </Button>
                  </div>
                ) : (
                  <></>
                )}
                <div>
                  <Button
                    className="w-full text-sm font-semibold"
                    disabled={
                      !currentTable?.orders?.invoiceNo || loading || isRequest
                    }
                    size={"sm"}
                    onClick={async () => {
                      await restartCustomCustomer.show({
                        customer: currentTable?.orders?.customer || 0,
                        table: currentTable?.tables,
                        id: currentTable?.orders?.orderId,
                      });
                    }}
                  >
                    <PersonStanding className="h-4 w-4" /> (
                    {currentTable?.orders?.customer || 0})
                  </Button>
                </div>
                <div>
                  {canUpdateStatus && (
                    <Button
                      onClick={() => {
                        if (currentTable?.tables) {
                          sendAllToKitchent(currentTable.tables);
                        }
                      }}
                      className="w-full text-sm font-semibold bg-orange-600 hover:bg-orange-700"
                      disabled={
                        allowSendToKitchen === 0 || loading || isRequest
                      }
                      size={"sm"}
                    >
                      <CookingPot className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div>
                  <Button
                    onClick={() => {
                      if (currentTable?.tables) {
                        serverAllItems(currentTable.tables);
                      }
                    }}
                    className="w-full text-sm font-semibold bg-emerald-600 hover:bg-emerald-700"
                    disabled={allowServeItems === 0 || loading || isRequest}
                    size={"sm"}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {currentOrder.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ChefHat className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">No items added yet</p>
              <p className="text-gray-400 text-xs">Add items from the menu</p>
            </div>
          ) : (
            <div className="space-y-2 p-3 pb-20">
              {currentOrder.map((item, index) => (
                <div key={index} data-item-index={index}>
                  <RestaurantItem item={item} idx={index} {...props} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom of screen */}
        <div className="fixed bottom-0 right-0 w-[350px] lg:w-[400px] bg-white border-t border-gray-200 p-3 shadow-lg z-50">
          {/* Compact Action Buttons */}
          <div className="flex flex-row gap-2 items-center">
            <div>
              <DeleteOrderButton
                tableKey={params.get("table") || ""}
                permissionKey={props.allowDelete}
              />
            </div>
            <div>
              <Button
                onClick={() => {
                  if (currentTable?.tables && currentTable.orders?.orderId) {
                    setOrderPrintTime(currentTable.tables).then(() => {
                      setPrintingOrder(
                        `${currentTable.orders?.orderId}@stay` || "",
                      );
                    });
                  }
                }}
                className="w-full text-sm font-semibold"
                disabled={currentOrder.length === 0 || loading || isRequest}
                size={"sm"}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <Button
                onClick={async () => {
                  if (currentTable?.tables) {
                    const transfer = await transferTable.show({
                      data: currentTable,
                    });
                    if (transfer) {
                      onRefetch?.();
                      router.push(`${pathname}`);
                    }
                  }
                }}
                className="w-full text-sm font-semibold"
                disabled={currentOrder.length === 0 || loading || isRequest}
                size={"sm"}
              >
                <ReplaceAll className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <Button
                onClick={async () => {
                  if (currentTable?.tables) {
                    const res = await restaurantDiscountSheet.show({
                      orderId: currentTable.orders?.orderId,
                      table: currentTable,
                    });
                    if (res) {
                    }
                  }
                }}
                className="w-full text-sm font-semibold"
                disabled={currentOrder.length === 0 || loading || isRequest}
                size={"sm"}
              >
                <Percent className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-full">
              <RestaurantCheckout />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
