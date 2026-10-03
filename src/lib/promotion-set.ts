/**
 * Promotion sets ("bundle" / "combo" promotions), e.g. "Promotion 6+2":
 *
 *   6 x Beer        -> full price   (the condition)
 *   2 x Beer        -> 100% off     (the reward)
 *   1 x Meat (cat.) -> 100% off     (the reward)
 *
 * A promotion set is a list of slots. Each slot needs `qty` units of something
 * (a variant, any variant of a product, or anything in a category) and gives
 * those units a discount (0 = the slot is only a condition). When every slot of
 * a set can be filled from the order, the set is applied once; it keeps being
 * applied while the order still has enough unused units (up to
 * `maxApplyPerOrder`). A unit is only ever used by one slot of one set.
 *
 * When a set runs (date range, daily happy-hour window) is judged per order
 * line, by the time the line was added (`orderedAt`), not by "now": a beer
 * ordered at 19:50 keeps its happy-hour price when the bill is recalculated at
 * 20:10. Lines not yet saved (no `orderedAt`) are judged at `now`.
 *
 * This file is the single source of truth for that math. It is pure (no DB, no
 * React) so the order engine (server, writes `discount_log` rows) and the
 * restaurant POS cart (client, live preview) run exactly the same code and
 * always agree on what the customer pays.
 */

export type PromotionMatchType = "VARIANT" | "PRODUCT" | "CATEGORY";
export type PromotionDiscountType = "PERCENTAGE" | "AMOUNT";

export const PROMOTION_MATCH_TYPES: PromotionMatchType[] = [
  "VARIANT",
  "PRODUCT",
  "CATEGORY",
];

/** One slot of a promotion set. */
export interface PromotionSetItem {
  id: string;
  matchType: PromotionMatchType;
  /** variant id / product id / category id, depending on `matchType`. */
  matchId: string;
  /** Display name of the matched variant / product / category. */
  matchTitle?: string;
  /** Image of the matched variant / product / category (for menu cards). */
  matchImage?: string | null;
  /** Units this slot needs per application of the set. */
  qty: number;
  /** Discount on each unit of this slot. Value 0 = condition only. */
  discountType: PromotionDiscountType;
  discountValue: number;
}

export interface PromotionSetDefinition {
  id: string;
  title: string;
  description?: string | null;
  warehouseId: string | null;
  isActive: boolean;
  /** Inclusive validity window, `YYYY-MM-DD HH:mm:ss`; null = open-ended. */
  startAt?: string | null;
  endAt?: string | null;
  /**
   * Daily time window ("happy hour"), `HH:mm`, start inclusive / end
   * exclusive. Both null = all day. An end before the start crosses midnight
   * (22:00 -> 02:00).
   */
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
  /** How many times the set may apply on one order; null / 0 = unlimited. */
  maxApplyPerOrder?: number | null;
  /** Higher priority sets claim units first. */
  priority: number;
  items: PromotionSetItem[];
}

/** One order line, described enough to match it against promotion slots. */
export interface PromotionOrderLine {
  orderDetailId: string;
  variantId: string | null;
  productId?: string | null;
  categoryId?: string | null;
  /** Unit price (before modifiers and other discounts). */
  unitPrice: number;
  qty: number;
  /** When the line was added, `YYYY-MM-DD HH:mm:ss`; missing = `now`. */
  orderedAt?: string | null;
}

/** The discount a promotion set puts on one order line. */
export interface PromotionLineDiscount {
  orderDetailId: string;
  promotionId: string;
  title: string;
  /** Units of the line consumed by the set (condition + reward units). */
  units: number;
  /** Units of the line that received a discount. */
  discountedUnits: number;
  amount: number;
}

export interface PromotionSetResult {
  lines: PromotionLineDiscount[];
  /** How many times each promotion set was applied. */
  applied: { promotionId: string; title: string; times: number }[];
  /**
   * Every line a set used, including full-price condition lines (amount 0).
   * Display only (receipt grouping); pricing reads `lines`.
   */
  members: PromotionLineDiscount[];
}

/** `discount_log.discount_id` prefix for promotion-set rows: `promo:<setId>`. */
export const PROMOTION_DISCOUNT_PREFIX = "promo:";

export function promotionDiscountId(promotionId: string): string {
  return `${PROMOTION_DISCOUNT_PREFIX}${promotionId}`;
}

