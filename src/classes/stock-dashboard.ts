import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { WasteReason, WasteType } from "@/lib/waste-reasons";
import { Knex } from "knex";
import {
  StockVarianceService,
  VarianceItem,
  VarianceMonth,
  VarianceSummary,
} from "./stock-variance";

const TREND_MONTHS = 6;
const TOP = 10;

/** First and last day ("YYYY-MM-DD") of a "YYYY-MM" month shifted by `offset`. */
export function monthRange(month: string, offset = 0) {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1 + offset, 1));
  const end = new Date(Date.UTC(y, m + offset, 0));
  const day = (d: Date) => d.toISOString().slice(0, 10);
  return { month: day(start).slice(0, 7), from: day(start), to: day(end) };
}

export interface DashboardKpis {
  sales: number;
  standardValue: number;
  actualValue: number;
  savingValue: number;
  savingPct: number | null;
  wasteValue: number;
  nonSaleValue: number;
  /** Actual usage cost / sales. */
  costPct: number | null;
  /** Waste / (actual usage + waste): share of consumption that was wasted. */
  wastePct: number | null;
  investigateCount: number;
  notCountedCount: number;
}

export interface DashboardCategory {
  category: string;
  standardValue: number;
  actualValue: number;
  savingValue: number;
  wasteValue: number;
}

export interface DashboardReason {
  reason: WasteReason;
  wasteType: WasteType;
  value: number;
  previousValue: number;
}

export interface StockDashboard {
  month: string;
  previousMonth: string;
  current: DashboardKpis;
  previous: DashboardKpis;
  categories: DashboardCategory[];
  wasteByReason: DashboardReason[];
  topLosses: VarianceItem[];
  topWaste: VarianceItem[];
  trend: (VarianceMonth & { sales: number })[];
}

function kpis(summary: VarianceSummary, sales: number): DashboardKpis {
  const consumption = summary.actualValue + summary.wasteValue;
  return {
    sales,
    standardValue: summary.standardValue,
    actualValue: summary.actualValue,
    savingValue: summary.savingValue,
    savingPct: summary.savingPct,
    wasteValue: summary.wasteValue,
    nonSaleValue: summary.nonSaleValue,
    costPct: sales > 0 ? summary.actualValue / sales : null,
    wastePct: consumption > 0 ? summary.wasteValue / consumption : null,
    investigateCount: summary.statusCount.INVESTIGATE,
    notCountedCount: summary.statusCount.NOT_COUNTED,
  };
}

export class StockDashboardService {
  constructor(
    protected db: Knex,
    protected user: UserInfo,
  ) {}

  /** Sales (completed orders by paid date) per "YYYY-MM", like the sale reports. */
  private async salesByMonth(from: string, to: string) {
    const rows: { month: string; sales: string | null }[] = await this.db
      .table("customer_order_detail as d")
      .innerJoin("customer_order as o", "o.order_id", "d.order_id")
      .where("o.warehouse_id", this.user.currentWarehouseId!)
      .where("o.order_status", "COMPLETED")
      .whereBetween("o.paid_at", [`${from} 00:00:00`, `${to} 23:59:59`])
      .groupBy("month")
      .select(
        this.db.raw("DATE_FORMAT(o.paid_at, '%Y-%m') as month"),
        this.db.raw("SUM(d.total_amount) as sales"),
      );
    return new Map(rows.map((r) => [r.month, Number(r.sales || 0)]));
  }

  private async wasteByReason(from: string, to: string) {
    const rows: {
      reason: WasteReason;
      waste_type: WasteType;
      value: string | null;
    }[] = await this.db
      .table("stock_waste")
      .where("warehouse_id", this.user.currentWarehouseId!)
      .whereBetween("created_at", [`${from} 00:00:00`, `${to} 23:59:59`])
      .groupBy("reason", "waste_type")
      .select(
        "reason",
        "waste_type",
        this.db.raw("SUM(cost_amount) as value"),
      );
    return rows;
  }

  async dashboard(month: string, currencyCode?: string): Promise<StockDashboard> {
    const cur = monthRange(month);
    const prev = monthRange(month, -1);
    const trendStart = monthRange(month, -(TREND_MONTHS - 1));
    const variance = new StockVarianceService(this.db, this.user);

    const [current, previous, trendRows, sales, wasteNow, wastePrev] =
      await Promise.all([
        variance.report({ from: cur.from, to: cur.to, currencyCode }),
        variance.report({ from: prev.from, to: prev.to, currencyCode }),
        variance.monthlyTotals(trendStart.from, cur.to),
        this.salesByMonth(trendStart.from, cur.to),
        this.wasteByReason(cur.from, cur.to),
        this.wasteByReason(prev.from, prev.to),
      ]);

    const categories = new Map<string, DashboardCategory>();
    for (const item of current.items) {
      const key = item.categoryTitle || "";
      const c = categories.get(key) || {
        category: key,
        standardValue: 0,
        actualValue: 0,
        savingValue: 0,
        wasteValue: 0,
      };
      c.standardValue += item.standardValue;
      c.actualValue += item.actualValue;
      c.savingValue += item.savingValue;
      c.wasteValue += item.wasteValue;
      categories.set(key, c);
    }

    const reasons = new Map<string, DashboardReason>();
    for (const [rows, field] of [
      [wasteNow, "value"],
      [wastePrev, "previousValue"],
    ] as const) {
      for (const r of rows) {
        const entry = reasons.get(r.reason) || {
          reason: r.reason,
          wasteType: r.waste_type,
          value: 0,
          previousValue: 0,
        };
        entry[field] += Number(r.value || 0);
        reasons.set(r.reason, entry);
      }
    }

    // Every month of the window, including ones with no movement.
    const byMonth = new Map(trendRows.map((r) => [r.month, r]));
    const trend = Array.from({ length: TREND_MONTHS }, (_, i) => {
      const m = monthRange(month, i - (TREND_MONTHS - 1)).month;
      return {
        month: m,
        standardValue: 0,
        wasteValue: 0,
        nonSaleValue: 0,
        savingValue: 0,
        actualValue: 0,
        ...byMonth.get(m),
        sales: sales.get(m) ?? 0,
      };
    });

    return {
      month: cur.month,
      previousMonth: prev.month,
      current: kpis(current.summary, sales.get(cur.month) ?? 0),
      previous: kpis(previous.summary, sales.get(prev.month) ?? 0),
      categories: Array.from(categories.values()).sort(
        (a, b) => b.actualValue - a.actualValue,
      ),
      wasteByReason: Array.from(reasons.values()).sort(
        (a, b) => b.value - a.value,
      ),
      // Filter on quantity, rank by money: an item valued at no cost (e.g. a
      // lot without a cost) still shows up.
      topLosses: current.items
        .filter((i) => i.savingQty < 0)
        .sort((a, b) => a.savingValue - b.savingValue || a.savingQty - b.savingQty)
        .slice(0, TOP),
      topWaste: current.items
        .filter((i) => i.wasteQty > 0)
        .sort((a, b) => b.wasteValue - a.wasteValue || b.wasteQty - a.wasteQty)
        .slice(0, TOP),
      trend,
    };
  }
}
