import { LoaderFactory } from "@/dataloader/loader-factory";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { Slot } from "@/dataloader/slot-loader";
import {
  table_inventory,
  table_stock_count,
  table_stock_count_item,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { CountFrequency, isCountDue } from "@/lib/stock-count";
import { Knex } from "knex";
import { z } from "zod";
import { SlotMovementService } from "./slot-movement";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createStockCountSchema = z.object({
  slotId: z.string().nonempty(),
  countDate: day,
  note: z.string().max(500).optional().nullable(),
  items: z
    .array(
      z.object({
        variantId: z.string().nonempty(),
        countedQty: z.number().int().min(0),
      }),
    )
    .min(1),
});

export type CreateStockCountInput = z.infer<typeof createStockCountSchema>;

export interface CountSheetItem {
  variantId: string;
  productTitle: string;
  variantName: string;
  categoryTitle: string | null;
  image: string | null;
  countFrequency: CountFrequency | null;
  lastCountDate: string | null;
  due: boolean;
  /** Only when the expected qty was asked for (not during a blind count). */
  systemQty?: number;
}

export interface StockCountSummary {
  id: string;
  countDate: string;
  slot: Slot | null;
  note: string | null;
  itemCount: number;
  diffItemCount: number;
  lossAmount: number;
  gainAmount: number;
  createdAt: string;
  createdBy: { id: string; fullname: string } | null;
}

export interface StockCountDetailItem {
  id: string;
  variant: ProductVariantType | null;
  systemQty: number;
  countedQty: number;
  diffQty: number;
  unitCost: number;
  diffAmount: number;
}

export class StockCountService {
  constructor(
    protected db: Knex,
    protected user: UserInfo,
  ) {}

  private get warehouseId() {
    return this.user.currentWarehouseId!;
  }

  /**
   * Items to count in a slot: every stock-tracked variant except made-to-order
   * composites (their stock lives on the recipe items).
   */
  async getSheet(
    slotId: string,
    countDate: string,
    includeExpected: boolean,
  ): Promise<CountSheetItem[]> {
    const query = stockItemsQuery(this.db, this.user)
      .select(
        this.db.raw(
          `(SELECT DATE_FORMAT(MAX(sc.count_date), '%Y-%m-%d') FROM stock_count sc
            INNER JOIN stock_count_item sci ON sci.count_id = sc.id
            WHERE sci.variant_id = v.id AND sc.slot_id = ?) as lastCountDate`,
          [slotId],
        ),
        this.db.raw(
          `(SELECT COALESCE(SUM(i.qty), 0) FROM inventory i
            WHERE i.variant_id = v.id AND i.slot_id = ?) as systemQty`,
          [slotId],
        ),
      )
      .orderBy([{ column: "p.title" }, { column: "v.sku" }]);

    const rows: (Omit<CountSheetItem, "due" | "systemQty"> & {
      systemQty: number | string;
    })[] = await query;

    return rows.map((row) => ({
      variantId: row.variantId,
      productTitle: row.productTitle,
      variantName: row.variantName,
      categoryTitle: row.categoryTitle,
      image: row.image,
      countFrequency: row.countFrequency,
      lastCountDate: row.lastCountDate,
      due: isCountDue(row.countFrequency, row.lastCountDate, countDate),
      ...(includeExpected ? { systemQty: Number(row.systemQty) } : {}),
    }));
  }

  /**
   * Saves the count and corrects stock to it: a shortfall comes off the
   * earliest-expiring lots (ADJUSTMENT_OUT), a surplus goes onto the newest
   * lot (ADJUSTMENT_IN). System qty is read at save time.
   */
  async create(input: CreateStockCountInput): Promise<string> {
    const ids = input.items.map((i) => i.variantId);
    if (new Set(ids).size !== ids.length) {
      throw new Error("An item appears twice in the count");
    }
    if (input.countDate > Formatter.getNowDate()) {
      throw new Error("Count date cannot be in the future");
    }

    return await this.db.transaction(async (trx) => {
      const slot = await trx
        .table("warehouse_slot")
        .where({ id: input.slotId, warehouse_id: this.warehouseId })
        .first();
      if (!slot) throw new Error("Slot not found in this branch");

      const now = Formatter.getNowDateTime();
      const countId = generateId();
      await trx.table<table_stock_count>("stock_count").insert({
        id: countId,
        warehouse_id: this.warehouseId,
        slot_id: input.slotId,
        count_date: input.countDate,
        note: input.note || null,
        created_by: this.user.id,
        created_at: now,
      });

      const movement = new SlotMovementService(trx);
      const transactionIds: string[] = [];
      const itemRows: table_stock_count_item[] = [];

      for (const item of input.items) {
        const lots: (table_inventory & { cost_per_unit: string | null })[] =
          await trx
            .table("inventory")
            .leftJoin("product_lot", "product_lot.id", "inventory.lot_id")
            .where("inventory.variant_id", item.variantId)
            .where("inventory.slot_id", input.slotId)
            .orderBy("inventory.expired_at", "asc")
            .forUpdate()
            .select("inventory.*", "product_lot.cost_per_unit");

        const variant: { purchased_cost: string | null } | undefined =
          await trx
            .table("product_variant")
            .where("id", item.variantId)
            .first("purchased_cost");

        const systemQty = lots.reduce((sum, l) => sum + l.qty, 0);
        const diff = item.countedQty - systemQty;

        // The difference is valued at the cost of the lots it is booked
        // against, the same cost the stock variance report reads from the
        // movements. A lot without a cost falls back to the purchase cost.
        const purchaseCost = Number(variant?.purchased_cost || 0);
        const lotCost = (lot: { cost_per_unit: string | null }) =>
          lot.cost_per_unit != null ? Number(lot.cost_per_unit) : purchaseCost;
        const onHand = lots.filter((l) => l.qty > 0);
        let diffAmount = 0;

        if (diff < 0) {
          let remaining = -diff;
          for (const lot of onHand) {
            if (remaining <= 0) break;
            const take = Math.min(remaining, lot.qty);
            diffAmount -= take * lotCost(lot);
            transactionIds.push(
              await movement.adjustStock({
                variantId: item.variantId,
                slotId: input.slotId,
                lotId: lot.lot_id,
                qty: -take,
                createdBy: this.user,
                transactionType: "ADJUSTMENT_OUT",
              }),
            );
            remaining -= take;
          }
        } else if (diff > 0) {
          const newest = lots[lots.length - 1];
          if (newest) {
            diffAmount = diff * lotCost(newest);
            transactionIds.push(
              await movement.adjustStock({
                variantId: item.variantId,
                slotId: input.slotId,
                lotId: newest.lot_id,
                qty: diff,
                createdBy: this.user,
                transactionType: "ADJUSTMENT_IN",
              }),
            );
          } else {
            diffAmount = diff * purchaseCost;
            const { transactionId } = await movement.stockin({
              variantId: item.variantId,
              slotId: input.slotId,
              qty: diff,
              createdBy: this.user,
              transactionType: "ADJUSTMENT_IN",
              productLot: {
                variantId: item.variantId,
                costPerUnit: purchaseCost,
              },
            });
            transactionIds.push(transactionId);
          }
        }

        itemRows.push({
          id: generateId(),
          count_id: countId,
          variant_id: item.variantId,
          system_qty: systemQty,
          counted_qty: item.countedQty,
          diff_qty: diff,
          unit_cost: (diff !== 0 ? diffAmount / diff : 0).toFixed(6),
          diff_amount: diffAmount.toFixed(6),
        });
      }

      await trx.table("stock_count_item").insert(itemRows);
      if (transactionIds.length > 0) {
        await trx.table("stock_count_transaction").insert(
          transactionIds.map((transactionId) => ({
            count_id: countId,
            transaction_id: transactionId,
          })),
        );
      }
      return countId;
    });
  }

  async list({
    from,
    to,
    slotId,
    limit,
    offset,
  }: {
    from?: string;
    to?: string;
    slotId?: string;
    limit: number;
    offset: number;
  }) {
    const base = this.db
      .table("stock_count as sc")
      .where("sc.warehouse_id", this.warehouseId);
    if (from) base.where("sc.count_date", ">=", from);
    if (to) base.where("sc.count_date", "<=", to);
    if (slotId) base.where("sc.slot_id", slotId);

    const [rows, totalRow] = await Promise.all([
      base
        .clone()
        .leftJoin("stock_count_item as i", "i.count_id", "sc.id")
        .groupBy("sc.id")
        .orderBy([
          { column: "sc.count_date", order: "desc" },
          { column: "sc.created_at", order: "desc" },
        ])
        .limit(limit)
        .offset(offset)
        .select(
          "sc.*",
          this.db.raw("DATE_FORMAT(sc.count_date, '%Y-%m-%d') as count_day"),
          this.db.raw("COUNT(i.id) as item_count"),
          this.db.raw("SUM(i.diff_qty <> 0) as diff_item_count"),
          this.db.raw(
            "SUM(CASE WHEN i.diff_amount < 0 THEN -i.diff_amount ELSE 0 END) as loss_amount",
          ),
          this.db.raw(
            "SUM(CASE WHEN i.diff_amount > 0 THEN i.diff_amount ELSE 0 END) as gain_amount",
          ),
        ),
      base.clone().count({ total: "*" }).first<{ total: number }>(),
    ]);

    const slotLoader = LoaderFactory.slotLoader(this.db);
    const userLoader = LoaderFactory.userLoader(this.db);

    const data: StockCountSummary[] = await Promise.all(
      (
        rows as (table_stock_count & {
          count_day: string;
          item_count: number | string;
          diff_item_count: number | string | null;
          loss_amount: string | null;
          gain_amount: string | null;
        })[]
      ).map(async (row) => {
        const user = row.created_by
          ? await userLoader.load(row.created_by)
          : null;
        return {
          id: row.id,
          countDate: row.count_day,
          slot: await slotLoader.load(row.slot_id),
          note: row.note,
          itemCount: Number(row.item_count),
          diffItemCount: Number(row.diff_item_count || 0),
          lossAmount: Number(row.loss_amount || 0),
          gainAmount: Number(row.gain_amount || 0),
          createdAt: row.created_at,
          createdBy: user ? { id: user.id, fullname: user.fullname } : null,
        };
      }),
    );

    return { data, total: Number(totalRow?.total ?? 0) };
  }

  async detail(id: string) {
    const count: (table_stock_count & { count_day: string }) | undefined =
      await this.db
        .table("stock_count")
        .where({ id, warehouse_id: this.warehouseId })
        .first(
          "*",
          this.db.raw("DATE_FORMAT(count_date, '%Y-%m-%d') as count_day"),
        );
    if (!count) return null;

    const items: table_stock_count_item[] = await this.db
      .table("stock_count_item")
      .where("count_id", id);

    const variantLoader = LoaderFactory.productVariantByIdLoader(
      this.db,
      this.warehouseId,
    );
    const detailItems: StockCountDetailItem[] = await Promise.all(
      items.map(async (item) => ({
        id: item.id,
        variant: await variantLoader.load(item.variant_id),
        systemQty: item.system_qty,
        countedQty: item.counted_qty,
        diffQty: item.diff_qty,
        unitCost: Number(item.unit_cost),
        diffAmount: Number(item.diff_amount),
      })),
    );
    // Biggest money differences first: those are the ones to follow up.
    detailItems.sort(
      (a, b) => Math.abs(b.diffAmount) - Math.abs(a.diffAmount),
    );

    const slot = await LoaderFactory.slotLoader(this.db).load(count.slot_id);
    const user = count.created_by
      ? await LoaderFactory.userLoader(this.db).load(count.created_by)
      : null;

    return {
      id: count.id,
      countDate: count.count_day,
      slot,
      note: count.note,
      createdAt: count.created_at,
      createdBy: user ? { id: user.id, fullname: user.fullname } : null,
      items: detailItems,
      lossAmount: detailItems
        .filter((i) => i.diffAmount < 0)
        .reduce((sum, i) => sum - i.diffAmount, 0),
      gainAmount: detailItems
        .filter((i) => i.diffAmount > 0)
        .reduce((sum, i) => sum + i.diffAmount, 0),
    };
  }
}

/**
 * Stock items of the user's branch: stock-tracked variants, except
 * made-to-order composites (their stock lives on the recipe items). Aliases:
 * product_variant v, product p. Shared by the count sheet and variance report.
 */
export function stockItemsQuery(db: Knex, user: UserInfo) {
  const query = db
    .table("product_variant as v")
    .innerJoin("product as p", "p.id", "v.product_id")
    .whereNull("v.deleted_at")
    .whereNull("p.deleted_at")
    .where("v.available", 1)
    .where("p.track_stock", 1)
    .whereNot((qb) =>
      qb
        .where("v.is_composite", 1)
        .where((m) =>
          m.where("p.use_production", 0).orWhereNull("p.use_production"),
        ),
    )
    .select(
      "v.id as variantId",
      "v.name as variantName",
      "v.count_frequency as countFrequency",
      "v.purchased_cost as purchasedCost",
      "p.title as productTitle",
      db.raw(
        `(SELECT MIN(c.title) FROM product_categories pc
          INNER JOIN product_category c ON c.id = pc.category_id
          WHERE pc.product_id = p.id) as categoryTitle`,
      ),
      db.raw(
        `(SELECT pi.image_url FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY (pi.product_variant_id = v.id) DESC, pi.image_order ASC
          LIMIT 1) as image`,
      ),
    );

  const isMain = user.warehouse?.isMain || false;
  if (!isMain && user.warehouse?.useMainBranchVisibility) {
    // Only variants in a product group assigned to this branch.
    query.whereIn(
      "v.id",
      db
        .table("group_products")
        .select("product_variant_id")
        .whereIn(
          "group_id",
          db
            .table("warehouse_groups")
            .select("group_id")
            .where("warehouse_id", user.currentWarehouseId!),
        )
        .whereIn(
          "group_id",
          db.table("product_groups").select("group_id").whereNull("deleted_at"),
        ),
    );
  }
  return query;
}
