import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import {
  ignoreVarianceBelow,
  varianceStatus,
  VarianceStatus,
} from "@/lib/stock-variance";
import { Knex } from "knex";
import { stockItemsQuery } from "./stock-count";

// Movement types by role in the variance equation. Anything not listed
// (STOCK_OUT, TRANSFER_OUT, REPLENISHMENT_OUT, CONVERSION_OUT, ...) is stock
// that left without being used here.
const RECEIVED = [
  "STOCK_IN",
  "PURCHASE",
  "REPLENISHMENT",
  "TRANSFER_IN",
  "COMPOSE_IN",
  "CONVERSION_IN",
];
const STANDARD_USE = ["SALE", "RETURN", "COMPOSE_OUT"];
const COUNT_ADJUSTMENT = ["ADJUSTMENT_IN", "ADJUSTMENT_OUT"];

export interface VarianceItem {
  variantId: string;
  productTitle: string;
  variantName: string;
  categoryTitle: string | null;
  image: string | null;
  openingQty: number;
  receivedQty: number;
  otherOutQty: number;
  standardQty: number;
  standardValue: number;
  wasteQty: number;
  wasteValue: number;
  nonSaleQty: number;
  nonSaleValue: number;
  /** Counted - expected over the period: + saving, - loss. */
  savingQty: number;
  savingValue: number;
  actualQty: number;
  actualValue: number;
  closingQty: number;
  /** Saving/(loss) as a share of standard usage; null without usage. */
  savingPct: number | null;
  counted: boolean;
  lastCountDate: string | null;
  status: VarianceStatus;
}

export interface VarianceSummary {
  standardValue: number;
  actualValue: number;
  wasteValue: number;
  nonSaleValue: number;
  savingValue: number;
  savingPct: number | null;
  statusCount: Record<VarianceStatus, number>;
}

interface MovementRow {
  variant_id: string;
  after_qty: string | null;
  period_qty: string | null;
  received_qty: string | null;
  standard_qty: string | null;
  standard_value: string | null;
  waste_qty: string | null;
  waste_value: string | null;
  non_sale_qty: string | null;
  non_sale_value: string | null;
  adjust_qty: string | null;
  adjust_value: string | null;
  adjust_count: string | number | null;
}

const n = (v: string | number | null | undefined) => Number(v || 0);

export class StockVarianceService {
  constructor(
    protected db: Knex,
    protected user: UserInfo,
  ) {}

