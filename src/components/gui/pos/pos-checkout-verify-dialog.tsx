import { useQueryPOSInfo } from "@/app/hooks/use-query-order";
import { createDialog } from "@/components/create-dialog";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthentication } from "contexts/authentication-context";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutationTransferInventory } from "@/app/hooks/use-invetory";
import { useConvertVariantUnit } from "@/app/hooks/use-unit-conversion";
import { FindProductInSlotResult } from "@/classes/find-product-in-slot";
import { toast } from "sonner";
import { StockActionList } from "../transfer-stock/stock-action-list";

interface Props {
  item: FindProductInSlotResult[];
  orderId: string;
  onRefresh?: () => Promise<FindProductInSlotResult[]>;
}

export const POSCheckoutVerifyDialog = createDialog<Props, unknown>(
  ({ item: initialItems, orderId, onRefresh, close }) => {
    const { currentWarehouse } = useAuthentication();
    const posInfo = useQueryPOSInfo(currentWarehouse?.id || "");
    const { trigger } = useMutationTransferInventory();
    const { trigger: convertUnit } = useConvertVariantUnit();
    const [items, setItems] = useState(initialItems);
    const [isProcessing, setIsProcessing] = useState(false);

    // Helper function to map FindProductInSlotResult to conversion format
    const mapToConversionData = (conversionItem: FindProductInSlotResult) => {
      return {
        variant: conversionItem.variant,
        qty: conversionItem.qty,
        todoType: conversionItem.todoType || "",
        breakdownStockInfo: conversionItem.breakdownStockInfo,
        repackStockInfo: conversionItem.repackStockInfo,
        convertStockInfo:
          conversionItem.breakdownStockInfo ||
          conversionItem.repackStockInfo ||
          [],
      };
    };

    const refreshItems = useCallback(async () => {
      if (onRefresh) {
        try {
          const newItems = await onRefresh();
          setItems(newItems);
          return newItems;
        } catch (error) {
          console.error("Failed to refresh items:", error);
          return items;
        }
      }
      return items;
    }, [onRefresh, items]);

    const onClickConvert = useCallback(
      async (conversionItem: FindProductInSlotResult) => {
        setIsProcessing(true);
        const conversionData = mapToConversionData(conversionItem);

        try {
          // Prepare conversion input
          const conversionInput = {
            destinationVariant: conversionData.variant?.id || "",
            sourceToBreak:
              conversionData.todoType === "MIXED"
                ? conversionData.breakdownStockInfo?.map((stockInfo) => ({
                    variantId: stockInfo.variant?.id || "",
                    slotId: stockInfo.slot?.id || "",
                    quantity: stockInfo.qty,
                  })) || []
                : conversionData.todoType === "BREAK"
                ? conversionData.convertStockInfo?.map((stockInfo) => ({
                    variantId: stockInfo.variant?.id || "",
                    slotId: stockInfo.slot?.id || "",
                    quantity: stockInfo.qty,
                  })) || []
                : [],
            sourceToRepack:
              conversionData.todoType === "MIXED"
                ? conversionData.repackStockInfo?.map((stockInfo) => ({
                    variantId: stockInfo.variant?.id || "",
                    slotId: stockInfo.slot?.id || "",
                    quantity: stockInfo.qty,
                  })) || []
                : conversionData.todoType === "REPACK"
                ? conversionData.convertStockInfo?.map((stockInfo) => ({
                    variantId: stockInfo.variant?.id || "",
                    slotId: stockInfo.slot?.id || "",
                    quantity: stockInfo.qty,
                  })) || []
                : [],
            destinationSlot: posInfo.data?.result?.posSlotId || "",
            conversionType: conversionData.todoType as
              | "BREAK"
              | "REPACK"
              | "MIXED",
            destinationQty: conversionData.qty,
          };

          const result = await convertUnit(conversionInput);
          if (result.success) {
            toast.success(`Successfully converted ${conversionData.qty} units`);

            // Refresh the items to see the updated status
            const refreshedItems = await refreshItems();

            // If no items need action anymore, close the dialog and proceed
            if (refreshedItems.length === 0) {
              toast.success("All items are now ready for checkout!");
              close(true);
            }
          } else {
            toast.error("Conversion failed. Please try again.");
          }
        } catch (error) {
          console.error("Conversion error:", error);
          toast.error("Failed to convert units");
        } finally {
          setIsProcessing(false);
        }
      },
      [convertUnit, posInfo, refreshItems, close]
    );

    const onClickTransfer = useCallback(
      async (transferItems: FindProductInSlotResult[]) => {
        setIsProcessing(true);
        const input = transferItems.map((x) => {
          return {
            currentSlotId: x.slot?.id || "",
            destinationSlotId: posInfo.data?.result?.posSlotId || "",
            qty: Number(x.qty),
            variantId: x.variant?.id || "",
            orderId: orderId,
          };
        });

        let completedTransfers = 0;
        const totalTransfers = input.length;

        for (const x of input || []) {
          try {
            const res = await trigger(x);
            if (res.success) {
              completedTransfers++;
              toast.success(
                `Transferred ${x.qty} units to POS (${completedTransfers}/${totalTransfers})`
              );
            }
          } catch {
            toast.error("Failed to transfer some items.");
          }
        }

        if (completedTransfers > 0) {
          // Refresh the items to see the updated status
          const refreshedItems = await refreshItems();

          // If no items need action anymore, close the dialog and proceed
          if (refreshedItems.length === 0) {
            toast.success("All items are now ready for checkout!");
            close(true);
          } else {
            toast.info(`${refreshedItems.length} items still need attention`);
          }
        }
        close(true);
        setIsProcessing(false);
      },
      [trigger, posInfo.data?.result?.posSlotId, orderId, refreshItems, close]
    );

    const totalActionableItems = items.filter(
      (x) =>
        x.todoType === "TRANSFER" ||
        ["BREAK", "REPACK", "MIXED"].includes(x.todoType || "")
    ).length;

    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Stock Verification Required
          </DialogTitle>
          <DialogDescription>
            {totalActionableItems > 0 ? (
              <>
                Some items require action before checkout. You can handle them
                now, or continue checkout to handle them later.
              </>
            ) : (
              "All actionable items have been resolved!"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          <StockActionList
            items={items}
            onTransfer={onClickTransfer}
            onConvert={onClickConvert}
            showAvailable={false}
            showNoStock={true}
            compact={true}
          />
        </div>

        <DialogFooter>
          <div className="flex flex-row justify-end gap-3 w-full">
            <Button
              onClick={() => close(true)}
              size="sm"
              variant="outline"
              disabled={isProcessing}
            >
              Continue Checkout
            </Button>

            <Button
              variant="secondary"
              onClick={() => close(null)}
              size="sm"
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
        </DialogFooter>
      </>
    );
  },
  { defaultValue: null }
);
