import type { table_setting } from "@/generated/tables";
import type { Knex } from "knex";

export type OrderDiscountValueType = "AMOUNT" | "PERCENTAGE";

/** A threshold rule that discounts the whole order once a minimum is reached. */
export interface OrderThresholdRule {
  enabled: boolean;
  /** Minimum order subtotal (amount rule) or minimum total qty (qty rule). */
  min: number;
  discountType: OrderDiscountValueType;
  value: number;
}

/**
 * How the variant discount unit cap is counted:
 * - `VARIANT` (default): per order line — the first `value` units of each line.
 * - `PRODUCT`: the first `value` discounted units of a product, shared across
 *   every line of that product in the order.
 * - `CATEGORY`: the first `value` discounted units within a category, shared
 *   across every line in that category.
 */
export type MaxQtyCountBy = "VARIANT" | "PRODUCT" | "CATEGORY";

export interface MaxQtyPerLineRule {
  enabled: boolean;
  /** Number of units a variant menu discount may cover. */
  value: number;
  /** Scope the `value` budget is counted over. */
  countBy: MaxQtyCountBy;
}

export interface OrderDiscountRules {
  /** Order subtotal >= `amountRule.min` -> discount the order. */
  amountRule: OrderThresholdRule;
  /** Order total qty >= `qtyRule.min` -> discount the order. */
  qtyRule: OrderThresholdRule;
  /** Cap on the units a per-line variant menu discount applies to. */
  maxQtyPerLine: MaxQtyPerLineRule;
}

export const ORDER_DISCOUNT_RULES_OPTION = "ORDER_DISCOUNT_RULES";

export const DEFAULT_ORDER_DISCOUNT_RULES: OrderDiscountRules = {
  amountRule: { enabled: false, min: 100, discountType: "PERCENTAGE", value: 0 },
  qtyRule: { enabled: false, min: 50, discountType: "PERCENTAGE", value: 0 },
  maxQtyPerLine: { enabled: true, value: 3, countBy: "VARIANT" },
};

function toNumber(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseThresholdRule(
  raw: unknown,
  fallback: OrderThresholdRule,
): OrderThresholdRule {
  const r = (raw ?? {}) as Record<string, unknown>;
  // `minAmount` / `minQty` are accepted as aliases for `min` so the stored JSON
  // can read naturally for each rule.
  const min =
    r.min !== undefined
      ? toNumber(r.min, fallback.min)
      : r.minAmount !== undefined
        ? toNumber(r.minAmount, fallback.min)
        : r.minQty !== undefined
          ? toNumber(r.minQty, fallback.min)
          : fallback.min;
  const discountType: OrderDiscountValueType =
    r.discountType === "AMOUNT" || r.discountType === "PERCENTAGE"
      ? r.discountType
      : fallback.discountType;
  return {
    enabled: Boolean(r.enabled),
    min,
    discountType,
    value: toNumber(r.value, fallback.value),
  };
}

const MAX_QTY_COUNT_BY: MaxQtyCountBy[] = ["VARIANT", "PRODUCT", "CATEGORY"];

/** Safe JSON parse of a stored `ORDER_DISCOUNT_RULES` value, filling defaults. */
export function parseOrderDiscountRules(
  value: string | null | undefined,
): OrderDiscountRules {
  let obj: Record<string, unknown> = {};
  if (value) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        obj = parsed as Record<string, unknown>;
      }
    } catch {
      // fall through to defaults
    }
  }

  const maxRaw = (obj.maxQtyPerLine ?? {}) as Record<string, unknown>;
  return {
    amountRule: parseThresholdRule(
      obj.amountRule,
      DEFAULT_ORDER_DISCOUNT_RULES.amountRule,
    ),
    qtyRule: parseThresholdRule(
      obj.qtyRule,
      DEFAULT_ORDER_DISCOUNT_RULES.qtyRule,
    ),
    maxQtyPerLine: {
      enabled:
        maxRaw.enabled === undefined
          ? DEFAULT_ORDER_DISCOUNT_RULES.maxQtyPerLine.enabled
          : Boolean(maxRaw.enabled),
      value: toNumber(
        maxRaw.value,
        DEFAULT_ORDER_DISCOUNT_RULES.maxQtyPerLine.value,
      ),
      countBy: MAX_QTY_COUNT_BY.includes(maxRaw.countBy as MaxQtyCountBy)
        ? (maxRaw.countBy as MaxQtyCountBy)
        : DEFAULT_ORDER_DISCOUNT_RULES.maxQtyPerLine.countBy,
    },
  };
}

/** The default unit cap to pass to `computeVariantDiscount` (0 = no cap). */
export function variantMaxQtyFromRules(rules: OrderDiscountRules): number {
  return rules.maxQtyPerLine.enabled && rules.maxQtyPerLine.value > 0
    ? rules.maxQtyPerLine.value
    : 0;
}

/** One order line, described enough to resolve its variant-discount unit cap. */
export interface VariantDiscountLine {
  orderDetailId: string;
  /** Units on the line. */
  qty: number;
  /** Whether this line actually carries a variant menu discount. */
  hasVariantDiscount: boolean;
  productId?: string | null;
  /** The line's (primary) category id — used only by `countBy: "CATEGORY"`. */
  categoryId?: string | null;
}

/**
 * Resolve the per-line unit cap to pass to `computeVariantDiscount` for a whole
 * order, honoring `maxQtyPerLine.countBy`:
 *
 * - `VARIANT`: every line gets the flat `value` cap.
 * - `PRODUCT` / `CATEGORY`: the `value` budget is shared across all lines of the
 *   same group and consumed in `lines` order (pass them oldest-first). A line
 *   that exhausts the remaining budget gets `0` (discount nothing).
 *
 * Returns a map keyed by `orderDetailId`. A line **absent** from the map has no
 * cap (rule disabled, `value <= 0`, or not groupable) — treat that as "discount
 * every unit". A present value `>= 0` is an exact cap (`0` = discount nothing).
 */
