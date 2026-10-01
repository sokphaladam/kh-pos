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
import { cn } from "@/lib/utils";
import { Check, Gift } from "lucide-react";
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

function CandidateImage({ item }: { item: ProductSearchResult }) {
  const url = item.images?.find((i) => i.productVariantId === item.variantId)
    ?.url;
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="size-12 rounded-md object-contain" />
  ) : (
    <div className="size-12 rounded-md bg-muted" />
  );
}

/**
 * Asks the cashier which product to use for the promotion-set slots that have
 * more than one option (e.g. "1 x any meat"). Resolves with the cart lines,
 * or null when cancelled.
 */
export const restaurantPromotionPicker = createDialog<
  { title: string; slots: PromotionSetChoiceSlot[] },
  PromotionSetCartLine[] | null
>(
  ({ title, slots, close }) => {
    const { t, rewardLabel } = usePromotionSetI18n();
    const tCommon = useTranslations("common");
    const { formatForDisplay } = useCurrencyFormat();
    const [chosen, setChosen] = useState<(ProductSearchResult | undefined)[]>(
      () => slots.map((s) => (s.candidates.length === 1 ? s.candidates[0] : undefined)),
    );

    const lines = useMemo(
      () => buildPromotionCartLines(slots, chosen),
      [slots, chosen],
    );

    return (
      <>
        <DialogHeader>
          <DialogTitle>{t("pos.pickerTitle", { title })}</DialogTitle>
          <DialogDescription>{t("pos.pickerHint")}</DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto py-2">
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
                {!fixed && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {slot.candidates.map((c) => {
                      const selected = chosen[index]?.variantId === c.variantId;
                      return (
                        <button
                          type="button"
                          key={c.variantId}
                          onClick={() =>
                            setChosen((prev) => {
                              const next = [...prev];
                              next[index] = c;
                              return next;
                            })
                          }
                          className={cn(
                            "relative flex items-center gap-2 rounded-lg border p-2 text-left transition-colors",
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "hover:bg-muted/60",
                          )}
                        >
                          <CandidateImage item={c} />
                          <div className="min-w-0">
                            <div className="line-clamp-2 text-xs font-medium">
                              {c.productTitle}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatForDisplay(Number(c.price ?? 0))}
                            </div>
                          </div>
                          {selected && (
                            <Check className="absolute right-1.5 top-1.5 size-4 text-primary" />
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
            {t("pos.addSet")}
          </Button>
        </DialogFooter>
      </>
    );
  },
  { defaultValue: null },
);
