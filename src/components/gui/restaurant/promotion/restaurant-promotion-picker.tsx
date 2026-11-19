"use client";

import type { ProductSearchResult } from "@/app/api/product/search-product/types";
import type { PromotionSetChoiceSlot } from "@/app/api/promotion-set/types";
import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Check, Gift, LayoutGrid, List } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { usePromotionSetI18n } from "../../promotion-set/use-promotion-set-i18n";
import type { PromotionSetCartLine } from "../hooks/use-restaurant-actions";

/** The cart product for a menu search row (same shape the menu tap builds). */
export function toCartProduct(
  item: ProductSearchResult,
): PromotionSetCartLine["product"] | null {
  const variant = (item.variants as ProductVariantType[] | undefined)?.find(
    (v) => v.id === item.variantId,
  );
  if (!variant) return null;
  return { ...variant, modifiers: item.modifiers ?? [] };
}

/**
 * Turn one chosen candidate per slot into cart lines, merging slots that
 * resolve to the same variant (e.g. "6 x Beer" + "2 x Beer free" -> 8 x Beer).
 */
export function buildPromotionCartLines(
  slots: PromotionSetChoiceSlot[],
  chosen: (ProductSearchResult | undefined)[],
): PromotionSetCartLine[] | null {
  const byVariant = new Map<string, PromotionSetCartLine>();
  for (const [index, slot] of slots.entries()) {
    const candidate = chosen[index];
    const product = candidate ? toCartProduct(candidate) : null;
    if (!product) return null;
    const line = byVariant.get(product.id);
    if (line) line.quantity += slot.item.qty;
    else byVariant.set(product.id, { product, quantity: slot.item.qty });
  }
  return [...byVariant.values()];
}

function CandidateImage({
  item,
  className = "size-12",
}: {
  item: ProductSearchResult;
  className?: string;
}) {
  const url = item.images?.find((i) => i.productVariantId === item.variantId)
    ?.url;
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={cn("shrink-0 rounded-md object-contain", className)}
    />
  ) : (
    <div className={cn("shrink-0 rounded-md bg-muted", className)} />
  );
}

type PickerView = "card" | "select";
const VIEW_STORAGE_KEY = "restaurant-promotion-picker-view";

function readStoredView(): PickerView {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === "select"
      ? "select"
      : "card";
  } catch {
    return "card";
  }
}

/**
 * Asks the cashier which product to use for the promotion-set slots that have
 * more than one option (e.g. "1 x any meat"). Resolves with the cart lines,
 * or null when cancelled.
 */
export const restaurantPromotionPicker = createDialog<
  {
    title: string;
    slots: PromotionSetChoiceSlot[];
    /** Overrides the cashier wording (e.g. on the customer menu). */
    hint?: string;
    submitLabel?: string;
  },
  PromotionSetCartLine[] | null
>(
  ({ title, slots, hint, submitLabel, close }) => {
    const { t, rewardLabel } = usePromotionSetI18n();
    const tCommon = useTranslations("common");
    const { formatForDisplay } = useCurrencyFormat();
    const [chosen, setChosen] = useState<(ProductSearchResult | undefined)[]>(
      () => slots.map((s) => (s.candidates.length === 1 ? s.candidates[0] : undefined)),
    );

    const [view, setView] = useState<PickerView>(readStoredView);
    const changeView = (value: string) => {
      if (value !== "card" && value !== "select") return;
      setView(value);
      try {
        localStorage.setItem(VIEW_STORAGE_KEY, value);
      } catch {
        // storage unavailable: keep the choice for this dialog only
      }
    };
    const choose = (index: number, candidate: ProductSearchResult) =>
      setChosen((prev) => {
        const next = [...prev];
        next[index] = candidate;
        return next;
      });

    const lines = useMemo(
      () => buildPromotionCartLines(slots, chosen),
      [slots, chosen],
    );

    return (
      <>
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="flex min-w-0 flex-col gap-1.5">
              <DialogTitle>{t("pos.pickerTitle", { title })}</DialogTitle>
              <DialogDescription>
                {hint ?? t("pos.pickerHint")}
              </DialogDescription>
            </div>
            <ToggleGroup
              type="single"
              size="sm"
              variant="outline"
              value={view}
              onValueChange={changeView}
              className="shrink-0"
            >
              <ToggleGroupItem
                value="card"
                aria-label={t("pos.viewCards")}
                title={t("pos.viewCards")}
              >
                <LayoutGrid className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="select"
                aria-label={t("pos.viewDropdown")}
                title={t("pos.viewDropdown")}
              >
                <List className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </DialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto py-2 pr-1">
          {slots.map((slot, index) => {
            const name = slot.item.matchTitle || "";
            const reward = rewardLabel(slot.item);
            const fixed = slot.candidates.length === 1;
            return (
              <section key={slot.item.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {reward && <Gift className="size-4 text-primary" />}
                  {t(fixed ? "pos.slotFixed" : "pos.slotChoose", {
                    qty: slot.item.qty,
                    name: fixed
                      ? slot.candidates[0].productTitle
                      : name,
                  })}
                  {reward && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                      {reward}
                    </span>
                  )}
                </div>
                {!fixed && view === "select" && (
                  <Select
                    value={chosen[index]?.variantId ?? ""}
                    onValueChange={(variantId) => {
                      const c = slot.candidates.find(
                        (x) => x.variantId === variantId,
                      );
                      if (c) choose(index, c);
                    }}
                  >
                    <SelectTrigger className="h-auto min-h-12 py-1.5">
                      <SelectValue placeholder={t("pos.selectPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {slot.candidates.map((c) => (
                        <SelectItem key={c.variantId} value={c.variantId}>
                          <div className="flex items-center gap-3">
                            <CandidateImage item={c} className="size-9" />
                            <span className="font-medium">
                              {c.productTitle}
                            </span>
                            <span className="text-muted-foreground">
                              {formatForDisplay(Number(c.price ?? 0))}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {!fixed && view === "card" && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {slot.candidates.map((c) => {
                      const selected = chosen[index]?.variantId === c.variantId;
                      return (
                        <button
                          type="button"
                          key={c.variantId}
                          onClick={() => choose(index, c)}
                          className={cn(
                            "relative flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors",
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "hover:bg-muted/60",
                          )}
                        >
                          <CandidateImage item={c} className="size-20" />
                          <div className="w-full min-w-0">
                            <div className="line-clamp-2 text-sm font-medium">
                              {c.productTitle}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatForDisplay(Number(c.price ?? 0))}
                            </div>
                          </div>
                          {selected && (
                            <Check className="absolute right-2 top-2 size-4 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(null)}>
            {tCommon("cancel")}
          </Button>
          <Button disabled={!lines} onClick={() => close(lines)}>
            {submitLabel ?? t("pos.addSet")}
          </Button>
        </DialogFooter>
      </>
    );
  },
  {
    defaultValue: null,
    className: "max-w-[95vw] sm:max-w-3xl lg:max-w-4xl",
  },
);
