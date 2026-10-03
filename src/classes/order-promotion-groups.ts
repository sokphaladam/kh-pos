import { Formatter } from "@/lib/formatter";
import {
  applyPromotionSets,
  isPromotionDiscountId,
  PROMOTION_DISCOUNT_PREFIX,
} from "@/lib/promotion-set";
import { Knex } from "knex";
import type { OrderDetail, OrderLinePromotion } from "./order";
import { PromotionSetService } from "./promotion-set";

/**
 * Fill `OrderDetail.promotions` so receipts can group the lines of each
 * promotion set together.
 *
 * Only reward lines carry a `promo:<id>` discount row; the full-price
 * condition lines ("buy 6") don't. So the sets named in those rows are re-run
 * through the same pure engine, judged at each line's order time, to find
 * every line (and how many of its units) a set used. Money always comes from
 * the stored rows, never from the re-run. If a set was edited since and the
 * re-run disagrees, its reward lines are still grouped from the stored rows.
 *
 * Mutates and returns `lines`. No-op (no queries) for orders without promos.
 */
export async function attachPromotionGroups(
  db: Knex,
  lines: OrderDetail[],
): Promise<OrderDetail[]> {
  const stored = lines.flatMap((l) =>
    (l.discounts ?? [])
      .filter((d) => isPromotionDiscountId(d.discountId))
      .map((d) => ({
        orderDetailId: l.orderDetailId,
        promotionId: d.discountId.slice(PROMOTION_DISCOUNT_PREFIX.length),
        title: d.name,
        amount: Number(d.amount || 0),
      })),
  );
  if (stored.length === 0) return lines;

  const promotionIds = [...new Set(stored.map((s) => s.promotionId))];
  const definitions = (
    await new PromotionSetService(db).getByIds(promotionIds)
  ).map((p) => ({
    // Group the way it was priced, even if the set was switched off later.
    ...p,
    isActive: true,
  }));

  const needsCategory = definitions.some((p) =>
    p.items.some((i) => i.matchType === "CATEGORY"),
  );
  const productIds = [
    ...new Set(
      lines
        .map((l) => l.productVariant?.productId)
        .filter((v): v is string => !!v),
    ),
  ];
  const categoryByProduct = new Map<string, string>();
  if (needsCategory && productIds.length > 0) {
    const rows: { product_id: string; category_id: string }[] = await db
      .table("product_categories")
      .whereIn("product_id", productIds)
      .select("product_id", "category_id");
    for (const r of rows) {
      if (!categoryByProduct.has(r.product_id)) {
        categoryByProduct.set(r.product_id, r.category_id);
      }
    }
  }

  const { members } = applyPromotionSets(
    definitions,
    lines.map((l) => {
      const productId = l.productVariant?.productId ?? null;
      return {
        orderDetailId: l.orderDetailId,
        variantId: l.variantId,
        productId,
        categoryId: productId
          ? (categoryByProduct.get(productId) ?? null)
          : null,
        unitPrice: Number(l.price || 0),
        qty: Number(l.qty || 0),
        orderedAt: Formatter.toDbDateTime(l.createdAt),
      };
    }),
    Formatter.getNowDateTime(),
  );

  const byLine = new Map<string, OrderLinePromotion[]>();
  const add = (orderDetailId: string, p: OrderLinePromotion) => {
    const list = byLine.get(orderDetailId) ?? [];
    list.push(p);
    byLine.set(orderDetailId, list);
  };
  const storedKey = (s: { promotionId: string; orderDetailId: string }) =>
    `${s.promotionId}|${s.orderDetailId}`;
  const storedByKey = new Map(stored.map((s) => [storedKey(s), s] as const));
  const titleById = new Map(stored.map((s) => [s.promotionId, s.title]));

  for (const m of members) {
    if (!titleById.has(m.promotionId)) continue;
    const s = storedByKey.get(storedKey(m));
    add(m.orderDetailId, {
      promotionId: m.promotionId,
      title: titleById.get(m.promotionId) || m.title,
      units: m.units,
      discountedUnits: m.discountedUnits,
      amount: s ? s.amount : 0,
    });
    storedByKey.delete(storedKey(m));
  }
  // Stored reward rows the re-run didn't reproduce.
  for (const s of storedByKey.values()) {
    add(s.orderDetailId, {
      promotionId: s.promotionId,
      title: s.title,
      units: null,
      discountedUnits: null,
      amount: s.amount,
    });
  }

  for (const l of lines) {
    const list = byLine.get(l.orderDetailId);
    if (list) l.promotions = list;
  }
  return lines;
}
