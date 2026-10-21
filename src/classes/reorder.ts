import { Formatter } from "@/lib/formatter";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import moment from "moment-timezone";
import { z } from "zod";
import { stockItemsQuery } from "./stock-count";

// Movements that consume stock in the branch: sales (net of returns),
// production, waste / staff meals (DAMAGE) and count corrections.
const CONSUMPTION = [
  "SALE",
  "RETURN",
  "COMPOSE_OUT",
  "DAMAGE",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
];

export const reorderParamsSchema = z.object({
  lookbackDays: z.coerce.number().int().min(1).max(180).default(14),
  leadTimeDays: z.coerce.number().min(0).max(60).default(1),
  orderCycleDays: z.coerce.number().min(0).max(60).default(2),
  safetyDays: z.coerce.number().min(0).max(60).default(1),
});

export type ReorderParams = z.infer<typeof reorderParamsSchema>;

export type ReorderStatus = "OUT" | "ORDER" | "OK" | "NO_USAGE";

export interface ReorderItem {
  variantId: string;
  productTitle: string;
  variantName: string;
  categoryTitle: string | null;
  supplierId: string | null;
  supplierName: string | null;
  image: string | null;
  currentQty: number;
  avgDailyUsage: number;
  daysOfStock: number | null;
  reorderPoint: number;
  parLevel: number;
  orderQty: number;
  unitCost: number;
  orderValue: number;
  /** What the product currently has saved as low / ideal stock. */
  savedLowStockQty: number | null;
  savedIdealStockQty: number | null;
  status: ReorderStatus;
}

export const applyReorderLevelsSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().nonempty(),
        lowStockQty: z.number().int().min(0),
        idealStockQty: z.number().int().min(0),
      }),
    )
    .min(1)
    .max(500),
});

export class ReorderService {
  constructor(
    protected db: Knex,
    protected user: UserInfo,
  ) {}

  /**
   * Reorder point = average daily usage x (lead time + safety days);
   * par level = average daily usage x (lead time + order cycle + safety days).
   * Order up to par when stock is at or below the reorder point.
   */
  async suggestions(params: ReorderParams): Promise<ReorderItem[]> {
    const db = this.db;
    const warehouseId = this.user.currentWarehouseId!;
    // Whole days before today, so a half-finished day does not dilute usage.
    const since = moment
      .tz(Formatter.getNowDate(), "Asia/Phnom_Penh")
      .subtract(params.lookbackDays, "days")
      .format("YYYY-MM-DD 00:00:00");
    const until = `${Formatter.getNowDate()} 00:00:00`;

    const [items, stockRows, usageRows] = await Promise.all([
      stockItemsQuery(db, this.user)
        .leftJoin("supplier as s", "s.id", "p.supplier_id")
        .select(
          "p.supplier_id as supplierId",
          "s.name as supplierName",
          "v.low_stock_qty as savedLowStockQty",
          "v.ideal_stock_qty as savedIdealStockQty",
        )
        .orderBy([{ column: "s.name" }, { column: "p.title" }]),
      db
        .table("inventory as i")
        .innerJoin("warehouse_slot as ws", "ws.id", "i.slot_id")
        .leftJoin("product_lot as l", "l.id", "i.lot_id")
        .where("ws.warehouse_id", warehouseId)
        .groupBy("i.variant_id")
        .select(
          "i.variant_id",
          db.raw("SUM(i.qty) as qty"),
          // Average cost of what is on hand, for the order value.
          db.raw(
            "SUM(CASE WHEN i.qty > 0 THEN i.qty * l.cost_per_unit END) / NULLIF(SUM(CASE WHEN i.qty > 0 AND l.cost_per_unit IS NOT NULL THEN i.qty END), 0) as avg_cost",
          ),
        ),
      db
        .table("inventory_transactions as t")
        .innerJoin("warehouse_slot as ws", "ws.id", "t.slot_id")
        .where("ws.warehouse_id", warehouseId)
        .whereIn("t.transaction_type", CONSUMPTION)
        .where("t.created_at", ">=", since)
        .where("t.created_at", "<", until)
        .groupBy("t.variant_id")
        .select("t.variant_id", db.raw("-SUM(t.qty) as used")),
    ]);

    const stockBy = new Map(
      (stockRows as { variant_id: string; qty: string; avg_cost: string | null }[]).map(
        (r) => [r.variant_id, r],
      ),
    );
    const usageBy = new Map(
      (usageRows as { variant_id: string; used: string }[]).map((r) => [
        r.variant_id,
        Math.max(0, Number(r.used || 0)),
      ]),
    );

    const cover = params.leadTimeDays + params.safetyDays;
    const parDays = cover + params.orderCycleDays;

    return (
      items as (Omit<
        ReorderItem,
        | "currentQty"
        | "avgDailyUsage"
        | "daysOfStock"
        | "reorderPoint"
        | "parLevel"
        | "orderQty"
        | "unitCost"
        | "orderValue"
        | "status"
      > & { purchasedCost: string | null })[]
    ).map((item) => {
      const stock = stockBy.get(item.variantId);
      const currentQty = Number(stock?.qty || 0);
      const avgDailyUsage = (usageBy.get(item.variantId) ?? 0) / params.lookbackDays;
      const reorderPoint = Math.ceil(avgDailyUsage * cover);
      const parLevel = Math.ceil(avgDailyUsage * parDays);

      let status: ReorderStatus = "OK";
      if (avgDailyUsage === 0) status = "NO_USAGE";
      else if (currentQty <= 0) status = "OUT";
      else if (currentQty <= reorderPoint) status = "ORDER";

      const orderQty =
        status === "OUT" || status === "ORDER"
          ? Math.max(0, parLevel - currentQty)
          : 0;
      const unitCost =
        stock?.avg_cost != null
          ? Number(stock.avg_cost)
          : Number(item.purchasedCost || 0);

      return {
        variantId: item.variantId,
        productTitle: item.productTitle,
        variantName: item.variantName,
        categoryTitle: item.categoryTitle,
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        image: item.image,
        savedLowStockQty: item.savedLowStockQty,
        savedIdealStockQty: item.savedIdealStockQty,
        currentQty,
        avgDailyUsage,
        daysOfStock: avgDailyUsage > 0 ? currentQty / avgDailyUsage : null,
        reorderPoint,
        parLevel,
        orderQty,
        unitCost,
        orderValue: orderQty * unitCost,
        status,
      };
    });
  }

  /**
   * Saves reorder point / par level as the variants' low / ideal stock, which
   * drive the low-stock alerts and purchase-order quantities. Those fields are
   * shared by every branch, so only the main branch may set them.
   */
  async applyLevels(
    items: z.infer<typeof applyReorderLevelsSchema>["items"],
  ): Promise<number> {
    if (!this.user.warehouse?.isMain) {
      throw new Error("Only the main branch can change stock levels");
    }
    const now = Formatter.getNowDateTime();
    await this.db.transaction(async (trx) => {
      for (const item of items) {
        await trx
          .table("product_variant")
          .where("id", item.variantId)
          .update({
            low_stock_qty: item.lowStockQty,
            ideal_stock_qty: item.idealStockQty,
            updated_at: now,
          });
      }
    });
    return items.length;
  }
}
