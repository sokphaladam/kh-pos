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
  discountType?: "PERCENTAGE" | "AMOUNT" | null;
  value?: number | string | null;
}

interface DiscountedLine {
  discounts?: LineDiscount[] | null;
}

export interface ReceiptDiscountSource {
  key: string;
  kind: "promotion" | "variant" | "campaign" | "manual" | "order" | "other";
  label: string;
  amount: number;
  /**
   * Percent shown next to the source: the configured rate when every row of
   * the source is the same PERCENTAGE discount, else its share of `subtotal`.
   * Null when neither is known.
   */
  percent: number | null;
}

/** "Manual discount (2.5%)": the label with its percent, as receipts print it. */
export function discountSourceLabel(source: ReceiptDiscountSource): string {
  return source.percent !== null
    ? `${source.label} (${Number(source.percent.toFixed(2))}%)`
    : source.label;
}

type Accumulator = ReceiptDiscountSource & { rate: number | null | "mixed" };

const RANK: Record<ReceiptDiscountSource["kind"], number> = {
  promotion: 0,
  variant: 1,
  campaign: 2,
  manual: 3,
  order: 4,
  other: 5,
};

function sourceOf(
  d: LineDiscount,
): Omit<ReceiptDiscountSource, "amount" | "percent"> {
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
 * `subtotal` (before discounts) gives the percent of non-percentage sources.
 */
export function summarizeReceiptDiscounts(
  lines: DiscountedLine[] | null | undefined,
  totalDiscount?: number,
  subtotal?: number,
): ReceiptDiscountSource[] {
  const base = Number(subtotal || 0);
  const shareOf = (amount: number) =>
    base > 0 ? Math.round((amount / base) * 10000) / 100 : null;

  const byKey = new Map<string, Accumulator>();
  for (const line of lines ?? []) {
    for (const d of line.discounts ?? []) {
      const amount = Number(d.amount || 0);
      if (!(amount > 0)) continue;
      const src = sourceOf(d);
      const rate =
        d.discountType === "PERCENTAGE" && Number(d.value) > 0
          ? Number(d.value)
          : null;
      const row: Accumulator = byKey.get(src.key) ?? {
        ...src,
        amount: 0,
        percent: null,
        rate,
      };
      if (row.rate !== rate) row.rate = "mixed";
      row.amount = Math.round(row.amount * 100 + amount * 100) / 100;
      byKey.set(src.key, row);
    }
  }

  const list: ReceiptDiscountSource[] = [...byKey.values()]
    .map(({ rate, ...row }) => ({
      ...row,
      percent:
        typeof rate === "number" ? Math.min(rate, 100) : shareOf(row.amount),
    }))
    .sort(
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
        percent: shareOf(gap / 100),
      });
    }
  }
  return list;
}
