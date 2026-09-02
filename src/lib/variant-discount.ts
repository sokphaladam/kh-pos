export type VariantDiscountType = "AMOUNT" | "PERCENTAGE";

/**
 * Restaurant rule: a product-variant menu discount only applies to the first
 * N units of that variant on an order line. Units beyond this cap are charged
 * full price. Counted per order line.
 */
export const VARIANT_DISCOUNT_MAX_QTY = 3;

/**
 * The single source of truth for a product-variant "menu discount".
 *
 * Used by the read loaders (to show a struck-through price on the POS grid and
 * the public menu) and by the order engine (to apply the same discount as a
 * `discount_log` row when the variant is added to an order). Keep both callers
 * on this function so the price the customer sees always matches what they pay.
 *
 * Rounding matches `applyStackDiscount` / `applyDiscountToOrderItem`.
 *
 * `lineDiscountAmount` is capped at the first `maxQty` units of the line (the
 * order-discount rule "discount effect only MAX_QTY"): units beyond the cap are
 * charged full price. `maxQty` defaults to `VARIANT_DISCOUNT_MAX_QTY`; pass `0`
 * (or a negative value) to disable the cap so every unit is discounted.
 * `discountedUnitPrice` is unaffected (it is the per-unit price used for the
 * menu badge / struck-through price).
 */
export function computeVariantDiscount(
  unitPrice: number,
  type: VariantDiscountType | null | undefined,
  value: number | null | undefined,
  qty = 1,
  maxQty: number = VARIANT_DISCOUNT_MAX_QTY,
): { discountedUnitPrice: number; lineDiscountAmount: number } | null {
  const price = Number(unitPrice);
  const val = Number(value);

  if (
    !type ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isFinite(val) ||
    val <= 0
  ) {
    return null;
  }

  let perUnit: number;
  if (type === "PERCENTAGE") {
    perUnit = Math.floor((Math.round(price * 100) * val) / 100) / 100;
  } else {
    perUnit = Math.min(val, price);
  }

  if (perUnit <= 0) return null;

  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
  // Only the first `maxQty` units of the line are discounted; any remaining
  // units are charged full price. A non-positive cap means "no cap".
  const cap = Number.isFinite(maxQty) && maxQty > 0 ? maxQty : safeQty;
  const discountedQty = Math.min(safeQty, cap);
  const lineDiscountAmount = Math.min(
    perUnit * discountedQty,
    price * discountedQty,
  );

  return {
    discountedUnitPrice: Math.max(0, price - perUnit),
    lineDiscountAmount,
  };
}

/** Short badge label, e.g. "-10%" or "-$2". */
export function variantDiscountLabel(
  type: VariantDiscountType | null | undefined,
  value: number | null | undefined,
  currencySymbol = "$",
): string | null {
  const val = Number(value);
  if (!type || !Number.isFinite(val) || val <= 0) return null;
  return type === "PERCENTAGE"
    ? `-${val}%`
    : `-${currencySymbol}${val}`;
}
