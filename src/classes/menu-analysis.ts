import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { z } from "zod";
import { resolveStockLines } from "./stock-recipe";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const menuAnalysisSchema = z
  .object({
    from: day,
    to: day,
    categoryId: z.string().optional(),
  })
  .refine((v) => v.from <= v.to, { message: "from must be before to" });

export type MenuClass = "STAR" | "PLOWHORSE" | "PUZZLE" | "DOG";

/** Popular when an item sells at least 70% of a fair (1/N) share. */
export const MENU_POPULARITY_FACTOR = 0.7;

export interface MenuItemAnalysis {
  variantId: string;
  productTitle: string;
  variantName: string;
  categoryTitle: string | null;
  qty: number;
  revenue: number;
  cost: number;
  /** Average selling price after discounts. */
  pricePerServing: number;
  costPerServing: number;
  costPct: number | null;
  marginPerServing: number;
  totalMargin: number;
  mixPct: number;
  popular: boolean;
  profitable: boolean;
  menuClass: MenuClass;
  /** Part of the cost is estimated from the recipe / purchase cost. */
  costEstimated: boolean;
}

export interface MenuAnalysis {
  items: MenuItemAnalysis[];
  summary: {
    revenue: number;
    cost: number;
    costPct: number | null;
    totalMargin: number;
    avgMarginPerServing: number;
    popularityThreshold: number;
    classCount: Record<MenuClass, number>;
  };
}

function classify(popular: boolean, profitable: boolean): MenuClass {
  if (popular) return profitable ? "STAR" : "PLOWHORSE";
  return profitable ? "PUZZLE" : "DOG";
}

export class MenuAnalysisService {
  constructor(
    protected db: Knex,
    protected user: UserInfo,
  ) {}

  /** Cost of one serving from today's purchase costs (recipe items for sets). */
  private async theoreticalCost(variantId: string) {
    const lines = await resolveStockLines(this.db, variantId, 1);
    const costs: { id: string; purchased_cost: string | null }[] = await this.db
      .table("product_variant")
      .whereIn(
        "id",
        lines.map((l) => l.variantId),
      )
      .select("id", "purchased_cost");
    const costBy = new Map(costs.map((c) => [c.id, Number(c.purchased_cost || 0)]));
    return lines.reduce((sum, l) => sum + l.qty * (costBy.get(l.variantId) ?? 0), 0);
  }