export function isPromotionDiscountId(
  discountId: string | null | undefined,
): boolean {
  return !!discountId && discountId.startsWith(PROMOTION_DISCOUNT_PREFIX);
}

/** Hard stop so a malformed set can never spin forever. */
const MAX_APPLICATIONS = 1000;

const SPECIFICITY: Record<PromotionMatchType, number> = {
  VARIANT: 0,
  PRODUCT: 1,
  CATEGORY: 2,
};

/** Discount for one unit, same integer-cents flooring as the other engines. */
export function promotionUnitDiscount(
  unitPrice: number,
  discountType: PromotionDiscountType,
  value: number,
): number {
  const price = Number(unitPrice);
  const val = Number(value);
  if (!Number.isFinite(price) || price <= 0) return 0;
  if (!Number.isFinite(val) || val <= 0) return 0;
  if (discountType === "PERCENTAGE") {
    const pct = Math.min(val, 100);
    return Math.floor((Math.round(price * 100) * pct) / 100) / 100;
  }
  return Math.min(val, price);
}

/** Whether a set is switched on and has at least one usable slot. */
export function isPromotionSetEnabled(promotion: PromotionSetDefinition) {
  return (
    promotion.isActive && promotion.items.some((i) => i.qty > 0 && !!i.matchId)
  );
}

/** Whether `at`'s time of day falls inside the set's daily window. */
export function isWithinDailyHours(
  promotion: Pick<PromotionSetDefinition, "dailyStartTime" | "dailyEndTime">,
  at: string,
): boolean {
  const start = promotion.dailyStartTime?.slice(0, 5);
  const end = promotion.dailyEndTime?.slice(0, 5);
  if (!start || !end || start === end) return true;
  const time = at.slice(11, 16);
  return start < end
    ? time >= start && time < end
    : time >= start || time < end; // crosses midnight
}

/**
 * Whether the set runs at `at` (`YYYY-MM-DD HH:mm:ss`): enabled, inside its
 * date range and inside its daily hours.
 */
export function isPromotionSetActive(
  promotion: PromotionSetDefinition,
  at: string,
): boolean {
  if (!isPromotionSetEnabled(promotion)) return false;
  if (promotion.startAt && at < promotion.startAt) return false;
  if (promotion.endAt && at > promotion.endAt) return false;
  return isWithinDailyHours(promotion, at);
}

function lineMatches(line: PromotionOrderLine, item: PromotionSetItem) {
  switch (item.matchType) {
    case "VARIANT":
      return !!line.variantId && line.variantId === item.matchId;
    case "PRODUCT":
      return !!line.productId && line.productId === item.matchId;
    case "CATEGORY":
      return !!line.categoryId && line.categoryId === item.matchId;
    default:
      return false;
  }
}

interface Unit {
  line: number;
  price: number;
  used: boolean;
}

/**
 * Apply every active promotion set to an order and return the per-line
 * discounts. Deterministic for a given input (independent of line order), so
 * the client and server produce identical results. A line only counts toward
 * a set that was running when the line was ordered (`orderedAt`).
 *
 * Allocation rules, per application of a set:
 * - Slots are filled most specific first (variant, then product, then
 *   category); within the same specificity, condition (paid) slots first.
 * - A paid slot takes the most expensive matching units, a discounted slot
 *   takes the cheapest ones ("cheapest item free"), the industry default.
 * - If any slot cannot be filled, the application is rolled back and the set
 *   stops applying.
 * Sets run by `priority` (high first), then by title / id.
 */
