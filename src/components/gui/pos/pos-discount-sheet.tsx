import { useQueryAppliesDiscountProduct } from "@/app/hooks/use-query-discount";
import {
  useCreatePromotion,
  useDeletePromotion,
  useUpdatePromotion,
} from "@/app/hooks/use-query-promotion";
import { createSheet } from "@/components/create-sheet";
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
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { CustomerOrderDiscount } from "@/dataloader/discount-by-order-items-loader";
import { useAuthentication } from "contexts/authentication-context";
import { DollarSign, Percent, Tag } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CartProps } from "./types/post-types";

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

export const POSDiscountSheet = createSheet<
  {
    cart: CartProps;
    orderId?: string;
  },
  unknown
>(
  ({ cart, close, orderId }) => {
    const { currency } = useAuthentication();
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

    const [currentPrice, setCurrentPrice] = useState(
      cart.totalAfterDiscount.toFixed(2)
    );

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
        const newPrice = (totalAmount - totalDiscount).toFixed(2);
        setCurrentPrice(newPrice);
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
          setCurrentPrice(cart.totalAfterDiscount.toFixed(2));
        }
      },
      [calculateCurrentPrice, cart.usd, cart.totalAfterDiscount, cart.id]
    );

    const isLoading =
      isMutatingCreatePromotion ||
      isMutatingDeletePromotion ||
      isMutatingUpdatePromotion ||
      isApplyingDiscount;

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
        setCurrentPrice(cart.totalAfterDiscount.toFixed(2));
      }
    }, [
      cart.discounts,
      cart.usd,
      cart.totalAfterDiscount,
      cart.id,
      calculateCurrentPrice,
    ]);

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
          close("checkout");
          toast.error(result.error);
          return;
        }

        updateCurrentPriceFromResult(result, cart.discounts);

        toast.success("Manual discount applied successfully");
      } catch (error) {
        toast.error("Failed to apply manual discount");
        console.error("Manual discount error:", error);
      } finally {
        setIsApplyingDiscount(false);
      }
    }, [
      manualDiscount.value,
      manualDiscount.discountType,
      triggerUpdatePromotion,
      cart.id,
      cart.discounts,
      close,
      updateCurrentPriceFromResult,
    ]);

    // Promotion handlers
    const togglePromotion = useCallback(
      async (promotion: PromotionDiscount, isApplying: boolean) => {
        setIsApplyingDiscount(true);
        try {
          if (isApplying) {
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
            const result = await triggerDeletePromotion({
              itemId: cart.id || "",
              discountId: promotion.discountId,
            });

            if (result?.error === "Order already checkout") {
              close("checkout");
              toast.error(result.error);
              return;
            }

            updateCurrentPriceFromResult(result, cart.discounts);

            setAppliedPromotions((prev) => {
              const newSet = new Set(prev);
              newSet.delete(promotion.discountId);
              return newSet;
            });
            toast.success(`Promotion "${promotion.discount.title}" removed`);
          }
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
            toast.error(
              `Failed to ${isApplying ? "apply" : "remove"} promotion`
            );
            console.error("Promotion toggle error:", error);
          }
        } finally {
          setIsApplyingDiscount(false);
        }
      },
      [
        triggerCreatePromotion,
        cart.id,
        cart.discounts,
        updateCurrentPriceFromResult,
        triggerDeletePromotion,
        close,
      ]
    );

    return (
      <div className="space-y-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <Tag className="h-4 w-4" />
            {cart.productTitle}
          </SheetTitle>
        </SheetHeader>

        {/* Compact Product Info */}
        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
          <div>
            <p className="text-sm font-medium">Qty: {cart.qty}</p>
            <p className="text-xs text-gray-600">
              Current: {currency}
              {currentPrice}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {currency}
              {cart.usd.toFixed(2)}
            </p>
            <p className="text-xs text-gray-600">Original</p>
          </div>
        </div>

        {/* Compact Manual Discount Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              {currency} {" "}
              Manual Discount
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select
                  value={manualDiscount.discountType}
                  onValueChange={handleDiscountTypeChange}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMOUNT">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Amount
                      </div>
                    </SelectItem>
                    <SelectItem value="PERCENTAGE">
                      <div className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        Percent
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
                  max={
                    manualDiscount.discountType === "AMOUNT" ? cart.usd : 100
                  }
                  step={manualDiscount.discountType === "AMOUNT" ? 0.01 : 1}
                  placeholder="0"
                  className="h-8"
                />
              </div>
            </div>

            <Button
              onClick={applyManualDiscount}
              disabled={isLoading}
              className="w-full h-8"
              size="sm"
            >
              {isApplyingDiscount ? "Applying..." : "Apply"}
            </Button>
          </CardContent>
        </Card>

        {/* Compact Promotions Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4" />
              Promotions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPromotions ? (
              <LayoutLoading />
            ) : promotionsData?.result && promotionsData.result.length > 0 ? (
              <div className="space-y-2">
                {promotionsData.result.map(
                  (promotion: PromotionDiscount, index: number) => {
                    const isApplied = appliedPromotions.has(
                      promotion.discountId
                    );
                    const discountText = `${
                      promotion.discount.discountType === "AMOUNT"
                        ? currency
                        : ""
                    }${promotion.discount.value}${
                      promotion.discount.discountType === "PERCENTAGE"
                        ? "%"
                        : ""
                    }`;

                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-2 rounded border transition-colors ${
                          isApplied
                            ? "bg-green-50 border-green-200"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`promotion_${index}`}
                            checked={isApplied}
                            onCheckedChange={(checked) =>
                              togglePromotion(promotion, checked)
                            }
                            disabled={isLoading}
                            className="scale-75"
                          />
                          <div>
                            <Label
                              htmlFor={`promotion_${index}`}
                              className="text-xs font-medium cursor-pointer"
                            >
                              {promotion.discount.title}
                            </Label>
                          </div>
                        </div>
                        <Badge
                          variant={isApplied ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {discountText}
                        </Badge>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No promotions available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  },
  { defaultValue: null }
);
