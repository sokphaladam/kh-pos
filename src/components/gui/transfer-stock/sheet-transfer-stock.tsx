"use client";
import { Order } from "@/classes/order";
import { createSheet } from "@/components/create-sheet";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQueryOrder, useQueryPOSInfo } from "@/app/hooks/use-query-order";
import { useQueryReplenishmentPickingList } from "@/app/hooks/use-query-replenishment";
import { useCallback, useEffect, useRef } from "react";
import { useMutationTransferInventory } from "@/app/hooks/use-invetory";
import { useAuthentication } from "contexts/authentication-context";
import { toast } from "sonner";
import { useCommonDialog } from "@/components/common-dialog";
import { useConvertVariantUnit } from "@/app/hooks/use-unit-conversion";
import { StockActionList } from "./stock-action-list";
import { Package } from "lucide-react";
import { FindProductInSlotResult } from "@/classes/find-product-in-slot";
import { ProductVariantType } from "@/dataloader/product-variant-loader";

// Conversion Data interface (simplified for the new structure)
interface ConversionData {
  variant: ProductVariantType | null;
  qty: number;
  todoType: string;
  breakdownStockInfo?: FindProductInSlotResult["breakdownStockInfo"];
  repackStockInfo?: FindProductInSlotResult["repackStockInfo"];
  convertStockInfo?: FindProductInSlotResult["breakdownStockInfo"];
}

// Helper function to map FindProductInSlotResult to ConversionData
function mapToConversionData(item: FindProductInSlotResult): ConversionData {
  return {
    variant: item.variant,
    qty: item.qty,
    todoType: item.todoType || "",
    breakdownStockInfo: item.breakdownStockInfo,
    repackStockInfo: item.repackStockInfo,
    convertStockInfo: item.breakdownStockInfo || item.repackStockInfo || [],
  };
}

interface Props {
  item: Order;
}

export const SheetTransferStock = createSheet<Props, unknown>(
  ({ item }) => {
    const { showDialog } = useCommonDialog();
    const { currentWarehouse } = useAuthentication();
    const { isLoading, mutate } = useQueryOrder(item.orderId);
    const [getPickingList, res] = useQueryReplenishmentPickingList(
      "new",
      item.items?.map((x) => {
        return {
          variantId: x.variantId,
          toFindQty: x.qty,
        };
      }),
      0,
      1
    );
    const posInfo = useQueryPOSInfo(currentWarehouse?.id || "");
    const { trigger } = useMutationTransferInventory();
    const { trigger: convertUnit } = useConvertVariantUnit();
    const lastOrderIdRef = useRef<string | null>(null);

    // Call getPickingList when sheet opens or when order changes
    useEffect(() => {
      // Only call if this is a new order or first time
      if (lastOrderIdRef.current !== item.orderId) {
        getPickingList();
        lastOrderIdRef.current = item.orderId;
      }
    }, [item.orderId, getPickingList]);

    const onClickConvert = useCallback(
      async (conversionItem: FindProductInSlotResult) => {
        const conversionData = mapToConversionData(conversionItem);

        // Validate conversion data based on todoType
        if (conversionData.todoType === "MIXED") {
          if (
            (!conversionData.breakdownStockInfo ||
              conversionData.breakdownStockInfo.length === 0) &&
            (!conversionData.repackStockInfo ||
              conversionData.repackStockInfo.length === 0)
          ) {
            toast.error(
              "Invalid conversion data - no breakdown or repack stock information"
            );
            return;
          }
        } else {
          // Legacy validation for BREAK/REPACK
          if (
            !conversionData.convertStockInfo ||
            conversionData.convertStockInfo.length === 0
          ) {
            toast.error(
              "Invalid conversion data - no source stock information"
            );
            return;
          }
        }

        // Prepare conversion input based on the new schema
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

        try {
          const result = await convertUnit(conversionInput);
          if (result.success) {
            let sourceDescription = "";

            if (conversionData.todoType === "MIXED") {
              const breakdownSources =
                conversionData.breakdownStockInfo
                  ?.map((s) => s.variant?.name || "unknown")
                  .join(", ") || "";
              const repackSources =
                conversionData.repackStockInfo
                  ?.map((s) => s.variant?.name || "unknown")
                  .join(", ") || "";
              sourceDescription = `breakdown: ${breakdownSources}, repack: ${repackSources}`;
            } else {
              sourceDescription =
                conversionData.convertStockInfo
                  ?.map((s) => s.variant?.name || "unknown")
                  .join(", ") || "sources";
            }

            const targetVariantName = conversionData.variant?.name || "variant";

            toast.success(
              `Successfully converted ${conversionData.qty} units from ${sourceDescription} to ${targetVariantName}`
            );
            mutate();
            getPickingList(); // Refresh the picking list
          } else {
            toast.error("Conversion failed. Please try again.");
          }
        } catch (error: unknown) {
          // Handle different types of backend errors
          let errorMessage = "Failed to convert units";

          if (error && typeof error === "object" && "response" in error) {
            const responseError = error as {
              response: { data: { message?: string } };
            };
            if (responseError.response?.data?.message) {
              errorMessage = responseError.response.data.message;
            }
          } else if (error && typeof error === "object" && "message" in error) {
            const messageError = error as { message: string };
            errorMessage = messageError.message;
          } else if (typeof error === "string") {
            errorMessage = error;
          }

          toast.error(errorMessage);
          console.error("Conversion error:", error);
        }
      },
      [convertUnit, posInfo, mutate, getPickingList]
    );

    const onClickTransfer = useCallback(
      (transferItems: FindProductInSlotResult[]) => {
        const input = transferItems.map((x) => {
          return {
            currentSlotId: x.slot?.id || "",
            destinationSlotId: posInfo.data?.result?.posSlotId || "",
            qty: Number(x.qty),
            variantId: x.variant?.id || "",
            orderId: item.orderId,
          };
        });

        showDialog({
          title: "Transfer Confirmation",
          content: `Transfer ${transferItems.length} item(s) to POS?`,
          actions: [
            {
              text: "Transfer",
              onClick: async () => {
                for (const x of input) {
                  try {
                    const res = await trigger(x);
                    if (res.success) {
                      toast.success(
                        `Successfully transferred ${x.qty} units to POS`
                      );
                    }
                  } catch {
                    toast.error("Failed to transfer some items");
                  }
                }
                mutate();
                getPickingList();
              },
            },
          ],
        });
      },
      [trigger, posInfo, item.orderId, showDialog, mutate, getPickingList]
    );

    const allItems = res.data?.result || [];

    return (
      <>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Invoice #{item.invoiceNo} - Stock Transfer
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3">
          {isLoading && (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p>Loading stock information...</p>
            </div>
          )}

          {!isLoading && (
            <StockActionList
              items={allItems}
              onTransfer={onClickTransfer}
              onConvert={onClickConvert}
              showAvailable={true}
              showNoStock={true}
            />
          )}
        </div>
      </>
    );
  },
  { defaultValue: null }
);