export function applyPromotionSets(
  promotions: PromotionSetDefinition[],
  lines: PromotionOrderLine[],
  now: string,
): PromotionSetResult {
  const result: PromotionSetResult = { lines: [], applied: [], members: [] };
  const active = promotions
    .filter(isPromotionSetEnabled)
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        a.title.localeCompare(b.title) ||
        a.id.localeCompare(b.id),
    );
  if (active.length === 0 || lines.length === 0) return result;

  // Expand the order into single units, sorted by price then line id so the
  // allocation never depends on the order the lines arrive in.
  const sortedLines = lines
    .map((line, index) => ({ line, index }))
    .sort((a, b) =>
      a.line.orderDetailId.localeCompare(b.line.orderDetailId),
    );
  const units: Unit[] = [];
  for (const { line, index } of sortedLines) {
    const qty = Math.max(0, Math.floor(Number(line.qty) || 0));
    const price = Math.max(0, Number(line.unitPrice) || 0);
    for (let k = 0; k < qty; k++) units.push({ line: index, price, used: false });
  }
  // Stable sort: ties keep line-id order.
  const byPriceDesc = [...units].sort((a, b) => b.price - a.price);
  const byPriceAsc = [...units].sort((a, b) => a.price - b.price);

  // key: `${promotionId}|${lineIndex}`
  const acc = new Map<string, PromotionLineDiscount>();

  for (const promotion of active) {
    // Lines ordered while this set was running (date range + daily hours).
    const eligible = lines.map((l) =>
      isPromotionSetActive(promotion, l.orderedAt || now),
    );
    if (!eligible.some(Boolean)) continue;

    const slots = promotion.items
      .filter((i) => i.qty > 0 && !!i.matchId)
      .sort((a, b) => {
        const paidA = a.discountValue > 0 ? 1 : 0;
        const paidB = b.discountValue > 0 ? 1 : 0;
        return (
          SPECIFICITY[a.matchType] - SPECIFICITY[b.matchType] ||
          paidA - paidB ||
          a.id.localeCompare(b.id)
        );
      });

    const limit =
      promotion.maxApplyPerOrder && promotion.maxApplyPerOrder > 0
        ? Math.min(promotion.maxApplyPerOrder, MAX_APPLICATIONS)
        : MAX_APPLICATIONS;

    let times = 0;
    while (times < limit) {
      const taken: { unit: Unit; slot: PromotionSetItem }[] = [];
      let ok = true;

      for (const slot of slots) {
        const pool = slot.discountValue > 0 ? byPriceAsc : byPriceDesc;
        let need = Math.floor(slot.qty);
        for (const unit of pool) {
          if (need === 0) break;
          if (
            unit.used ||
            !eligible[unit.line] ||
            !lineMatches(lines[unit.line], slot)
          ) {
            continue;
          }
          unit.used = true;
          taken.push({ unit, slot });
          need--;
        }
        if (need > 0) {
          ok = false;
          break;
        }
      }

      if (!ok) {
        for (const t of taken) t.unit.used = false;
        break;
      }

      times++;
      for (const { unit, slot } of taken) {
        const key = `${promotion.id}|${unit.line}`;
        let row = acc.get(key);
        if (!row) {
          row = {
            orderDetailId: lines[unit.line].orderDetailId,
            promotionId: promotion.id,
            title: promotion.title,
            units: 0,
            discountedUnits: 0,
            amount: 0,
          };
          acc.set(key, row);
        }
        const off = promotionUnitDiscount(
          unit.price,
          slot.discountType,
          slot.discountValue,
        );
        row.units += 1;
        if (off > 0) {
          row.discountedUnits += 1;
          // Sum in cents to avoid float drift.
          row.amount = Math.round(row.amount * 100 + off * 100) / 100;
        }
      }
    }

    if (times > 0) {
      result.applied.push({
        promotionId: promotion.id,
        title: promotion.title,
        times,
      });
    }
  }

  result.members = [...acc.values()];
  // Only lines that actually got money off carry a discount row.
  result.lines = result.members.filter((r) => r.amount > 0);
  return result;
}

/** Words used by `describePromotionSet`; pass translated ones from the UI. */
export interface PromotionSummaryLabels {
  free: string;
  percentOff: (value: number) => string;
  amountOff: (value: number) => string;
}

const DEFAULT_SUMMARY_LABELS = (currencySymbol: string): PromotionSummaryLabels => ({
  free: "free",
  percentOff: (v) => `-${v}%`,
  amountOff: (v) => `-${currencySymbol}${v} each`,
});

/** Human summary, e.g. "6 x Beer + 2 x Beer (free) + 1 x Meat (free)". */
export function describePromotionSet(
  items: PromotionSetItem[],
  currencySymbol = "$",
  labels: PromotionSummaryLabels = DEFAULT_SUMMARY_LABELS(currencySymbol),
): string {
  return items
    .filter((i) => i.qty > 0)
    .map((i) => {
      const name = i.matchTitle || i.matchType.toLowerCase();
      const base = `${i.qty} x ${name}`;
      if (!(i.discountValue > 0)) return base;
      if (i.discountType === "PERCENTAGE") {
        return i.discountValue >= 100
          ? `${base} (${labels.free})`
          : `${base} (${labels.percentOff(i.discountValue)})`;
      }
      return `${base} (${labels.amountOff(i.discountValue)})`;
    })
    .join(" + ");
}