export function resolveVariantUnitCapByLine(
  rules: OrderDiscountRules,
  lines: VariantDiscountLine[],
): Map<string, number> {
  const rule = rules.maxQtyPerLine;
  const out = new Map<string, number>();
  const cap = rule.value;
  if (!rule.enabled || !Number.isFinite(cap) || cap <= 0) return out;

  if (rule.countBy === "VARIANT") {
    for (const l of lines) out.set(l.orderDetailId, cap);
    return out;
  }

  const consumed = new Map<string, number>();
  for (const l of lines) {
    const key =
      rule.countBy === "PRODUCT"
        ? (l.productId ?? "")
        : (l.categoryId ?? "");
    if (!key) {
      // Can't place the line in a group — fall back to the flat per-line cap.
      out.set(l.orderDetailId, cap);
      continue;
    }
    const used = consumed.get(key) ?? 0;
    const remaining = Math.max(0, cap - used);
    out.set(l.orderDetailId, remaining);
    if (l.hasVariantDiscount) {
      const qty = Number.isFinite(l.qty) && l.qty > 0 ? l.qty : 0;
      consumed.set(key, used + Math.min(qty, remaining));
    }
  }
  return out;
}

function applyRule(rule: OrderThresholdRule, subtotal: number): number {
  if (rule.value <= 0 || subtotal <= 0) return 0;
  if (rule.discountType === "PERCENTAGE") {
    // Same integer-cents flooring as applyStackDiscount / computeVariantDiscount.
    return Math.floor((Math.round(subtotal * 100) * rule.value) / 100) / 100;
  }
  return Math.min(rule.value, subtotal);
}

export interface OrderLevelDiscount {
  amount: number;
  discountType: OrderDiscountValueType;
  value: number;
  /** Which rule won ("amount" | "qty"). */
  source: "amount" | "qty";
}

/**
 * Evaluate the order-level threshold rules. When both the amount rule and the
 * qty rule qualify, the one producing the larger discount wins (rules never
 * stack). Returns `null` when nothing qualifies or the discount would be 0.
 */
export function computeOrderLevelDiscount(input: {
  subtotal: number;
  totalQty: number;
  rules: OrderDiscountRules;
}): OrderLevelDiscount | null {
  const { subtotal, totalQty, rules } = input;
  if (!Number.isFinite(subtotal) || subtotal <= 0) return null;

  const candidates: OrderLevelDiscount[] = [];

  if (rules.amountRule.enabled && subtotal >= rules.amountRule.min) {
    const amount = applyRule(rules.amountRule, subtotal);
    if (amount > 0) {
      candidates.push({
        amount,
        discountType: rules.amountRule.discountType,
        value: rules.amountRule.value,
        source: "amount",
      });
    }
  }

  if (rules.qtyRule.enabled && totalQty >= rules.qtyRule.min) {
    const amount = applyRule(rules.qtyRule, subtotal);
    if (amount > 0) {
      candidates.push({
        amount,
        discountType: rules.qtyRule.discountType,
        value: rules.qtyRule.value,
        source: "qty",
      });
    }
  }

  if (candidates.length === 0) return null;
  return candidates.reduce((best, c) => (c.amount > best.amount ? c : best));
}

/**
 * Split `totalDiscount` across lines proportionally to `weights`, in integer
 * cents, using the largest-remainder method so the shares sum back to
 * `totalDiscount` exactly. A line with weight 0 gets 0.
 */
export function allocateDiscount(
  totalDiscount: number,
  weights: number[],
): number[] {
  const n = weights.length;
  if (n === 0) return [];

  const totalCents = Math.round(totalDiscount * 100);
  if (totalCents <= 0) return weights.map(() => 0);

  const weightCents = weights.map((w) =>
    Number.isFinite(w) && w > 0 ? Math.round(w * 100) : 0,
  );
  const weightSum = weightCents.reduce((a, b) => a + b, 0);
  if (weightSum <= 0) return weights.map(() => 0);

  const exact = weightCents.map((w) => (totalCents * w) / weightSum);
  const floors = exact.map((e) => Math.floor(e));
  let remainder = totalCents - floors.reduce((a, b) => a + b, 0);

  const order = exact
    .map((e, i) => ({ i, frac: e - Math.floor(e) }))
    .sort((a, b) => b.frac - a.frac);

  const shares = floors.slice();
  for (let k = 0; k < order.length && remainder > 0; k++) {
    // Never hand a cent to a zero-weight line.
    if (weightCents[order[k].i] === 0) continue;
    shares[order[k].i] += 1;
    remainder -= 1;
  }

  return shares.map((c) => c / 100);
}

/**
 * Read the effective `ORDER_DISCOUNT_RULES` for a warehouse (branch override
 * wins over the global row). Mirrors the inline setting reads in order.ts.
 */
export async function getOrderDiscountRules(
  trx: Knex,
  warehouseId: string | null | undefined,
): Promise<OrderDiscountRules> {
  const row = await trx
    .table<table_setting>("setting")
    .where("option", ORDER_DISCOUNT_RULES_OPTION)
    .andWhere((qb) => {
      qb.where("warehouse", warehouseId ?? "").orWhereNull("warehouse");
    })
    .orderByRaw("warehouse IS NULL")
    .first();

  return parseOrderDiscountRules(row?.value ?? null);
}
