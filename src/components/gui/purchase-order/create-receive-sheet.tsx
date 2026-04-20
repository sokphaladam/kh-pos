"use client";
import { createSheet } from "@/components/create-sheet";
import { Button } from "@/components/ui/button";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LoaderIcon, Package, Truck, CheckCircle2 } from "lucide-react";
import {
  useQueryPurchaseOrderDetails,
  useUpdatePurchaseOrder,
  useReceivePurhcaseOrder,
} from "@/app/hooks/use-query-purchase-order";
import { createDialog } from "@/components/create-dialog";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReceiveItemsSheetProps } from "./types";
import { useReceiveForm } from "./use-receive-form";
import { BulkActionsSection } from "./bulk-actions-section";
import { ItemsTable } from "./items-table";
import {
  SupplierPurchaseOrderDetail,
  SupplierPurchaseOrderInput,
} from "@/classes/purchase-order-service";
import { toast } from "sonner";
import { ReceivedItem } from "@/classes/receive-po";

function ReceiveItemsSheetComponent({
  purchaseOrderId,
  onReceiveItems,
  close,
}: ReceiveItemsSheetProps) {
  const { data: purchaseOrderData, isLoading: isLoadingPO } =
    useQueryPurchaseOrderDetails(purchaseOrderId);

  const { trigger: receiveItems, isMutating: isReceiving } =
    useReceivePurhcaseOrder();

  const items = purchaseOrderData?.items || [];

  const {
    formState,
    sortedItems,
    itemsByStatus,
    setSelectedItems,
    setGlobalSlot,
    setGlobalExpiry,
    setSortDirection,
    handleGlobalApply,
    handleGlobalSlotApply,
    handleItemToggle,
    handleDataChange,
    handleSubmit,
  } = useReceiveForm(items);

  const handleReceiveSubmit = async () => {
    try {
      // Get the validated items from the form hook
      const validItems = await handleSubmit();

      if (!validItems || validItems.length === 0) {
        return; // Validation failed, error already shown
      }

      // Call the API
      const result = await receiveItems({
        purchaseOrderId,
        receivedItems: validItems,
      });

      if (result.success) {
        toast.success("Items received successfully");
        onReceiveItems(validItems);
        close();
      } else {
        toast.error("Failed to receive items");
      }
    } catch (error) {
      console.error("Error receiving items:", error);
      toast.error("An error occurred while receiving items");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set<string>();
      sortedItems.forEach((item) => {
        const maxQty = (item.qty || 0) - (item.receivedQty || 0);
        if (maxQty > 0) {
          newSelected.add(item.id || "");
        }
      });
      setSelectedItems(newSelected);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSortChange = () => {
    setSortDirection((current) => {
      if (current === null) return "asc";
      if (current === "asc") return "desc";
      return null;
    });
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="bg-blue-100 p-2 rounded-lg self-start sm:self-center">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-semibold">Receive Purchase Order</div>
            <div className="text-sm text-gray-500 font-normal">
              <span className="block sm:inline">
                {itemsByStatus.pending.length} pending
              </span>
              <span className="hidden sm:inline"> • </span>
              <span className="block sm:inline">
                {itemsByStatus.partial.length} partial
              </span>
              <span className="hidden sm:inline"> • </span>
              <span className="block sm:inline">
                {itemsByStatus.completed.length} completed
              </span>
            </div>
          </div>
        </SheetTitle>
      </SheetHeader>

      {isLoadingPO ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <LoaderIcon className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <div className="text-sm text-gray-500">
              Loading purchase order details...
            </div>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Package className="w-12 h-12 mx-auto text-gray-400" />
            <div className="text-sm text-gray-500">
              No items found in this purchase order
            </div>
            <Button variant="outline" onClick={close} disabled={isReceiving}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 py-6">
          <BulkActionsSection
            selectedItems={formState.selectedItems}
            globalSlot={formState.globalSlot}
            globalExpiry={formState.globalExpiry}
            onGlobalSlotChange={setGlobalSlot}
            onGlobalExpiryChange={setGlobalExpiry}
            onGlobalSlotApply={handleGlobalSlotApply}
            onGlobalExpiryApply={(date) => handleGlobalApply("expiredAt", date)}
            disabled={isReceiving}
          />

          <ItemsTable
            items={sortedItems}
            selectedItems={formState.selectedItems}
            receiveData={formState.receiveData}
            showAdvanced={formState.showAdvanced}
            sortDirection={formState.sortDirection}
            onSelectAll={handleSelectAll}
            onSortChange={handleSortChange}
            onItemToggle={handleItemToggle}
            onDataChange={handleDataChange}
          />
        </div>
      )}

      <SheetFooter className="flex-col sm:flex-row gap-3 pt-6 border-t bg-gray-50/50">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:flex-1">
          <Button
            variant="outline"
            onClick={close}
            className="w-full sm:w-auto"
            disabled={isReceiving}
          >
            Cancel
          </Button>

          {/* Cancel Remaining Items button */}
          {itemsByStatus.pending.length > 0 && (
            <Button
              variant="destructive"
              onClick={async () => {
                if (!purchaseOrderData) {
                  toast.error("Purchase order data is not available");
                  return;
                }

                const res = await cancelPurchaseOrderDialog.show({
                  data: purchaseOrderData,
                });

                if (res) {
                  close();
                }
              }}
              className="font-medium shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto"
              disabled={isReceiving}
            >
              Cancel Remaining Items
            </Button>
          )}
        </div>

        <Button
          onClick={handleReceiveSubmit}
          disabled={
            formState.selectedItems.size === 0 || isLoadingPO || isReceiving
          }
          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto sm:flex-1"
        >
          {isReceiving ? (
            <>
              <LoaderIcon className="w-4 h-4 animate-spin mr-2" />
              Receiving...
            </>
          ) : isLoadingPO ? (
            <>
              <LoaderIcon className="w-4 h-4 animate-spin mr-2" />
              Loading...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Receive {formState.selectedItems.size} Item
              {formState.selectedItems.size !== 1 ? "s" : ""}
            </>
          )}
        </Button>
      </SheetFooter>
    </>
  );
}

// Cancel Purchase Order Dialog
const cancelPurchaseOrderDialog = createDialog<
  {
    data: SupplierPurchaseOrderDetail;
  },
  boolean
>(({ close, data }) => {
  const { trigger: updatePurchaseOrder, isMutating } = useUpdatePurchaseOrder();

  const onCancelRemainingItem = async () => {
    if (!data?.id) {
      toast.error("Purchase order ID is missing");
      return;
    }

    try {
      const input: SupplierPurchaseOrderInput = {
        ...data,
        status: "completed", // Mark PO as completed when all items are cancelled
        createdAt: data?.createdAt ? data.createdAt : null,
        updatedAt: data?.updatedAt ? data.updatedAt : null,
        purchasedAt: data?.purchasedAt ? data.purchasedAt : null,
        expectedAt: data?.expectedAt ? data.expectedAt : null,
        items: data.items?.map((item) => ({
          ...item,
          status: "cancelled", // Cancel all remaining items
        })),
      };

      const result = await updatePurchaseOrder(input);

      if (result.success) {
        toast.success("All remaining items have been cancelled successfully");
        close(true);
      } else {
        toast.error("Failed to cancel remaining items");
      }
    } catch (error) {
      console.error("Error cancelling remaining items:", error);
      toast.error("An error occurred while cancelling items");
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cancel All Remaining Items</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <p className="text-sm text-gray-600">
          Are you sure you want to cancel all remaining items in this purchase
          order?
        </p>
        <p className="text-xs text-gray-500 mt-2">
          This action cannot be undone. All pending items will be marked as
          cancelled.
        </p>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => close(false)}
          disabled={isMutating}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={onCancelRemainingItem}
          disabled={isMutating}
        >
          {isMutating ? (
            <>
              <LoaderIcon className="w-4 h-4 animate-spin mr-2" />
              Cancelling...
            </>
          ) : (
            "Yes, Cancel All"
          )}
        </Button>
      </DialogFooter>
    </>
  );
});

export const createReceiveSheet = createSheet<
  {
    purchaseOrderId: string;
    onReceiveItems: (receivedItems: ReceivedItem[]) => void;
  },
  void
>(ReceiveItemsSheetComponent);
