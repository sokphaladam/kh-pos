import { useUpdatePromotion } from "@/app/hooks/use-query-promotion";
import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MaterialInput } from "@/components/ui/material-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CustomerOrderDiscount } from "@/dataloader/discount-by-order-items-loader";
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
    // Order lines the cart discount should NOT touch (unchecked by the user).
    const [excluded, setExcluded] = useState<Set<string>>(new Set());
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

    // Per-line figures. `netBase` is the price the cart discount stacks on:
    // gross minus whatever non-manual discount (variant menu discount, applied
    // promotions) the line already carries.
    const lines = useMemo(() => {
      return (table?.orders?.items ?? []).map((item) => {
        const gross = Number(item.price || 0) * Number(item.qty || 0);
        const existingNonManual = (item.discounts ?? [])
          .filter((d) => !d.isManualDiscount)
          .reduce((s, d) => s + Number(d.amount || 0), 0);
        return {
          orderDetailId: item.orderDetailId,
          title: item.title || "Item",
          qty: Number(item.qty || 0),
          gross,
          existingNonManual,
          netBase: Math.max(0, gross - existingNonManual),
          hasManual: (item.discounts ?? []).some((d) => d.isManualDiscount),
        };
      });
    }, [table?.orders?.items]);

    const includedLines = useMemo(
      () => lines.filter((l) => !excluded.has(l.orderDetailId)),
      [lines, excluded],
    );
    const includedNetBase = includedLines.reduce((s, l) => s + l.netBase, 0);
    const grossTotal = lines.reduce((s, l) => s + l.gross, 0);
    const existingTotal = lines.reduce((s, l) => s + l.existingNonManual, 0);

    const toggleExcluded = (id: string) =>
      setExcluded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });

    // Per-line manual discount for the entered value (stacks on `netBase`).
    const perLineDiscount = (netBase: number, value: number): number => {
      if (value <= 0) return 0;
      const raw =
        discountType === "PERCENTAGE"
          ? Math.floor(netBase * value) / 100
          : includedNetBase > 0
            ? value * (netBase / includedNetBase)
            : 0;
      return Math.min(raw, netBase);
    };

    const discountPreview = useMemo(() => {
      const value = parseFloat(discountValue) || 0;
      if (value <= 0) return null;

      const rows = includedLines.map((l) => {
        const manual = perLineDiscount(l.netBase, value);
        return { ...l, manual, finalAmount: l.netBase - manual };
      });
      const totalManual = rows.reduce((s, r) => s + r.manual, 0);
      return {
        rows,
        totalManual,
        finalTotal: grossTotal - existingTotal - totalManual,
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [discountValue, discountType, includedLines, includedNetBase]);

    const buildManualEntry = (
      orderDetailId: string,
      value: number,
      amount: number,
    ): CustomerOrderDiscount => ({
      id: "manual",
      discountId: "manual",
      orderDetailId,
      name: "Manual Discount",
      discountType,
      value,
      isManualDiscount: true,
      amount,
    });

    const applyToItems = async (
      makeRow: (line: (typeof lines)[number]) => {
        amount: number;
        discountType: DiscountType;
      },
    ) => {
      if (!orderId || !table?.orders?.items || !table.tables) {
        toast({
          title: "Error",
          description: "No order found",
          variant: "destructive",
        });
        return;
      }

      const data = lines.map((l) => ({
        itemId: l.orderDetailId,
        ...makeRow(l),
      }));

      try {
        const result = await triggerUpdatePromotion(data);
        if (result.success) {
          for (const l of lines) {
            const orig = table.orders!.items.find(
              (i) => i.orderDetailId === l.orderDetailId,
            );
            const keep = (orig?.discounts ?? []).filter(
              (d) => !d.isManualDiscount,
            );
            const row = data.find((d) => d.itemId === l.orderDetailId);
            if (!row || row.amount <= 0) {
              setDiscount(table.tables!, l.orderDetailId, keep);
            } else {
              setDiscount(table.tables!, l.orderDetailId, [
                ...keep,
                buildManualEntry(l.orderDetailId, row.amount, row.amount),
              ]);
            }
          }
          router.refresh();
          close(true);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update discount",
            variant: "destructive",
          });
        }
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

    const handleApplyDiscount = async () => {
      const value = parseFloat(discountValue) || 0;
      if (value <= 0) {
        toast({
          title: "Invalid Discount",
          description: "Please enter a valid discount value",
          variant: "destructive",
        });
        return;
      }
      if (discountType === "PERCENTAGE" && value > 100) {
        toast({
          title: "Invalid Percentage",
          description: "Discount percentage cannot exceed 100%",
          variant: "destructive",
        });
        return;
      }
      if (discountType === "AMOUNT" && value > includedNetBase) {
        toast({
          title: "Invalid Amount",
          description: "Discount amount cannot exceed the selected items' total",
          variant: "destructive",
        });
        return;
      }
      if (includedLines.length === 0) {
        toast({
          title: "No items selected",
          description: "Select at least one item to discount",
          variant: "destructive",
        });
        return;
      }

      await applyToItems((line) => {
        if (excluded.has(line.orderDetailId)) {
          return { amount: 0, discountType }; // remove manual discount here
        }
        if (discountType === "PERCENTAGE") {
          return { amount: value, discountType };
        }
        const proportion =
          includedNetBase > 0 ? line.netBase / includedNetBase : 0;
        return { amount: value * proportion, discountType };
      });
    };

    const handleRemoveAll = () =>
      applyToItems(() => ({ amount: 0, discountType }));

    const anyManual = lines.some((l) => l.hasManual);

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

          {/* Per-item selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Apply to items
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                (uncheck to skip / remove the cart discount on a line)
              </span>
            </Label>
            <div className="rounded-lg border divide-y">
              {lines.map((l) => {
                const included = !excluded.has(l.orderDetailId);
                const value = parseFloat(discountValue) || 0;
                const manual = included ? perLineDiscount(l.netBase, value) : 0;
                return (
                  <label
                    key={l.orderDetailId}
                    className="flex items-center gap-3 p-2 cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={included}
                      onCheckedChange={() => toggleExcluded(l.orderDetailId)}
                    />
                    <span className="flex-1 truncate">
                      {l.title}
                      <span className="text-muted-foreground"> ×{l.qty}</span>
                    </span>
                    <span className="text-right tabular-nums">
                      {l.existingNonManual > 0 && (
                        <span className="block text-[11px] text-muted-foreground">
                          -{formatForDisplay(l.existingNonManual)} already
                        </span>
                      )}
                      <span
                        className={
                          manual > 0 ? "text-red-600" : "text-muted-foreground"
                        }
                      >
                        {manual > 0
                          ? `-${formatForDisplay(manual)}`
                          : formatForDisplay(l.netBase)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">
                {formatForDisplay(grossTotal)}
              </span>
            </div>
            {existingTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Existing discounts:
                </span>
                <span className="font-medium text-red-600">
                  -{formatForDisplay(existingTotal)}
                </span>
              </div>
            )}
            {discountPreview && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cart discount:</span>
                  <span className="font-medium text-red-600">
                    -{formatForDisplay(discountPreview.totalManual)}
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
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => close(false)}
            disabled={loading || isUpdatingPromotion}
          >
            Cancel
          </Button>
          {anyManual && (
            <Button
              variant="outline"
              onClick={handleRemoveAll}
              disabled={loading || isUpdatingPromotion}
            >
              Remove discount
            </Button>
          )}
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
