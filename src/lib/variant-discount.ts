export type VariantDiscountType = "AMOUNT" | "PERCENTAGE";

/**
 * The single source of truth for a product-variant "menu discount".
 *
 * Used by the read loaders (to show a struck-through price on the POS grid and
 * the public menu) and by the order engine (to apply the same discount as a
 * `discount_log` row when the variant is added to an order). Keep both callers
 * on this function so the price the customer sees always matches what they pay.
 *
 * Rounding matches `applyStackDiscount` / `applyDiscountToOrderItem`.
 */
export function computeVariantDiscount(
  unitPrice: number,
  type: VariantDiscountType | null | undefined,
  value: number | null | undefined,
  qty = 1,
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
  const lineDiscountAmount = Math.min(perUnit * safeQty, price * safeQty);

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
