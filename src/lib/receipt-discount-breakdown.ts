/**
 * Where an order's discount came from, for the receipt summary. Built from the
 * per-line `discount_log` rows (see the pricing table in CLAUDE.md) and summed
 * per source, in the order the engine applies them:
 * promotion sets -> menu (variant) -> campaigns -> manual -> order-level.
 */

import { isPromotionDiscountId } from "./promotion-set";

interface LineDiscount {
  discountId: string;
  name?: string | null;
  amount: number | string;
  isManualDiscount?: boolean;
}

interface DiscountedLine {
  discounts?: LineDiscount[] | null;
}

export interface ReceiptDiscountSource {
  key: string;
  kind: "promotion" | "variant" | "campaign" | "manual" | "order" | "other";
  label: string;
  amount: number;
}

const RANK: Record<ReceiptDiscountSource["kind"], number> = {
  promotion: 0,
  variant: 1,
  campaign: 2,
  manual: 3,
  order: 4,
  other: 5,
};

function sourceOf(d: LineDiscount): Omit<ReceiptDiscountSource, "amount"> {
  if (isPromotionDiscountId(d.discountId)) {
    return {
      key: d.discountId,
      kind: "promotion",
      label: `Promotion: ${d.name || "Set"}`,
    };
  }
  if (d.discountId === "variant") {
    return { key: "variant", kind: "variant", label: "Menu discount" };
  }
  if (d.discountId === "manual" || d.isManualDiscount) {
    return { key: "manual", kind: "manual", label: "Manual discount" };
  }
  if (d.discountId === "order") {
    return { key: "order", kind: "order", label: d.name || "Order discount" };
  }
  return { key: d.discountId, kind: "campaign", label: d.name || "Discount" };
}

/**
 * Discount per source, largest-first within the same kind. When
 * `totalDiscount` (what the receipt charges) is given and the rows don't add
 * up to it, the gap is shown as "Other discount" so the list always matches.
 */
export function summarizeReceiptDiscounts(
  lines: DiscountedLine[] | null | undefined,
  totalDiscount?: number,
): ReceiptDiscountSource[] {
  const byKey = new Map<string, ReceiptDiscountSource>();
  for (const line of lines ?? []) {
    for (const d of line.discounts ?? []) {
      const amount = Number(d.amount || 0);
      if (!(amount > 0)) continue;
      const src = sourceOf(d);
      const row = byKey.get(src.key) ?? { ...src, amount: 0 };
      row.amount = Math.round(row.amount * 100 + amount * 100) / 100;
      byKey.set(src.key, row);
    }
  }

  const list = [...byKey.values()].sort(
    (a, b) => RANK[a.kind] - RANK[b.kind] || b.amount - a.amount,
  );

  if (totalDiscount !== undefined) {
    const listed = list.reduce((a, b) => a + Math.round(b.amount * 100), 0);
    const gap = Math.round(Number(totalDiscount || 0) * 100) - listed;
    if (gap > 0) {
      list.push({
        key: "other",
        kind: "other",
        label: "Other discount",
        amount: gap / 100,
      });
    }
  }
  return list;
}
