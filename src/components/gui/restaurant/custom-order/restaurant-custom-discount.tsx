import { useQueryAppliesDiscountProduct } from "@/app/hooks/use-query-discount";
import {
  useCreatePromotion,
  useDeletePromotion,
  useUpdatePromotion,
} from "@/app/hooks/use-query-promotion";
import { LayoutLoading } from "@/components/layout-loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MaterialInput } from "@/components/ui/material-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CustomerOrderDiscount } from "@/dataloader/discount-by-order-items-loader";
import { table_restaurant_tables } from "@/generated/tables";
import { generateId } from "@/lib/generate-id";
import { Percent, Tag } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CartProps, DiscountProps } from "../../pos/types/post-types";
import { useRestaurantActions } from "../hooks/use-restaurant-actions";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

// Types for better type safety
interface ManualDiscount {
  discountType: "AMOUNT" | "PERCENTAGE";
  value: number;
}

interface PromotionDiscount {
  discountId: string;
  productId: string;
  discount: {
    id: string;
    title: string;
    discountType: "AMOUNT" | "PERCENTAGE";
    value: number;
  };
}

export function RestaurantCustomDiscount({
  cart,
  orderId,
  table,
  onDiscountChange,
}: {
  cart: CartProps;
  orderId?: string;
  table?: table_restaurant_tables;
  onDiscountChange?: (discounts: DiscountProps[]) => void;
}) {
  const { setDiscount } = useRestaurantActions();
  const { getSymbol } = useCurrencyFormat();
  // Hooks for API operations
  const {
    trigger: triggerCreatePromotion,
    isMutating: isMutatingCreatePromotion,
  } = useCreatePromotion(orderId || "");
  const {
    trigger: triggerDeletePromotion,
    isMutating: isMutatingDeletePromotion,
  } = useDeletePromotion(orderId || "");
  const {
    trigger: triggerUpdatePromotion,
    isMutating: isMutatingUpdatePromotion,
  } = useUpdatePromotion(orderId || "");

  // Initialize manual discount from existing cart discounts
  const getExistingManualDiscount = useCallback(() => {
    const manualDiscountFromCart = cart.discounts.find(
      (d) => d.isManualDiscount
    );

    if (manualDiscountFromCart) {
      return {
        discountType: manualDiscountFromCart.discountType,
        value: manualDiscountFromCart.value,
      };
    }

    return {
      discountType: "AMOUNT" as const,
      value: 0,
    };
  }, [cart.discounts]);

  // Initialize applied promotions from existing cart discounts
  const getExistingPromotions = useCallback(() => {
    // Get all discount IDs from cart, excluding manual discounts
    const promotionIds = new Set<string>();

    cart.discounts.forEach((discount) => {
      // Skip manual discounts
      if (discount.isManualDiscount) {
        return;
      }

      // Add the discount ID to our set
      promotionIds.add(discount.discountId);
    });

    return promotionIds;
  }, [cart]);

  // State management with initialization from cart
  const [manualDiscount, setManualDiscount] = useState<ManualDiscount>(
    getExistingManualDiscount
  );
  const [appliedPromotions, setAppliedPromotions] = useState<Set<string>>(
    getExistingPromotions
  );
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  // Fetch available promotions for this product
  const { data: promotionsData, isLoading: isLoadingPromotions } =
    useQueryAppliesDiscountProduct({
      productId: cart.productId,
    });

  const calculateCurrentPrice = useCallback(
    (discounts: CustomerOrderDiscount[], totalAmount: number) => {
      const totalDiscount = discounts.reduce((total, discount) => {
        return total + discount.amount;
      }, 0);
      return Math.max(0, totalAmount - totalDiscount);
    },
    []
  );

  // Helper function to update current price after API calls
  const updateCurrentPriceFromResult = useCallback(
    (
      result: {
        success?: boolean;
        data?: { discountLog?: CustomerOrderDiscount[] };
      },
      fallbackDiscounts?: CartProps["discounts"]
    ) => {
      if (result?.success && result?.data?.discountLog) {
        calculateCurrentPrice(result.data.discountLog, cart.usd);
      } else if (fallbackDiscounts) {
        // Convert cart discounts to CustomerOrderDiscount format for calculation
        const convertedDiscounts: CustomerOrderDiscount[] =
          fallbackDiscounts.map((discount) => ({
            id: discount.discountId || "",
            discountId: discount.discountId || "",
            orderDetailId: cart.id || "",
            amount: parseFloat(discount.amount) || 0,
            name: discount.title || "Manual Discount",
            discountType: discount.discountType,
            value: discount.value,
            isManualDiscount: discount.isManualDiscount,
          }));
        calculateCurrentPrice(convertedDiscounts, cart.usd);
      } else {
      }
    },
    [calculateCurrentPrice, cart]
  );

  const isLoading =
    isApplyingDiscount ||
    isMutatingCreatePromotion ||
    isMutatingDeletePromotion ||
    isMutatingUpdatePromotion;

  // Manual discount handlers
  const handleDiscountTypeChange = useCallback(
    (type: "AMOUNT" | "PERCENTAGE") => {
      setManualDiscount((prev) => ({
        ...prev,
        discountType: type,
        value: 0, // Reset value when type changes
      }));
    },
    []
  );

  const handleDiscountValueChange = useCallback(
    (value: number) => {
      setManualDiscount((prev) => {
        const maxValue = prev.discountType === "AMOUNT" ? cart.usd : 100;
        return {
          ...prev,
          value: Math.min(Math.max(0, value), maxValue),
        };
      });
    },
    [cart.usd]
  );

  // Effect to update current price when cart changes
  useEffect(() => {
    if (cart.discounts && cart.discounts.length > 0) {
      // Convert cart discounts to CustomerOrderDiscount format for calculation
      const convertedDiscounts: CustomerOrderDiscount[] = cart.discounts.map(
        (discount) => ({
          id: discount.discountId || "",
          discountId: discount.discountId || "",
          orderDetailId: cart.id || "",
          amount: parseFloat(discount.amount) || 0,
          name: discount.title || "Manual Discount",
          discountType: discount.discountType,
          value: discount.value,
          isManualDiscount: discount.isManualDiscount,
        })
      );
      calculateCurrentPrice(convertedDiscounts, cart.usd);
    } else {
    }
  }, [
    cart.discounts,
    cart.usd,
    cart.totalAfterDiscount,
    cart.id,
    calculateCurrentPrice,
  ]);

  const onSetDiscount = useCallback(
    (discount: CustomerOrderDiscount[]) => {
      if (table) {
        console.log("Setting discount for table:", table, discount, cart.id);
        setDiscount(table, cart.id || "", discount);
      }
    },
    [cart.id, setDiscount, table]
  );

  const applyManualDiscount = useCallback(async () => {
    if (manualDiscount.value < 0) return;

    setIsApplyingDiscount(true);
    try {
      const result = await triggerUpdatePromotion([
        {
          amount: manualDiscount.value,
          discountType: manualDiscount.discountType,
          itemId: cart.id || "",
        },
      ]);

      if (result?.error === "Order already checkout") {
        // close("checkout");
        toast.error(result.error);
        return;
      }

      const discountLog = [
        {
          id: "manual",
          discountId: "manual",
          orderDetailId: cart.id || "",
          name: "Manual Discount",
          discountType: manualDiscount.discountType,
          value: manualDiscount.value,
          isManualDiscount: true,
          amount:
            manualDiscount.discountType === "AMOUNT"
              ? manualDiscount.value
              : manualDiscount.value * (cart.usd / 100),
        },
        ...cart.discounts
          .filter((f) => !f.isManualDiscount)
          .map((x) => {
            return {
              id: x.id,
              discountId: x.discountId,
              orderDetailId: cart.id || "",
              name: x.title || "Discount",
              discountType: x.discountType,
              value: x.value,
              isManualDiscount: false,
              amount:
                x.discountType === "AMOUNT"
                  ? x.value
                  : x.value * (cart.usd / 100),
            };
          }),
      ];
      updateCurrentPriceFromResult(
        {
          success: true,
          data: {
            discountLog,
          },
        },
        cart.discounts
      );
      onSetDiscount(discountLog);
      // Convert discountLog to DiscountProps format for onDiscountChange
      const discountProps: DiscountProps[] = discountLog.map((discount) => ({
        id: discount.id,
        discountId: discount.discountId,
        productId: cart.productId,
        title: discount.name,
        description: "",
        warehouseId: "",
        discountType: discount.discountType,
        value: discount.value,
        amount: discount.amount.toString(),
        isManualDiscount: discount.isManualDiscount,
        updatedAt: "",
        createdAt: "",
      }));
      onDiscountChange?.(discountProps);

      toast.success("Manual discount applied successfully");
    } catch (error) {
      toast.error("Failed to apply manual discount");
      console.error("Manual discount error:", error);
    } finally {
      setIsApplyingDiscount(false);
    }
  }, [
    cart,
    manualDiscount,
    updateCurrentPriceFromResult,
    triggerUpdatePromotion,
    onSetDiscount,
    onDiscountChange,
  ]);

  // Promotion handlers
  const togglePromotion = useCallback(
    async (promotion: PromotionDiscount, isApplying: boolean) => {
      setIsApplyingDiscount(true);

      try {
        const discountLog = [
          {
            id: "manual",
            discountId: "manual",
            orderDetailId: cart.id || "",
            name: "Manual Discount",
            discountType: manualDiscount.discountType,
            value: manualDiscount.value,
            isManualDiscount: true,
            amount:
              manualDiscount.discountType === "AMOUNT"
                ? manualDiscount.value
                : manualDiscount.value * (cart.usd / 100),
          },
          ...cart.discounts
            .filter((f) => !f.isManualDiscount)
            .map((x) => {
              return {
                id: x.id,
                discountId: x.discountId,
                orderDetailId: cart.id || "",
                name: x.title || "Discount",
                discountType: x.discountType,
                value: x.value,
                isManualDiscount: false,
                amount:
                  x.discountType === "AMOUNT"
                    ? x.value
                    : x.value * (cart.usd / 100),
              };
            }),
        ];
        if (isApplying) {
          discountLog.push({
            id: generateId(),
            discountId: promotion.discountId || "",
            orderDetailId: orderId || "",
            name: promotion.discount.title || "Discount",
            discountType: promotion.discount.discountType,
            value: promotion.discount.value,
            isManualDiscount: false,
            amount:
              promotion.discount.discountType === "AMOUNT"
                ? promotion.discount.value
                : promotion.discount.value * (cart.usd / 100),
          });
          const result = await triggerCreatePromotion({
            itemId: cart.id || "",
            discountId: promotion.discountId,
          });
          updateCurrentPriceFromResult(result, cart.discounts);
          setAppliedPromotions(
            (prev) => new Set([...prev, promotion.discountId])
          );
          toast.success(`Promotion "${promotion.discount.title}" applied`);
        } else {
          discountLog.filter((f) => f.discountId !== promotion.discountId);
          const result = await triggerDeletePromotion({
            itemId: cart.id || "",
            discountId: promotion.discountId,
          });

          if (result?.error === "Order already checkout") {
            // close("checkout");
            toast.error(result.error);
            return;
          }

          updateCurrentPriceFromResult(result, cart.discounts);

          // delete promotion
          setAppliedPromotions((prev) => {
            const newSet = new Set(prev);
            newSet.delete(promotion.discountId);
            return newSet;
          });
          toast.success(`Promotion "${promotion.discount.title}" removed`);
        }
        updateCurrentPriceFromResult(
          {
            success: true,
            data: {
              discountLog,
            },
          },
          cart.discounts
        );
        onSetDiscount(discountLog);
        // Convert discountLog to DiscountProps format for onDiscountChange
        const discountProps: DiscountProps[] = discountLog.map((discount) => ({
          id: discount.id,
          discountId: discount.discountId,
          productId: cart.productId,
          title: discount.name,
          description: "",
          warehouseId: "",
          discountType: discount.discountType,
          value: discount.value,
          amount: discount.amount.toString(),
          isManualDiscount: discount.isManualDiscount,
          updatedAt: "",
          createdAt: "",
        }));
        onDiscountChange?.(discountProps);
      } catch (error: unknown) {
        // Handle the case where promotion is already applied
        if (
          isApplying &&
          error instanceof Error &&
          error.message?.includes("Discount already applied")
        ) {
          setAppliedPromotions(
            (prev) => new Set([...prev, promotion.discountId])
          );
          toast.info(
            `Promotion "${promotion.discount.title}" is already applied`
          );
        } else {
          toast.error(`Failed to ${isApplying ? "apply" : "remove"} promotion`);
          console.error("Promotion toggle error:", error);
        }
      } finally {
        setIsApplyingDiscount(false);
      }
    },
    [
      cart,
      manualDiscount,
      orderId,
      updateCurrentPriceFromResult,
      triggerCreatePromotion,
      triggerDeletePromotion,
      onSetDiscount,
      onDiscountChange,
    ]
  );

  return (
    <div className="space-y-3">
      {/* Compact Manual Discount Section */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            {getSymbol()} Manual Discount
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select
                value={manualDiscount.discountType}
                onValueChange={handleDiscountTypeChange}
                disabled={isLoading}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AMOUNT">
                    <div className="flex items-center gap-1">
                      {getSymbol()} <span className="text-xs">Amount</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PERCENTAGE">
                    <div className="flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      <span className="text-xs">Percent</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Value</Label>
              <MaterialInput
                type="number"
                value={manualDiscount.value.toString()}
                onChange={(e) =>
                  handleDiscountValueChange(Number(e.target.value) || 0)
                }
                disabled={isLoading}
                min={0}
                max={manualDiscount.discountType === "AMOUNT" ? cart.usd : 100}
                step={manualDiscount.discountType === "AMOUNT" ? 0.01 : 1}
                placeholder="0"
                className="h-7 text-xs"
              />
            </div>
          </div>

          <Button
            onClick={applyManualDiscount}
            disabled={isLoading}
            className="w-full h-7 text-xs"
            size="sm"
          >
            {isApplyingDiscount ? "Applying..." : "Apply Discount"}
          </Button>
        </CardContent>
      </Card>

      {/* Compact Promotions Section */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Tag className="h-3.5 w-3.5" />
            Promotions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingPromotions ? (
            <LayoutLoading />
          ) : promotionsData?.result && promotionsData.result.length > 0 ? (
            <div className="space-y-1.5">
              {promotionsData.result.map(
                (promotion: PromotionDiscount, index: number) => {
                  const isApplied = appliedPromotions.has(promotion.discountId);
                  const discountText = `${
                    promotion.discount.discountType === "AMOUNT"
                      ? getSymbol()
                      : ""
                  }${promotion.discount.value}${
                    promotion.discount.discountType === "PERCENTAGE" ? "%" : ""
                  }`;

                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded border transition-colors ${
                        isApplied
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Switch
                          id={`promotion_${index}`}
                          checked={isApplied}
                          onCheckedChange={(checked) =>
                            togglePromotion(promotion, checked)
                          }
                          disabled={isLoading}
                          className="scale-75 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <Label
                            htmlFor={`promotion_${index}`}
                            className="text-xs font-medium cursor-pointer truncate block"
                          >
                            {promotion.discount.title}
                          </Label>
                        </div>
                      </div>
                      <Badge
                        variant={isApplied ? "default" : "secondary"}
                        className="text-xs px-2 py-0.5 h-auto flex-shrink-0 ml-2"
                      >
                        {discountText}
                      </Badge>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <div className="text-center py-3 text-gray-500">
              <Tag className="h-6 w-6 mx-auto mb-1 opacity-50" />
              <p className="text-xs">No promotions available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
