import { useUpdatePromotion } from "@/app/hooks/use-query-promotion";
import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MaterialInput } from "@/components/ui/material-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Percent, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RestaurantTable } from "./contexts/restaurant-context";
import { useRestaurantActions } from "./hooks/use-restaurant-actions";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

type DiscountType = "PERCENTAGE" | "AMOUNT";

export const restaurantDiscountSheet = createDialog<
  {
    orderId?: string;
    table?: RestaurantTable;
  },
  unknown
>(
  ({ orderId, table, close }) => {
    const { toast } = useToast();
    const router = useRouter();
    const { trigger: triggerUpdatePromotion, isMutating: isUpdatingPromotion } =
      useUpdatePromotion(orderId || "");
    const [discountType, setDiscountType] =
      useState<DiscountType>("PERCENTAGE");
    const [discountValue, setDiscountValue] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const { setDiscount } = useRestaurantActions();
    const { formatForDisplay, getSymbol } = useCurrencyFormat();

    useEffect(() => {
      if (!!loading) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const discounts: any[] = [];
        for (const item of table?.orders?.items || []) {
          const check = item.discounts?.find((f) => !!f.isManualDiscount);
          if (!!check) {
            discounts.push(check);
          } else {
            discounts.push({
              discountType: null,
              amount: 0,
              value: 0,
            });
          }
        }

        const allSameType = discounts.every(
          (f) => f.discountType === discounts[0].discountType,
        );

        if (allSameType) {
          setDiscountType(
            discounts[0].discountType || ("PERCENTAGE" as DiscountType),
          );
          if (discounts[0].discountType === "PERCENTAGE") {
            setDiscountValue(String(discounts[0].value));
          } else {
            const totalAmount = discounts.reduce(
              (a, b) => a + (b.amount || 0),
              0,
            );
            setDiscountValue(String(totalAmount));
          }
        }
        setLoading(false);
      }
    }, [loading, table?.orders?.items]);

    // Calculate totals from order items
    const orderTotals = useMemo(() => {
      if (!table?.orders?.items) {
        return { subtotal: 0, items: [] };
      }

      const items = table.orders.items.map((item) => {
        const itemSubtotal = Number(item.price) * Number(item.qty);
        return {
          orderDetailId: item.orderDetailId,
          subtotal: itemSubtotal,
          qty: item.qty,
          price: Number(item.price),
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

      return { subtotal, items };
    }, [table?.orders?.items]);

    // Calculate discount preview
    const discountPreview = useMemo(() => {
      const value = parseFloat(discountValue) || 0;

      if (value <= 0) {
        return null;
      }

      const itemsWithDiscount = orderTotals.items.map((item) => {
        let itemDiscount = 0;

        if (discountType === "PERCENTAGE") {
          // For percentage: apply % to each item
          itemDiscount = Math.floor(item.subtotal * value) / 100;
        } else {
          // For amount: distribute proportionally
          const proportion = item.subtotal / orderTotals.subtotal;
          itemDiscount = value * proportion;
        }

        return {
          ...item,
          discountAmount: itemDiscount,
          finalAmount: item.subtotal - itemDiscount,
        };
      });

      const totalDiscount = itemsWithDiscount.reduce(
        (sum, item) => sum + item.discountAmount,
        0,
      );

      return {
        items: itemsWithDiscount,
        totalDiscount,
        finalTotal: orderTotals.subtotal - totalDiscount,
      };
    }, [discountValue, discountType, orderTotals]);

    const handleApplyDiscount = async () => {
      const value = parseFloat(discountValue) || 0;

      // validation when value is less than or equal to zero
      if (value <= 0) {
        toast({
          title: "Invalid Discount",
          description: "Please enter a valid discount value",
          variant: "destructive",
        });
        return;
      }

      //  validation when no order found
      if (!orderId || !table?.orders?.items) {
        toast({
          title: "Error",
          description: "No order found",
          variant: "destructive",
        });
        return;
      }

      // validation for amount type exceeding subtotal
      if (discountType === "AMOUNT" && value > orderTotals.subtotal) {
        toast({
          title: "Invalid Amount",
          description: "Discount amount cannot exceed the order total",
          variant: "destructive",
        });
        return;
      }

      // validation for percentage type exceeding 100%
      if (discountType === "PERCENTAGE" && value > 100) {
        toast({
          title: "Invalid Percentage",
          description: "Discount percentage cannot exceed 100%",
          variant: "destructive",
        });
        return;
      }

      try {
        const data = table.orders.items.map((item) => {
          let itemDiscountValue = value;

          if (discountType === "AMOUNT") {
            // Calculate proportional discount for this item
            const itemSubtotal = Number(item.price) * Number(item.qty);
            const proportion = itemSubtotal / orderTotals.subtotal;
            itemDiscountValue = value * proportion;
          }

          return {
            itemId: item.orderDetailId,
            amount: itemDiscountValue,
            discountType: discountType,
          };
        });

        const result = await triggerUpdatePromotion(data);

        if (result.success) {
          for (const log of table.orders.items) {
            let itemDiscountValue = value;
            let itemDiscountAmount = 0;

            // Calculate the actual discount amount based on type
            const itemSubtotal = Number(log.price) * Number(log.qty);

            if (discountType === "AMOUNT") {
              // For AMOUNT: distribute proportionally
              const proportion = itemSubtotal / orderTotals.subtotal;
              itemDiscountValue = value * proportion;
              itemDiscountAmount = itemDiscountValue;
            } else {
              // For PERCENTAGE: apply percentage to item subtotal
              itemDiscountAmount = (itemSubtotal * value) / 100;
            }

            // Find if there's an existing manual discount
            const hasManualDiscount = log.discounts?.some(
              (x) => x.isManualDiscount,
            );

            const discounts = hasManualDiscount
              ? log.discounts?.map((x) => {
                  if (!!x.isManualDiscount) {
                    return {
                      ...x,
                      amount: itemDiscountAmount,
                      discountType: discountType,
                      value: itemDiscountValue,
                    };
                  }
                  return x;
                })
              : [
                  ...(log.discounts || []),
                  {
                    id: "manual",
                    discountId: "manual",
                    orderDetailId: log.orderDetailId,
                    name: "Manual Discount",
                    discountType: discountType,
                    value: itemDiscountValue,
                    isManualDiscount: true,
                    amount: itemDiscountAmount,
                  },
                ];

            if (table.tables) {
              setDiscount(table.tables, log.orderDetailId, discounts || []);
            }
          }
        }

        toast({
          title: "Success",
          description: "Discount applied successfully to all items",
        });

        // Refresh the page to update the order data
        router.refresh();

        close(true);
      } catch (error) {
        console.error("Error applying discount:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to apply discount",
          variant: "destructive",
        });
      } finally {
        setLoading(true);
      }
    };

    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Tag className="h-4 w-4" />
            <span>Discount Cart</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Discount Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Discount Type</Label>
            <RadioGroup
              value={discountType}
              onValueChange={(value) => setDiscountType(value as DiscountType)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PERCENTAGE" id="percentage" />
                <Label
                  htmlFor="percentage"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Percent className="h-4 w-4" />
                  Percentage
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="AMOUNT" id="amount" />
                <Label
                  htmlFor="amount"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {getSymbol()} Fixed Amount
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Discount Value Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {discountType === "PERCENTAGE"
                ? "Percentage (%)"
                : `Amount (${getSymbol()})`}
            </Label>
            <MaterialInput
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={
                discountType === "PERCENTAGE"
                  ? "Enter percentage"
                  : "Enter amount"
              }
              min="0"
              max={discountType === "PERCENTAGE" ? "100" : undefined}
              step={discountType === "PERCENTAGE" ? "1" : "0.01"}
            />
          </div>

          {/* Order Summary */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">
                {formatForDisplay(orderTotals.subtotal)}
              </span>
            </div>

            {discountPreview && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium text-red-600">
                    -{formatForDisplay(discountPreview.totalDiscount)}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">
                    {formatForDisplay(discountPreview.finalTotal)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Discount Distribution Preview */}
          {discountPreview && discountType === "AMOUNT" && (
            <div className="rounded-lg border p-4 space-y-2">
              <Label className="text-sm font-medium">
                Discount Distribution:
              </Label>
              <div className="space-y-1 text-xs text-muted-foreground">
                {discountPreview.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      Item {idx + 1} ({formatForDisplay(item.subtotal)}):
                    </span>
                    <span>-{formatForDisplay(item.discountAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => close(false)}
            disabled={loading || isUpdatingPromotion}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApplyDiscount}
            disabled={
              loading ||
              isUpdatingPromotion ||
              !discountValue ||
              parseFloat(discountValue) <= 0
            }
          >
            {loading || isUpdatingPromotion ? "Applying..." : "Apply Discount"}
          </Button>
        </DialogFooter>
      </>
    );
  },
  { defaultValue: null },
);