  async analyse(
    input: z.infer<typeof menuAnalysisSchema>,
  ): Promise<MenuAnalysis> {
    const db = this.db;
    const lineQuery = db
      .table("customer_order_detail as d")
      .innerJoin("customer_order as o", "o.order_id", "d.order_id")
      .innerJoin("product_variant as v", "v.id", "d.variant_id")
      .innerJoin("product as p", "p.id", "v.product_id")
      .where("o.warehouse_id", this.user.currentWarehouseId!)
      .where("o.order_status", "COMPLETED")
      .whereBetween("o.paid_at", [
        `${input.from} 00:00:00`,
        `${input.to} 23:59:59`,
      ]);
    if (input.categoryId) {
      lineQuery.whereExists(
        db
          .table("product_categories as pc")
          .select(db.raw("1"))
          .whereRaw("pc.product_id = p.id")
          .where("pc.category_id", input.categoryId),
      );
    }

    // One row per order line, with the cost of the stock its sale took out
    // (recipe items for a set). Lines that moved no stock have null cost.
    const lines: {
      variant_id: string;
      product_title: string;
      variant_name: string;
      category_title: string | null;
      qty: number;
      revenue: string | null;
      cost: string | null;
    }[] = await lineQuery
      .leftJoin(
        db
          .table("fulfilment_detail as fd")
          .innerJoin("inventory_transactions as t", "t.id", "fd.transaction_id")
          .leftJoin("product_lot as l", "l.id", "t.lot_id")
          .leftJoin("product_variant as cv", "cv.id", "t.variant_id")
          .where("t.transaction_type", "SALE")
          .groupBy("fd.order_detail_id")
          .select(
            "fd.order_detail_id",
            db.raw(
              "-SUM(t.qty * COALESCE(l.cost_per_unit, cv.purchased_cost, 0)) as cost",
            ),
          )
          .as("lc"),
        "lc.order_detail_id",
        "d.order_detail_id",
      )
      .select(
        "d.variant_id",
        "p.title as product_title",
        "v.name as variant_name",
        db.raw(
          `(SELECT MIN(c.title) FROM product_categories pc
            INNER JOIN product_category c ON c.id = pc.category_id
            WHERE pc.product_id = p.id) as category_title`,
        ),
        "d.qty",
        "d.total_amount as revenue",
        "lc.cost",
      );

    const byVariant = new Map<
      string,
      {
        productTitle: string;
        variantName: string;
        categoryTitle: string | null;
        qty: number;
        revenue: number;
        cost: number;
        uncostedQty: number;
      }
    >();
    for (const line of lines) {
      const entry = byVariant.get(line.variant_id) || {
        productTitle: line.product_title,
        variantName: line.variant_name,
        categoryTitle: line.category_title,
        qty: 0,
        revenue: 0,
        cost: 0,
        uncostedQty: 0,
      };
      const qty = Number(line.qty || 0);
      entry.qty += qty;
      entry.revenue += Number(line.revenue || 0);
      if (line.cost === null) entry.uncostedQty += qty;
      else entry.cost += Number(line.cost);
      byVariant.set(line.variant_id, entry);
    }

    // Estimate the cost of lines that moved no stock (untracked items,
    // backlog) from today's recipe / purchase cost.
    for (const [variantId, entry] of byVariant) {
      if (entry.uncostedQty > 0) {
        entry.cost += entry.uncostedQty * (await this.theoreticalCost(variantId));
      }
    }

    const sold = Array.from(byVariant).filter(([, e]) => e.qty > 0);
    const totalQty = sold.reduce((sum, [, e]) => sum + e.qty, 0);
    const revenue = sold.reduce((sum, [, e]) => sum + e.revenue, 0);
    const cost = sold.reduce((sum, [, e]) => sum + e.cost, 0);
    const totalMargin = revenue - cost;
    const avgMarginPerServing = totalQty > 0 ? totalMargin / totalQty : 0;
    const popularityThreshold =
      sold.length > 0 ? MENU_POPULARITY_FACTOR / sold.length : 0;

    const items: MenuItemAnalysis[] = sold.map(([variantId, e]) => {
      const marginPerServing = (e.revenue - e.cost) / e.qty;
      const mixPct = totalQty > 0 ? e.qty / totalQty : 0;
      const popular = mixPct >= popularityThreshold;
      const profitable = marginPerServing >= avgMarginPerServing;
      return {
        variantId,
        productTitle: e.productTitle,
        variantName: e.variantName,
        categoryTitle: e.categoryTitle,
        qty: e.qty,
        revenue: e.revenue,
        cost: e.cost,
        pricePerServing: e.revenue / e.qty,
        costPerServing: e.cost / e.qty,
        costPct: e.revenue > 0 ? e.cost / e.revenue : null,
        marginPerServing,
        totalMargin: e.revenue - e.cost,
        mixPct,
        popular,
        profitable,
        menuClass: classify(popular, profitable),
        costEstimated: e.uncostedQty > 0,
      };
    });
    items.sort((a, b) => b.totalMargin - a.totalMargin);

    const classCount: Record<MenuClass, number> = {
      STAR: 0,
      PLOWHORSE: 0,
      PUZZLE: 0,
      DOG: 0,
    };
    items.forEach((i) => classCount[i.menuClass]++);

    return {
      items,
      summary: {
        revenue,
        cost,
        costPct: revenue > 0 ? cost / revenue : null,
        totalMargin,
        avgMarginPerServing,
        popularityThreshold,
        classCount,
      },
    };
  }
}
