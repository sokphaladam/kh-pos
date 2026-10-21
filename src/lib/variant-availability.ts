// How many of a variant can be sold from current stock. Shared by the variant
// loader (server) and the POS / restaurant grids (client) so both agree.

export interface AvailabilityComponent {
  /** Recipe qty of this component per 1 composite. */
  qty: number;
  stock: number;
  trackStock: boolean;
  /** Component is itself a made-to-order composite (holds no own stock). */
  madeToOrder: boolean;
}

/**
 * - Stock not tracked: null (not limited).
 * - Made-to-order composite: the fewest whole units its tracked components
 *   can make; untracked and nested made-to-order components do not limit it.
 * - Anything else: its own stock.
 */
export function computeAvailableQty({
  stock,
  trackStock,
  madeToOrder,
  components,
}: {
  stock: number;
  trackStock: boolean;
  madeToOrder: boolean;
  components?: AvailabilityComponent[];
}): number | null {
  if (madeToOrder && components && components.length > 0) {
    const limits = components
      .filter((c) => c.trackStock && !c.madeToOrder && c.qty > 0)
      .map((c) => Math.max(0, Math.floor(c.stock / c.qty)));
    return limits.length > 0 ? Math.min(...limits) : null;
  }
  if (!trackStock) return null;
  return stock;
}

/** Dot / badge state for a POS card; falls back to raw stock when unknown. */
export function variantStockStatus(variant?: {
  stock?: number | null;
  availableQty?: number | null;
}) {
  if (variant && variant.availableQty !== undefined) {
    const qty = variant.availableQty;
    return { stock: qty ?? 0, isInStock: qty === null || qty > 0 };
  }
  const stock = variant?.stock || 0;
  return { stock, isInStock: stock > 0 };
}
