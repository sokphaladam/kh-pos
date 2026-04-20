import { createSheet } from "@/components/create-sheet";
import { Button } from "@/components/ui/button";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useWindowSize } from "@/components/use-window-size";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { usePermission } from "@/hooks/use-permissions";
import { Check, CookingPot, PersonStanding } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { RestaurantTable, useRestaurant } from "./contexts/restaurant-context";
import { useRestaurantActions } from "./hooks/use-restaurant-actions";
import { RestaurantItem } from "./item/restaurant-item";
import { useMemo } from "react";
import { restartCustomCustomer } from "./custom-order/restaurant-custom-customer";

export const RestaurantSummarySheet = createSheet<
  WithLayoutPermissionProps & { table?: RestaurantTable },
  unknown
>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ close, ...rest }) => {
    const { state, loading, isRequest } = useRestaurant();
    const params = useSearchParams();
    const { height } = useWindowSize();
    const { sendAllToKitchent, serverAllItems } = useRestaurantActions();
    const orderPreparationPermissions = usePermission("order-preparation");
    const canUpdateStatus = orderPreparationPermissions.includes("update");

    const currentTable = state.activeTables.find(
      (t) => t.tables?.id === params.get("table") || ""
    );
    const currentOrder = useMemo(
      () => currentTable?.orders?.items || [],
      [currentTable?.orders?.items]
    );
    const allow = currentOrder.reduce(
      (a, b) => a + (b.status?.find((f) => f.status === "pending")?.qty || 0),
      0
    );
    const allowServeItems = currentOrder.reduce(
      (a, b) => a + (b.status?.find((f) => f.status === "cooking")?.qty || 0),
      0
    );
    return (
      <>
        <SheetHeader>
          <SheetTitle>
            <div className="sticky top-0 p-3 z-10">
              <div
                suppressHydrationWarning
                className="flex items-center justify-between"
              >
                <h3 className="font-semibold text-base text-gray-800">
                  Order Summary
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {currentTable?.orders?.items.length || 0} items
                </span>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div
          style={{ height: height }}
          className="flex flex-col justify-between"
        >
          <div
            style={{ height: height - 190 }}
            className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto relative"
          >
            {currentOrder.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500 text-center">No items added yet</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {currentOrder.map((item, index) => (
                    <div key={index} data-item-index={index}>
                      <RestaurantItem
                        key={index}
                        item={item}
                        idx={index}
                        {...rest}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Fixed Bottom Section */}
          <div className="space-y-3 text-base sticky bottom-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-4 z-10">
            <div className="flex flex-row gap-2 items-center justify-center">
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
                        sendAllToKitchent(currentTable?.tables);
                      }
                    }}
                    className="w-full text-sm font-semibold bg-orange-600 hover:bg-orange-700"
                    disabled={allow === 0 || loading || isRequest}
                    size={"sm"}
                  >
                    <CookingPot className="h-4 w-4" />
                    Send to Kitchen
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
      </>
    );
  },
  { defaultValue: null }
);
