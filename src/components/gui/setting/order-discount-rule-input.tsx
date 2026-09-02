"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_ORDER_DISCOUNT_RULES,
  OrderDiscountRules,
  OrderDiscountValueType,
  parseOrderDiscountRules,
} from "@/lib/order-discount-rules";
import { Hash, Percent, ShoppingBag } from "lucide-react";
import { useCallback } from "react";

interface Props {
  value: string;
  onChangeValue: (v: string) => void;
}

/** Serialize back to the stored JSON shape (min -> minAmount / minQty aliases). */
function serialize(rules: OrderDiscountRules): string {
  return JSON.stringify({
    amountRule: {
      enabled: rules.amountRule.enabled,
      minAmount: rules.amountRule.min,
      discountType: rules.amountRule.discountType,
      value: rules.amountRule.value,
    },
    qtyRule: {
      enabled: rules.qtyRule.enabled,
      minQty: rules.qtyRule.min,
      discountType: rules.qtyRule.discountType,
      value: rules.qtyRule.value,
    },
    maxQtyPerLine: {
      enabled: rules.maxQtyPerLine.enabled,
      value: rules.maxQtyPerLine.value,
    },
  });
}

function numberOr(v: string, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function OrderDiscountRuleInput(props: Props) {
  const rules = parseOrderDiscountRules(props.value || "");

  const emit = useCallback(
    (next: OrderDiscountRules) => props.onChangeValue(serialize(next)),
    [props],
  );

  const setAmountRule = (patch: Partial<OrderDiscountRules["amountRule"]>) =>
    emit({ ...rules, amountRule: { ...rules.amountRule, ...patch } });
  const setQtyRule = (patch: Partial<OrderDiscountRules["qtyRule"]>) =>
    emit({ ...rules, qtyRule: { ...rules.qtyRule, ...patch } });
  const setMaxQty = (patch: Partial<OrderDiscountRules["maxQtyPerLine"]>) =>
    emit({ ...rules, maxQtyPerLine: { ...rules.maxQtyPerLine, ...patch } });

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Rule 1 — order over an amount */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ShoppingBag className="h-4 w-4 text-primary" />
            Discount for large orders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={rules.amountRule.enabled}
              onCheckedChange={(c) => setAmountRule({ enabled: Boolean(c) })}
              className="mt-0.5"
            />
            <span className="text-sm font-medium leading-relaxed">
              Apply a discount when the order subtotal reaches a minimum
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-7">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Minimum order subtotal
              </Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                className="font-mono text-sm"
                value={String(rules.amountRule.min)}
                onChange={(e) =>
                  setAmountRule({
                    min: numberOr(
                      e.target.value,
                      DEFAULT_ORDER_DISCOUNT_RULES.amountRule.min,
                    ),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Discount type
              </Label>
              <Select
                value={rules.amountRule.discountType}
                onValueChange={(v) =>
                  setAmountRule({ discountType: v as OrderDiscountValueType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  <SelectItem value="AMOUNT">Fixed amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {rules.amountRule.discountType === "PERCENTAGE"
                  ? "Percent off"
                  : "Amount off"}
              </Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                className="font-mono text-sm"
                value={String(rules.amountRule.value)}
                onChange={(e) =>
                  setAmountRule({ value: numberOr(e.target.value, 0) })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rule 2 — order over an item count */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Hash className="h-4 w-4 text-primary" />
            Discount for high-quantity orders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={rules.qtyRule.enabled}
              onCheckedChange={(c) => setQtyRule({ enabled: Boolean(c) })}
              className="mt-0.5"
            />
            <span className="text-sm font-medium leading-relaxed">
              Apply a discount when the total item quantity reaches a minimum
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-7">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Minimum total quantity
              </Label>
              <Input
                type="number"
                min={0}
                step={1}
                className="font-mono text-sm"
                value={String(rules.qtyRule.min)}
                onChange={(e) =>
                  setQtyRule({
                    min: numberOr(
                      e.target.value,
                      DEFAULT_ORDER_DISCOUNT_RULES.qtyRule.min,
                    ),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Discount type
              </Label>
              <Select
                value={rules.qtyRule.discountType}
                onValueChange={(v) =>
                  setQtyRule({ discountType: v as OrderDiscountValueType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  <SelectItem value="AMOUNT">Fixed amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {rules.qtyRule.discountType === "PERCENTAGE"
                  ? "Percent off"
                  : "Amount off"}
              </Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                className="font-mono text-sm"
                value={String(rules.qtyRule.value)}
                onChange={(e) =>
                  setQtyRule({ value: numberOr(e.target.value, 0) })
                }
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground pl-7">
            When an order qualifies for both discounts above, only the larger one
            is applied.
          </p>
        </CardContent>
      </Card>

      {/* Rule 3 — variant discount unit cap */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Percent className="h-4 w-4 text-primary" />
            Variant discount quantity cap
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={rules.maxQtyPerLine.enabled}
              onCheckedChange={(c) => setMaxQty({ enabled: Boolean(c) })}
              className="mt-0.5"
            />
            <span className="text-sm font-medium leading-relaxed">
              Limit a product-variant menu discount to the first few units of a
              line — extra units are charged full price
            </span>
          </label>
          <div className="pl-7 max-w-[200px] space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Discounted units per line
            </Label>
            <Input
              type="number"
              min={1}
              step={1}
              className="font-mono text-sm"
              value={String(rules.maxQtyPerLine.value)}
              onChange={(e) =>
                setMaxQty({
                  value: numberOr(
                    e.target.value,
                    DEFAULT_ORDER_DISCOUNT_RULES.maxQtyPerLine.value,
                  ),
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
