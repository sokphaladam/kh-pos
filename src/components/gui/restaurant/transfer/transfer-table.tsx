import { useTransferOrderTable } from "@/app/hooks/use-query-table";
import { TransferProp } from "@/classes/transfer-order-table";
import { createSheet } from "@/components/create-sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { table_restaurant_tables } from "@/generated/tables";
import { cn } from "@/lib/utils";
import { AlertCircle, ArrowRight, Info } from "lucide-react";
import { useMemo, useState } from "react";
import {
  RestaurantOrderItem,
  RestaurantTable,
  useRestaurant,
} from "../contexts/restaurant-context";
import { useRestaurantActions } from "../hooks/use-restaurant-actions";
import { TransferTableOrderInfo } from "./transfer-table-order-info";

export interface TransferItem extends RestaurantOrderItem {
  selectedQtyByStatus: {
    pending: number;
    cooking: number;
    served: number;
  };
  selectedQty: number; // Total selected quantity (computed)
}

interface SelectedTable extends table_restaurant_tables {
  hasOrder: boolean;
}

export const transferTable = createSheet<{ data: RestaurantTable }, unknown>(
  ({ data, close }) => {
    const { transferTable } = useRestaurantActions();
    const { state, loading } = useRestaurant();
    const [selectedTable, setSelectedTable] = useState<SelectedTable | null>(
      null,
    );
    const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { trigger: triggerTransferOrder, isMutating: isTransferring } =
      useTransferOrderTable();

    // Initialize transfer items from the order
    useState(() => {
      if (data.orders?.items) {
        const items: TransferItem[] = data.orders.items.map((item) => {
          return {
            ...item,
            selectedQtyByStatus: {
              pending:
                item.status?.find((s) => s.status === "pending")?.qty || 0,
              cooking:
                item.status?.find((s) => s.status === "cooking")?.qty || 0,
              served: item.status?.find((s) => s.status === "served")?.qty || 0,
            },
            selectedQty: item.status?.reduce((a, b) => a + b.qty, 0) || 0, // Start with no items selected
          };
        });
        setTransferItems(items);
      }
    });

    // Available tables for transfer (excluding current table)
    const availableTables = useMemo(() => {
      return state.tables
        .filter((table) => table.id !== data.tables?.id)
        .map((table) => {
          const activeTable = state.activeTables.find(
            (at) => at.tables?.id === table.id,
          );
          return {
            ...table,
            hasOrder: !!activeTable?.orders,
          };
        })
        .sort((a, b) => a.table_name.localeCompare(b.table_name));
    }, [state.tables, state.activeTables, data.tables?.id]);

    // Calculate transfer type and validation
    const transferInfo = useMemo(() => {
      if (!selectedTable) return null;

      const hasSelectedItems = transferItems.some(
        (item) => item.selectedQty > 0,
      );
      const isFullTransfer = transferItems.every(
        (item) => item.selectedQty === item.qty,
      );
      const isPartialTransfer = transferItems.some(
        (item) => item.selectedQty > 0 && item.selectedQty < item.qty,
      );

      let transferType: "transfer" | "split" | "merge" = "transfer";
      if (selectedTable.hasOrder) {
        transferType = "merge";
      } else if (isPartialTransfer) {
        transferType = "split";
      }

      return {
        type: transferType,
        isValid: hasSelectedItems && selectedTable,
        selectedItemsCount: transferItems.filter((item) => item.selectedQty > 0)
          .length,
        totalItems: transferItems.length,
        isFullTransfer,
      };
    }, [selectedTable, transferItems]);

    // Handle transfer execution
    const handleTransfer = async () => {
      if (!transferInfo?.isValid || !selectedTable) return;

      setIsLoading(true);
      setError(null);
      try {
        // Validation
        const selectedItems = transferItems.filter(
          (item) => item.selectedQty > 0,
        );
        if (selectedItems.length === 0) {
          setError("Please select at least one item to transfer");
          return;
        }

        // Validate quantities
        const invalidItems = selectedItems.filter(
          (item) => item.selectedQty > item.qty || item.selectedQty <= 0,
        );
        if (invalidItems.length > 0) {
          setError(
            "Invalid quantities selected. Please check your selections.",
          );
          return;
        }

        const transferData: TransferProp = {
          sourceTableId: data.tables?.id || "",
          orderId: data.orders?.orderId || "",
          orderItems: selectedItems.map((item) => ({
            orderItemId: item.orderDetailId,
            variantId: item.variantId,
            orderItemStatuses: (item.status || [])
              .map((s) => ({
                status: s.status as
                  | "pending"
                  | "cooking"
                  | "ready"
                  | "served"
                  | "cancelled",
                quantity: Math.min(
                  s.qty,
                  item.selectedQtyByStatus[
                    s.status as keyof typeof item.selectedQtyByStatus
                  ],
                ),
              }))
              .filter((f) => f.quantity > 0),
          })),
          destinationTableId: selectedTable.id,
        };

        triggerTransferOrder(transferData).then((res) => {
          if (res.success) {
            transferTable(
              data.tables!,
              selectedTable,
              data.orders?.orderId || "",
              selectedItems.map((item) => ({
                ...item,
                status: (item.status || []).map((s) => ({
                  ...s,
                  qty: Math.min(
                    s.qty,
                    item.selectedQtyByStatus[
                      s.status as keyof typeof item.selectedQtyByStatus
                    ],
                  ),
                })),
              })),
              data.orders!,
            );
            close(true);
          }
        });
      } catch (error) {
        console.error("Transfer error:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        );
      } finally {
        setIsLoading(false);
      }
    };

    const getTableStatusBadge = (status: string, hasOrder: boolean) => {
      if (hasOrder) {
        return (
          <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
            Occupied
          </Badge>
        );
      }

      switch (status) {
        case "available":
          return (
            <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
              Available
            </Badge>
          );
        case "cleaning":
          return (
            <Badge variant="default" className="bg-rose-500 hover:bg-rose-600">
              Cleaning
            </Badge>
          );
        case "order_taken":
          return (
            <Badge
              variant="default"
              className="bg-amber-500 hover:bg-amber-600"
            >
              Occupied
            </Badge>
          );
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    };

    const getTransferTypeDescription = () => {
      if (!transferInfo) return "";

      switch (transferInfo.type) {
        case "transfer":
          return "Move entire order to an empty table";
        case "split":
          return "Split selected items to a new table";
        case "merge":
          return "Add selected items to an occupied table";
        default:
          return "";
      }
    };

    return (
      <>
        <SheetHeader className="pb-2 border-b">
          <SheetTitle className="flex flex-col sm:flex-row sm:items-center gap-1 text-left text-base">
            <span className="truncate">
              Transfer Order from {data.tables?.table_name}
            </span>
            <ArrowRight className="h-3 w-3 hidden sm:block flex-shrink-0" />
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-hidden">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Current Order Summary */}
          <TransferTableOrderInfo
            data={data}
            setTransferItems={setTransferItems}
            transferItems={transferItems}
          />

          {/* Table Selection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Select Destination Table
              </CardTitle>
              <CardDescription className="text-xs">
                Choose where to transfer the selected items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-36">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pr-2">
                  {availableTables.map((table) => (
                    <div
                      key={table.id}
                      className={cn(
                        "border rounded-lg p-2 cursor-pointer transition-all hover:border-primary hover:shadow-sm",
                        selectedTable?.id === table.id &&
                          "border-primary bg-primary/5 shadow-sm",
                      )}
                      onClick={() => setSelectedTable(table)}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-xs truncate">
                            {table.table_name}
                          </div>
                          {getTableStatusBadge(
                            table.status as string,
                            table.hasOrder,
                          )}
                        </div>
                        {selectedTable?.id === table.id && (
                          <div className="text-xs text-primary font-medium">
                            ✓ Selected
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Transfer Preview */}
          {transferInfo && selectedTable && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Transfer Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      <strong>
                        {transferInfo.type.charAt(0).toUpperCase() +
                          transferInfo.type.slice(1)}{" "}
                        Transfer:
                      </strong>{" "}
                      {getTransferTypeDescription()}
                    </AlertDescription>
                  </Alert>

                  {!transferInfo.isValid && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        Please select items and a destination table to proceed.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="bg-blue-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-blue-600">
                        {transferInfo.selectedItemsCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Items Selected
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-green-600 truncate">
                        {selectedTable.table_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Destination
                      </div>
                    </div>
                  </div>

                  {transferInfo.type === "merge" && (
                    <Alert>
                      <Info className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        Items will be added to the existing order on{" "}
                        <strong>{selectedTable.table_name}</strong>.
                      </AlertDescription>
                    </Alert>
                  )}

                  {transferInfo.type === "split" && (
                    <Alert>
                      <Info className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        A new order will be created on{" "}
                        <strong>{selectedTable.table_name}</strong> with the
                        selected items. Remaining items will stay on the current
                        table.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <SheetFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
          <Button
            variant="outline"
            onClick={close}
            className="w-full sm:w-auto h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={
              !transferInfo?.isValid || isLoading || loading || isTransferring
            }
            className="w-full sm:w-auto sm:min-w-28 h-8 text-xs"
          >
            {isLoading || loading || isTransferring ? (
              <div className="flex items-center gap-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                <span className="hidden sm:inline">Processing...</span>
                <span className="sm:hidden">Wait...</span>
              </div>
            ) : (
              <span className="truncate">
                Transfer {transferInfo?.selectedItemsCount || 0} Item
                {(transferInfo?.selectedItemsCount || 0) !== 1 ? "s" : ""}
              </span>
            )}
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: null },
);