  async report({
    from,
    to,
    currencyCode,
  }: {
    from: string;
    to: string;
    currencyCode?: string;
  }): Promise<{ items: VarianceItem[]; summary: VarianceSummary }> {
    const warehouseId = this.user.currentWarehouseId!;
    const fromStart = `${from} 00:00:00`;
    const toEnd = `${to} 23:59:59`;
    const db = this.db;

    const inPeriod = "t.created_at <= ?";
    const list = (types: string[]) => types.map((t) => `'${t}'`).join(",");
    // Cost of a movement: its lot cost, else the variant's purchase cost.
    const cost = "t.qty * COALESCE(l.cost_per_unit, v.purchased_cost, 0)";

    const [items, stockRows, movementRows, countRows] = await Promise.all([
      stockItemsQuery(db, this.user).orderBy([
        { column: "p.title" },
        { column: "v.sku" },
      ]),
      db
        .table("inventory as i")
        .innerJoin("warehouse_slot as ws", "ws.id", "i.slot_id")
        .where("ws.warehouse_id", warehouseId)
        .groupBy("i.variant_id")
        .select("i.variant_id", db.raw("SUM(i.qty) as qty")),
      db
        .table("inventory_transactions as t")
        .innerJoin("warehouse_slot as ws", "ws.id", "t.slot_id")
        .leftJoin("product_lot as l", "l.id", "t.lot_id")
        .leftJoin("product_variant as v", "v.id", "t.variant_id")
        .leftJoin("stock_waste_transaction as swt", "swt.transaction_id", "t.id")
        .leftJoin("stock_waste as sw", "sw.id", "swt.waste_id")
        .where("ws.warehouse_id", warehouseId)
        .where("t.created_at", ">=", fromStart)
        .groupBy("t.variant_id")
        .select(
          "t.variant_id",
          db.raw(`SUM(CASE WHEN t.created_at > ? THEN t.qty ELSE 0 END) as after_qty`, [toEnd]),
          db.raw(`SUM(CASE WHEN ${inPeriod} THEN t.qty ELSE 0 END) as period_qty`, [toEnd]),
          db.raw(
            `SUM(CASE WHEN ${inPeriod} AND t.transaction_type IN (${list(RECEIVED)}) THEN t.qty ELSE 0 END) as received_qty`,
            [toEnd],
          ),
          db.raw(
            `-SUM(CASE WHEN ${inPeriod} AND t.transaction_type IN (${list(STANDARD_USE)}) THEN t.qty ELSE 0 END) as standard_qty`,
            [toEnd],
          ),
          db.raw(
            `-SUM(CASE WHEN ${inPeriod} AND t.transaction_type IN (${list(STANDARD_USE)}) THEN ${cost} ELSE 0 END) as standard_value`,
            [toEnd],
          ),
          db.raw(
            `-SUM(CASE WHEN ${inPeriod} AND t.transaction_type = 'DAMAGE' AND COALESCE(sw.waste_type, 'WASTE') = 'WASTE' THEN t.qty ELSE 0 END) as waste_qty`,
            [toEnd],
          ),
          db.raw(
            `-SUM(CASE WHEN ${inPeriod} AND t.transaction_type = 'DAMAGE' AND COALESCE(sw.waste_type, 'WASTE') = 'WASTE' THEN ${cost} ELSE 0 END) as waste_value`,
            [toEnd],
          ),
          db.raw(
            `-SUM(CASE WHEN ${inPeriod} AND t.transaction_type = 'DAMAGE' AND sw.waste_type = 'NON_SALE' THEN t.qty ELSE 0 END) as non_sale_qty`,
            [toEnd],
          ),
          db.raw(
            `-SUM(CASE WHEN ${inPeriod} AND t.transaction_type = 'DAMAGE' AND sw.waste_type = 'NON_SALE' THEN ${cost} ELSE 0 END) as non_sale_value`,
            [toEnd],
          ),
          db.raw(
            `SUM(CASE WHEN ${inPeriod} AND t.transaction_type IN (${list(COUNT_ADJUSTMENT)}) THEN t.qty ELSE 0 END) as adjust_qty`,
            [toEnd],
          ),
          db.raw(
            `SUM(CASE WHEN ${inPeriod} AND t.transaction_type IN (${list(COUNT_ADJUSTMENT)}) THEN ${cost} ELSE 0 END) as adjust_value`,
            [toEnd],
          ),
          db.raw(
            `SUM(CASE WHEN ${inPeriod} AND t.transaction_type IN (${list(COUNT_ADJUSTMENT)}) THEN 1 ELSE 0 END) as adjust_count`,
            [toEnd],
          ),
        ),
      db
        .table("stock_count_item as sci")
        .innerJoin("stock_count as sc", "sc.id", "sci.count_id")
        .where("sc.warehouse_id", warehouseId)
        .whereBetween("sc.count_date", [from, to])
        .groupBy("sci.variant_id")
        .select(
          "sci.variant_id",
          db.raw("DATE_FORMAT(MAX(sc.count_date), '%Y-%m-%d') as last_count"),
        ),
    ]);

    const stockBy = new Map(
      (stockRows as { variant_id: string; qty: string }[]).map((r) => [
        r.variant_id,
        n(r.qty),
      ]),
    );
    const movesBy = new Map(
      (movementRows as MovementRow[]).map((r) => [r.variant_id, r]),
    );
    const countBy = new Map(
      (countRows as { variant_id: string; last_count: string }[]).map((r) => [
        r.variant_id,
        r.last_count,
      ]),
    );
    const ignoreBelow = ignoreVarianceBelow(currencyCode);

    const result: VarianceItem[] = [];
    for (const item of items as {
      variantId: string;
      productTitle: string;
      variantName: string;
      categoryTitle: string | null;
      image: string | null;
    }[]) {
      const m = movesBy.get(item.variantId);
      const current = stockBy.get(item.variantId) ?? 0;
      const closingQty = current - n(m?.after_qty);
      const periodQty = n(m?.period_qty);
      const openingQty = closingQty - periodQty;

      const receivedQty = n(m?.received_qty);
      const standardQty = n(m?.standard_qty);
      const wasteQty = n(m?.waste_qty);
      const nonSaleQty = n(m?.non_sale_qty);
      const savingQty = n(m?.adjust_qty);
      // Whatever else moved (transfers out, manual stock-outs...).
      const otherOutQty = -(
        periodQty -
        receivedQty +
        standardQty +
        wasteQty +
        nonSaleQty -
        savingQty
      );

      const counted = countBy.has(item.variantId) || n(m?.adjust_count) > 0;
      // Skip items with no stock and nothing happening in the period
      // (movements after the period alone do not count).
      const idle = [
        openingQty,
        closingQty,
        receivedQty,
        standardQty,
        wasteQty,
        nonSaleQty,
        savingQty,
        otherOutQty,
      ].every((v) => v === 0);
      if (idle && !counted) continue;

      const standardValue = n(m?.standard_value);
      const savingValue = n(m?.adjust_value);

      result.push({
        ...item,
        openingQty,
        receivedQty,
        otherOutQty,
        standardQty,
        standardValue,
        wasteQty,
        wasteValue: n(m?.waste_value),
        nonSaleQty,
        nonSaleValue: n(m?.non_sale_value),
        savingQty,
        savingValue,
        actualQty: standardQty - savingQty,
        actualValue: standardValue - savingValue,
        closingQty,
        savingPct: standardQty > 0 ? savingQty / standardQty : null,
        counted,
        lastCountDate: countBy.get(item.variantId) ?? null,
        status: varianceStatus({
          counted,
          standardQty,
          savingQty,
          savingAmount: savingValue,
          ignoreBelow,
        }),
      });
    }

    // Biggest losses first: those are the ones to follow up.
    result.sort((a, b) => a.savingValue - b.savingValue);

    const sum = (key: keyof VarianceItem) =>
      result.reduce((total, r) => total + (r[key] as number), 0);
    const standardValue = sum("standardValue");
    const savingValue = sum("savingValue");
    const statusCount: Record<VarianceStatus, number> = {
      OK: 0,
      CHECK: 0,
      INVESTIGATE: 0,
      NOT_COUNTED: 0,
    };
    result.forEach((r) => statusCount[r.status]++);

    return {
      items: result,
      summary: {
        standardValue,
        actualValue: sum("actualValue"),
        wasteValue: sum("wasteValue"),
        nonSaleValue: sum("nonSaleValue"),
        savingValue,
        savingPct: standardValue > 0 ? savingValue / standardValue : null,
        statusCount,
      },
    };
  }
}
