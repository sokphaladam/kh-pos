import { table_variant_composite } from "@/generated/tables";
import { Knex } from "knex";

export interface StockLine {
  variantId: string;
  qty: number;
}

// Guards against bad recipe data (A uses B, B uses A).
const MAX_RECIPE_DEPTH = 5;

/**
 * Resolve which variants a sale of `qty` x `variantId` takes out of stock.
 *
 * - Normal variant: the variant itself.
 * - Composite variant made to order (product.use_production = 0): its
 *   `variant_composite` recipe, multiplied by qty, expanded recursively so a
 *   component that is itself made to order is expanded too.
 * - Composite variant produced ahead (product.use_production = 1): the variant
 *   itself, because COMPOSE_IN already put it in stock and COMPOSE_OUT already
 *   took its components out.
 *
 * Lines for the same variant are merged.
 */
export async function resolveStockLines(
  db: Knex,
  variantId: string,
  qty: number,
): Promise<StockLine[]> {
  const merged = new Map<string, number>();
  await expand(db, variantId, qty, [], merged);
  return Array.from(merged, ([id, q]) => ({ variantId: id, qty: q }));
}

async function expand(
  db: Knex,
  variantId: string,
  qty: number,
  path: string[],
  out: Map<string, number>,
) {
  const add = () => out.set(variantId, (out.get(variantId) ?? 0) + qty);

  if (qty <= 0) return;
  if (path.includes(variantId) || path.length >= MAX_RECIPE_DEPTH) {
    throw new Error(
      `Composite recipe loop or too deep for variant ${variantId}`,
    );
  }

  const variant: { is_composite: number | null; use_production: number | null } =
    await db
      .table("product_variant")
      .innerJoin("product", "product_variant.product_id", "product.id")
      .where("product_variant.id", variantId)
      .select("product_variant.is_composite", "product.use_production")
      .first();

  if (!variant || !variant.is_composite || variant.use_production) {
    return add();
  }

  const components: table_variant_composite[] = await db
    .table<table_variant_composite>("variant_composite")
    .where("variant_composite_id", variantId)
    .whereNull("deleted_at");

  // A composite without a recipe is treated as a normal item so the sale
  // still leaves a trace (stock movement or backlog) instead of nothing.
  if (components.length === 0) return add();

  for (const component of components) {
    await expand(
      db,
      component.variant_component_id,
      (component.qty ?? 0) * qty,
      [...path, variantId],
      out,
    );
  }
}
