import { LoaderFactory } from "@/dataloader/loader-factory";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { Slot } from "@/dataloader/slot-loader";
import { table_stock_waste } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import {
  WASTE_REASON_CODES,
  WasteReason,
  WasteType,
  wasteTypeOf,
} from "@/lib/waste-reasons";
import { Knex } from "knex";
import { z } from "zod";
import { SlotMovementService } from "./slot-movement";
import { resolveStockLines } from "./stock-recipe";

export const recordWasteSchema = z.object({
  variantId: z.string().nonempty(),
  slotId: z.string().nonempty(),
  qty: z.number().int().positive(),
  reason: z.enum(WASTE_REASON_CODES),
  note: z.string().max(500).optional().nullable(),
});

export type RecordWasteInput = z.infer<typeof recordWasteSchema>;

export interface WasteFilter {
  from?: string;
  to?: string;
  wasteType?: WasteType;
  reason?: WasteReason;
  limit: number;
  offset: number;
}

export interface WasteEntry {
  id: string;
  variant: ProductVariantType | null;
  slot: Slot | null;
  qty: number;
  reason: WasteReason;
  wasteType: WasteType;
  cost: number;
  note: string | null;
  createdAt: string;
  createdBy: { id: string; fullname: string } | null;
}

export interface WasteSummary {
  wasteCost: number;
  nonSaleCost: number;
  wasteCount: number;
  nonSaleCount: number;
  byReason: { reason: WasteReason; count: number; cost: number }[];
}

export class StockWasteService {
  constructor(
    protected db: Knex,
    protected user: UserInfo,
  ) {}

  /**
   * Takes the stock out (DAMAGE movements) and logs why. A made-to-order
   * composite (e.g. a burnt dish) takes out its recipe items, like a sale.
   */
  async record(input: RecordWasteInput): Promise<string> {
    return await this.db.transaction(async (trx) => {
      const now = Formatter.getNowDateTime();
      const movement = new SlotMovementService(trx);
      const lines = await resolveStockLines(trx, input.variantId, input.qty);

      const transactionIds: string[] = [];
      let cost = 0;

      for (const line of lines) {
        const item: {
          title: string;
          track_stock: number | null;
          purchased_cost: string | null;
        } = await trx
          .table("product_variant")
          .innerJoin("product", "product.id", "product_variant.product_id")
          .where("product_variant.id", line.variantId)
          .first("product.title", "product.track_stock", "product_variant.purchased_cost");

        if (!item?.track_stock) {
          // Nothing on hand to deduct; value it at the standard cost.
          cost += Number(item?.purchased_cost || 0) * line.qty;
          continue;
        }

        let ids: string[];
        try {
          ids = await movement.stockout({
            slotId: input.slotId,
            variantId: line.variantId,
            qty: line.qty,
            createdBy: this.user,
            transactionType: "DAMAGE",
          });
        } catch {
          throw new Error(
            `Not enough stock of "${item.title}" in this slot (need ${line.qty})`,
          );
        }
        transactionIds.push(...ids);

        const lotCost = await trx
          .table("inventory_transactions as t")
          .leftJoin("product_lot as l", "l.id", "t.lot_id")
          .whereIn("t.id", ids)
          .sum({ amount: trx.raw("ABS(t.qty) * COALESCE(l.cost_per_unit, 0)") })
          .first<{ amount: string | null }>();
        cost += Number(lotCost?.amount || 0);
      }

      const id = generateId();
      await trx.table<table_stock_waste>("stock_waste").insert({
        id,
        warehouse_id: this.user.currentWarehouseId!,
        variant_id: input.variantId,
        slot_id: input.slotId,
        qty: input.qty,
        reason: input.reason,
        waste_type: wasteTypeOf(input.reason),
        cost_amount: cost.toFixed(6),
        note: input.note || null,
        created_by: this.user.id,
        created_at: now,
      });

      if (transactionIds.length > 0) {
        await trx.table("stock_waste_transaction").insert(
          transactionIds.map((transactionId) => ({
            waste_id: id,
            transaction_id: transactionId,
          })),
        );
      }

      return id;
    });
  }

  private filtered(filter: Omit<WasteFilter, "limit" | "offset">) {
    const query = this.db
      .table("stock_waste")
      .where("stock_waste.warehouse_id", this.user.currentWarehouseId!);
    if (filter.from) {
      query.where("stock_waste.created_at", ">=", `${filter.from} 00:00:00`);
    }
    if (filter.to) {
      query.where("stock_waste.created_at", "<=", `${filter.to} 23:59:59`);
    }
    if (filter.wasteType) {
      query.where("stock_waste.waste_type", filter.wasteType);
    }
    if (filter.reason) {
      query.where("stock_waste.reason", filter.reason);
    }
    return query;
  }

  async list(filter: WasteFilter) {
    const base = this.filtered(filter);

    const [rows, totalRow, byReason] = await Promise.all([
      base
        .clone()
        .orderBy("stock_waste.created_at", "desc")
        .limit(filter.limit)
        .offset(filter.offset)
        .select<table_stock_waste[]>("stock_waste.*"),
      base.clone().count({ total: "*" }).first<{ total: number }>(),
      base
        .clone()
        .groupBy("stock_waste.reason", "stock_waste.waste_type")
        .select(
          "stock_waste.reason as reason",
          "stock_waste.waste_type as wasteType",
          this.db.raw("COUNT(*) as count"),
          this.db.raw("SUM(stock_waste.cost_amount) as cost"),
        ),
    ]);

    const variantLoader = LoaderFactory.productVariantByIdLoader(
      this.db,
      this.user.currentWarehouseId,
    );
    const slotLoader = LoaderFactory.slotLoader(this.db);
    const userLoader = LoaderFactory.userLoader(this.db);

    const data: WasteEntry[] = await Promise.all(
      rows.map(async (row) => {
        const createdBy = row.created_by
          ? await userLoader.load(row.created_by)
          : null;
        return {
          id: row.id,
          variant: await variantLoader.load(row.variant_id),
          slot: await slotLoader.load(row.slot_id),
          qty: row.qty,
          reason: row.reason as WasteReason,
          wasteType: row.waste_type,
          cost: Number(row.cost_amount),
          note: row.note,
          createdAt: row.created_at,
          createdBy: createdBy
            ? { id: createdBy.id, fullname: createdBy.fullname }
            : null,
        };
      }),
    );

    const summary: WasteSummary = {
      wasteCost: 0,
      nonSaleCost: 0,
      wasteCount: 0,
      nonSaleCount: 0,
      byReason: [],
    };
    for (const r of byReason as {
      reason: WasteReason;
      wasteType: WasteType;
      count: number | string;
      cost: number | string | null;
    }[]) {
      const count = Number(r.count);
      const cost = Number(r.cost || 0);
      if (r.wasteType === "NON_SALE") {
        summary.nonSaleCost += cost;
        summary.nonSaleCount += count;
      } else {
        summary.wasteCost += cost;
        summary.wasteCount += count;
      }
      summary.byReason.push({ reason: r.reason, count, cost });
    }
    summary.byReason.sort((a, b) => b.cost - a.cost);

    return { data, total: Number(totalRow?.total ?? 0), summary };
  }
}
