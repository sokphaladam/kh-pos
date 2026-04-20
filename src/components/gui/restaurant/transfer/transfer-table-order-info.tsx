import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { produce } from "immer";
import { RestaurantTable } from "../contexts/restaurant-context";
import { TransferItem } from "./transfer-table";
import { TransferTableOrderItem } from "./transfer-table-order-item";

export function TransferTableOrderInfo({
  data,
  transferItems,
  setTransferItems,
}: {
  data: RestaurantTable;
  transferItems: TransferItem[];
  setTransferItems: (v: TransferItem[]) => void;
}) {
  // Handle quantity change for an item by status
  const handleQuantityChangeByStatus = (
    orderDetailId: string,
    status: "pending" | "cooking" | "served",
    newQty: number
  ) => {
    setTransferItems(
      produce(transferItems, (draft) => {
        draft.forEach((item) => {
          if (item.orderDetailId === orderDetailId) {
            const availableQty =
              item.status?.find((s) => s.status === status)?.qty || 0;
            item.selectedQtyByStatus[status] = Math.max(
              0,
              Math.min(newQty, availableQty)
            );

            // Update total selected quantity
            item.selectedQty =
              item.selectedQtyByStatus.pending +
              item.selectedQtyByStatus.cooking +
              item.selectedQtyByStatus.served;
          }
        });
      })
    );
  };

  // Handle select all/none
  const handleSelectAll = (selectAll: boolean) => {
    setTransferItems(
      produce(transferItems, (draft) => {
        draft.forEach((item) => {
          if (selectAll) {
            // Select all available quantities by status
            const pendingQty =
              item.status?.find((s) => s.status === "pending")?.qty || 0;
            const cookingQty =
              item.status?.find((s) => s.status === "cooking")?.qty || 0;
            const servedQty =
              item.status?.find((s) => s.status === "served")?.qty || 0;

            item.selectedQtyByStatus = {
              pending: pendingQty,
              cooking: cookingQty,
              served: servedQty,
            };
            item.selectedQty = pendingQty + cookingQty + servedQty;
          } else {
            // Clear all selections
            item.selectedQtyByStatus = {
              pending: 0,
              cooking: 0,
              served: 0,
            };
            item.selectedQty = 0;
          }
        });
      })
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Current Order</CardTitle>
        <CardDescription className="text-xs">
          Invoice #{data.orders?.invoiceNo} • {transferItems.length} items
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <Label className="text-xs font-medium">
            Select items to transfer:
          </Label>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(true)}
              className="text-xs h-7 px-2"
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(false)}
              className="text-xs h-7 px-2"
            >
              Clear All
            </Button>
          </div>
        </div>

        <div className="space-y-2 pr-2">
          {transferItems.map((item) => {
            return (
              <TransferTableOrderItem
                key={item.orderDetailId}
                item={item}
                handleQuantityChangeByStatus={handleQuantityChangeByStatus}
                handleSelectAll={(checked) => {
                  setTransferItems(
                    produce(transferItems, (draft) => {
                      draft.forEach((d) => {
                        if (d.orderDetailId === item.orderDetailId) {
                          console.log(checked);
                          if (!checked) {
                            d.selectedQtyByStatus = {
                              pending: 0,
                              cooking: 0,
                              served: 0,
                            };
                            d.selectedQty = 0;
                          } else {
                            d.selectedQtyByStatus = {
                              pending:
                                item.status?.find((s) => s.status === "pending")
                                  ?.qty || 0,
                              cooking:
                                item.status?.find((s) => s.status === "cooking")
                                  ?.qty || 0,
                              served:
                                item.status?.find((s) => s.status === "served")
                                  ?.qty || 0,
                            };
                            d.selectedQty =
                              item.status?.reduce((a, b) => a + b.qty, 0) || 0;
                          }
                        }
                      });
                    })
                  );
                }}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
