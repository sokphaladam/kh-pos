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
  MaxQtyOverride,
  MaxQtyOverrideScope,
  OrderDiscountRules,
  OrderDiscountValueType,
  parseOrderDiscountRules,
} from "@/lib/order-discount-rules";
import { Hash, Percent, ShoppingBag, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import SearchProductPicker from "@/components/search-product-picker";
import { useQueryCategory } from "@/app/hooks/use-query-category";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      overrides: rules.maxQtyPerLine.overrides.map((o) => ({
        scope: o.scope,
        id: o.id,
        label: o.label,
        value: o.value,
      })),
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

  const setOverrides = (overrides: MaxQtyOverride[]) =>
    setMaxQty({ overrides });

  const addOverride = (o: MaxQtyOverride) => {
    const exists = rules.maxQtyPerLine.overrides.some(
      (x) => x.scope === o.scope && x.id === o.id,
    );
    if (exists) return;
    setOverrides([...rules.maxQtyPerLine.overrides, o]);
  };

  const updateOverride = (
    scope: MaxQtyOverrideScope,
    id: string,
    patch: Partial<MaxQtyOverride>,
  ) =>
    setOverrides(
      rules.maxQtyPerLine.overrides.map((x) =>
        x.scope === scope && x.id === id ? { ...x, ...patch } : x,
      ),
    );

  const removeOverride = (scope: MaxQtyOverrideScope, id: string) =>
    setOverrides(
      rules.maxQtyPerLine.overrides.filter(
        (x) => !(x.scope === scope && x.id === id),
      ),
    );

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
              Default discounted units per line
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

          <div className="pl-7 space-y-3 border-t border-border/50 pt-4">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold">
                Per-item overrides
              </Label>
              <p className="text-xs text-muted-foreground">
                Give a specific product, category, or variant its own cap. The
                most specific match wins: variant → product → category →
                default.
              </p>
            </div>
            <MaxQtyOverridesEditor
              overrides={rules.maxQtyPerLine.overrides}
              disabled={!rules.maxQtyPerLine.enabled}
              onAdd={addOverride}
              onUpdate={updateOverride}
              onRemove={removeOverride}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const SCOPE_LABEL: Record<MaxQtyOverrideScope, string> = {
  VARIANT: "Variant",
  PRODUCT: "Product",
  CATEGORY: "Category",
};

interface OverridesEditorProps {
  overrides: MaxQtyOverride[];
  disabled?: boolean;
  onAdd: (o: MaxQtyOverride) => void;
  onUpdate: (
    scope: MaxQtyOverrideScope,
    id: string,
    patch: Partial<MaxQtyOverride>,
  ) => void;
  onRemove: (scope: MaxQtyOverrideScope, id: string) => void;
}

function MaxQtyOverridesEditor({
  overrides,
  disabled,
  onAdd,
  onUpdate,
  onRemove,
}: OverridesEditorProps) {
  const [scope, setScope] = useState<MaxQtyOverrideScope>("PRODUCT");
  const [pickerKey, setPickerKey] = useState(0);
  const { categories } = useQueryCategory(1000, 0);

  const resetPicker = () => setPickerKey((k) => k + 1);

  return (
    <div className="space-y-3">
      {overrides.length > 0 && (
        <div className="space-y-2">
          {overrides.map((o) => (
            <div
              key={`${o.scope}:${o.id}`}
              className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-2"
            >
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {SCOPE_LABEL[o.scope]}
              </Badge>
              <span className="flex-1 truncate text-sm" title={o.label || o.id}>
                {o.label || o.id}
              </span>
              <Input
                type="number"
                min={1}
                step={1}
                aria-label="Discounted units per line"
                className="h-8 w-20 font-mono text-sm"
                value={String(o.value)}
                disabled={disabled}
                onChange={(e) =>
                  onUpdate(o.scope, o.id, {
                    value: numberOr(
                      e.target.value,
                      DEFAULT_ORDER_DISCOUNT_RULES.maxQtyPerLine.value,
                    ),
                  })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(o.scope, o.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          value={scope}
          onValueChange={(v) => {
            setScope(v as MaxQtyOverrideScope);
            resetPicker();
          }}
        >
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PRODUCT">Product</SelectItem>
            <SelectItem value="CATEGORY">Category</SelectItem>
            <SelectItem value="VARIANT">Variant</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1">
          {scope === "CATEGORY" ? (
            <Select
              key={pickerKey}
              disabled={disabled}
              onValueChange={(id) => {
                const cat = (categories?.data ?? []).find((c) => c.id === id);
                if (!cat?.id) return;
                onAdd({
                  scope: "CATEGORY",
                  id: cat.id,
                  label: cat.title,
                  value: DEFAULT_ORDER_DISCOUNT_RULES.maxQtyPerLine.value,
                });
                resetPicker();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category…" />
              </SelectTrigger>
              <SelectContent>
                {(categories?.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id ?? ""}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <SearchProductPicker
              key={pickerKey}
              clearInput
              disabled={disabled}
              label={
                scope === "VARIANT" ? "Search variant…" : "Search product…"
              }
              onChange={(item) => {
                if (scope === "VARIANT") {
                  onAdd({
                    scope: "VARIANT",
                    id: item.variantId,
                    label: item.productTitle,
                    value: DEFAULT_ORDER_DISCOUNT_RULES.maxQtyPerLine.value,
                  });
                } else {
                  onAdd({
                    scope: "PRODUCT",
                    id: item.productId,
                    label: item.productTitle.replace(/\s*\([^)]*\)\s*$/, ""),
                    value: DEFAULT_ORDER_DISCOUNT_RULES.maxQtyPerLine.value,
                  });
                }
                resetPicker();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
