"use client";

import { useQueryStockDashboard } from "@/app/hooks/use-query-stock-dashboard";
import type { DashboardKpis } from "@/classes/stock-dashboard";
import type { VarianceItem } from "@/classes/stock-variance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useAuthentication } from "contexts/authentication-context";
import { format } from "date-fns";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ClipboardList } from "lucide-react";
import moment from "moment-timezone";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

// Validated with the dataviz palette checker against the app's card surfaces
// (light #ffffff, dark #09090b), all pairs: categorical slots 1-3.
const chartConfig = {
  standardValue: {
    label: "standard",
    theme: { light: "#2a78d6", dark: "#3987e5" },
  },
  actualValue: {
    label: "actual",
    theme: { light: "#eb6834", dark: "#d95926" },
  },
  wasteValue: {
    label: "waste",
    theme: { light: "#1baf7a", dark: "#199e70" },
  },
} satisfies ChartConfig;

type KpiKey = keyof Pick<
  DashboardKpis,
  | "sales"
  | "standardValue"
  | "actualValue"
  | "savingValue"
  | "wasteValue"
  | "nonSaleValue"
  | "costPct"
  | "wastePct"
>;

// Which way is good for each KPI decides the colour of its change.
// Usage grows with sales, so its change is neutral; cost % judges efficiency.
const KPIS: {
  key: KpiKey;
  label: string;
  kind: "money" | "pct";
  goodWhen: "up" | "down" | "neutral";
}[] = [
  { key: "sales", label: "kpi.sales", kind: "money", goodWhen: "up" },
  { key: "standardValue", label: "kpi.standard", kind: "money", goodWhen: "neutral" },
  { key: "actualValue", label: "kpi.actual", kind: "money", goodWhen: "neutral" },
  { key: "savingValue", label: "kpi.saving", kind: "money", goodWhen: "up" },
  { key: "wasteValue", label: "kpi.waste", kind: "money", goodWhen: "down" },
  { key: "nonSaleValue", label: "kpi.nonSale", kind: "money", goodWhen: "down" },
  { key: "costPct", label: "kpi.costPct", kind: "pct", goodWhen: "down" },
  { key: "wastePct", label: "kpi.wastePct", kind: "pct", goodWhen: "down" },
];

function itemName(item: VarianceItem) {
  return item.variantName && !["Default", "ns"].includes(item.variantName)
    ? `${item.productTitle} (${item.variantName})`
    : item.productTitle;
}

export function LayoutStockDashboard() {
  const t = useTranslations("stockDashboard");
  const tWaste = useTranslations("waste");
  const { currencyCode } = useAuthentication();
  const search = useSearchParams();
  const pathname = usePathname();
  const { push } = useRouter();

  const thisMonth = format(new Date(), "yyyy-MM");
  const month = search.get("month") || thisMonth;
  const { data, isLoading } = useQueryStockDashboard(month);
  const d = data?.result;

  const money = (v: number) => formatCurrency(v, currencyCode);
  const signedMoney = (v: number) =>
    Math.abs(v) < 0.005
      ? formatCurrency(0, currencyCode)
      : `${v < 0 ? "-" : "+"}${formatCurrency(Math.abs(v), currencyCode)}`;
  const pct = (v: number | null) =>
    v === null ? "—" : `${(v * 100).toFixed(1)}%`;
  const monthLabel = (m: string) => moment(`${m}-01`).format("MMM YYYY");
  const compactMoney = (v: number) =>
    formatCurrency(v, currencyCode, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const chartLabels: ChartConfig = {
    standardValue: { ...chartConfig.standardValue, label: t("trend.standard") },
    actualValue: { ...chartConfig.actualValue, label: t("trend.actual") },
    wasteValue: { ...chartConfig.wasteValue, label: t("trend.waste") },
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-3xl">
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("month")}
          <Input
            type="month"
            className="h-9 w-44"
            value={month}
            max={thisMonth}
            onChange={(e) => {
              if (!e.target.value) return;
              const params = new URLSearchParams(search.toString());
              params.set("month", e.target.value);
              push(`${pathname}?${params.toString()}`);
            }}
          />
        </label>
      </div>

      {isLoading || !d ? (
        <LoadingState label={t("loading")} />
      ) : (
        <>
          {(d.current.investigateCount > 0 || d.current.notCountedCount > 0) && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {d.current.investigateCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {t("alerts.investigate", { count: d.current.investigateCount })}
                </span>
              )}
              {d.current.notCountedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-muted-foreground">
                  <ClipboardList className="h-3.5 w-3.5" />
                  {t("alerts.notCounted", { count: d.current.notCountedCount })}
                </span>
              )}
              <Link
                href={`/admin/reports/stock-variance?from=${d.month}-01&to=${d.month}-${new Date(Number(d.month.slice(0, 4)), Number(d.month.slice(5, 7)), 0).getDate()}`}
                className="text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("alerts.open")}
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {KPIS.map((kpi) => {
              const now = d.current[kpi.key];
              const before = d.previous[kpi.key];
              return (
                <KpiCard
                  key={kpi.key}
                  label={t(kpi.label)}
                  value={
                    kpi.kind === "pct"
                      ? pct(now)
                      : kpi.key === "savingValue"
                        ? signedMoney(now ?? 0)
                        : money(now ?? 0)
                  }
                  valueClass={
                    kpi.key === "savingValue" && (now ?? 0) < -0.005
                      ? "text-destructive"
                      : undefined
                  }
                  sub={
                    kpi.key === "savingValue"
                      ? t("kpi.ofStandard", { pct: pct(d.current.savingPct) })
                      : undefined
                  }
                  change={
                    now === null || before === null
                      ? null
                      : { diff: now - before, kind: kpi.kind, goodWhen: kpi.goodWhen }
                  }
                  vsLabel={t("vsLast", { month: monthLabel(d.previousMonth) })}
                  noPrevious={t("noPrevious")}
                  formatDiff={(v) =>
                    kpi.kind === "pct"
                      ? `${v > 0 ? "+" : ""}${(v * 100).toFixed(1)} pt`
                      : signedMoney(v)
                  }
                />
              );
            })}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("trend.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ChartContainer config={chartLabels} className="h-[260px] w-full">
                <LineChart data={d.trend} margin={{ left: 8, right: 16, top: 8 }}>
                  <CartesianGrid vertical={false} strokeOpacity={0.4} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(m) => moment(`${m}-01`).format("MMM")}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={64}
                    tickFormatter={(v) => compactMoney(Number(v))}
                  />
                  <ChartTooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) =>
                          monthLabel(String(payload?.[0]?.payload?.month ?? ""))
                        }
                        formatter={(value, name) => (
                          <div className="flex w-full items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span
                                className="h-2.5 w-2.5 rounded-[2px]"
                                style={{ background: `var(--color-${name})` }}
                              />
                              {chartLabels[String(name)]?.label}
                            </span>
                            <span className="font-medium tabular-nums text-foreground">
                              {money(Number(value))}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  {(["standardValue", "actualValue", "wasteValue"] as const).map((key) => (
                    <Line
                      key={key}
                      dataKey={key}
                      type="linear"
                      stroke={`var(--color-${key})`}
                      strokeWidth={2}
                      dot={{
                        r: 4,
                        strokeWidth: 2,
                        stroke: `var(--color-${key})`,
                        fill: "hsl(var(--card))",
                      }}
                      activeDot={{ r: 5, stroke: "hsl(var(--card))", strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ChartContainer>

              {/* Table view of the chart (also the relief for the low-contrast series). */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t("trend.month")}</TableHead>
                    <NumHead>{t("trend.sales")}</NumHead>
                    <NumHead>{t("trend.standard")}</NumHead>
                    <NumHead>{t("trend.actual")}</NumHead>
                    <NumHead>{t("trend.waste")}</NumHead>
                    <NumHead>{t("kpi.saving")}</NumHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.trend.map((row) => (
                    <TableRow
                      key={row.month}
                      className={cn(row.month === d.month && "bg-muted/50 font-medium")}
                    >
                      <TableCell className="text-sm">{monthLabel(row.month)}</TableCell>
                      <NumCell>{money(row.sales)}</NumCell>
                      <NumCell>{money(row.standardValue)}</NumCell>
                      <NumCell>{money(row.actualValue)}</NumCell>
                      <NumCell>{money(row.wasteValue)}</NumCell>
                      <NumCell
                        className={cn(row.savingValue < -0.005 && "text-destructive")}
                      >
                        {signedMoney(row.savingValue)}
                      </NumCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("category.title")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">{t("category.name")}</TableHead>
                      <NumHead>{t("category.standard")}</NumHead>
                      <NumHead>{t("category.actual")}</NumHead>
                      <NumHead>{t("category.saving")}</NumHead>
                      <NumHead>{t("category.waste")}</NumHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.categories.map((c) => (
                      <TableRow key={c.category}>
                        <TableCell className="text-sm">
                          {c.category || t("category.other")}
                        </TableCell>
                        <NumCell>{money(c.standardValue)}</NumCell>
                        <NumCell>{money(c.actualValue)}</NumCell>
                        <NumCell
                          className={cn(c.savingValue < -0.005 && "text-destructive")}
                        >
                          {signedMoney(c.savingValue)}
                        </NumCell>
                        <NumCell>{money(c.wasteValue)}</NumCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("reasons.title")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {d.wasteByReason.length === 0 ? (
                  <p className="px-6 pb-6 text-sm text-muted-foreground">
                    {t("reasons.empty")}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">{t("reasons.reason")}</TableHead>
                        <NumHead>{t("reasons.thisMonth")}</NumHead>
                        <NumHead>{t("reasons.lastMonth")}</NumHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.wasteByReason.map((r) => (
                        <TableRow key={r.reason}>
                          <TableCell className="text-sm">
                            <span className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "h-2 w-2 rounded-full",
                                  r.wasteType === "WASTE" ? "bg-destructive" : "bg-info",
                                )}
                              />
                              {tWaste(`reasons.${r.reason}`)}
                            </span>
                          </TableCell>
                          <NumCell className="font-medium">{money(r.value)}</NumCell>
                          <NumCell className="text-muted-foreground">
                            {money(r.previousValue)}
                          </NumCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <TopList
              title={t("top.losses")}
              empty={t("top.emptyLosses")}
              items={d.topLosses}
              labels={{ item: t("top.item"), qty: t("top.qty"), value: t("top.value") }}
              qty={(i) => i.savingQty}
              value={(i) => signedMoney(i.savingValue)}
              valueClass="text-destructive"
            />
            <TopList
              title={t("top.waste")}
              empty={t("top.emptyWaste")}
              items={d.topWaste}
              labels={{ item: t("top.item"), qty: t("top.qty"), value: t("top.value") }}
              qty={(i) => i.wasteQty}
              value={(i) => money(i.wasteValue)}
            />
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  valueClass,
  sub,
  change,
  vsLabel,
  noPrevious,
  formatDiff,
}: {
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
  change: {
    diff: number;
    kind: "money" | "pct";
    goodWhen: "up" | "down" | "neutral";
  } | null;
  vsLabel: string;
  noPrevious: string;
  formatDiff: (v: number) => string;
}) {
  const flat =
    !change || Math.abs(change.diff) < (change.kind === "pct" ? 0.0005 : 0.005);
  const good =
    change && !flat && (change.diff > 0) === (change.goodWhen === "up");
  const Arrow = change && change.diff > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("text-xl font-semibold tabular-nums", valueClass)}>
          {value}
        </div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        <div className="mt-1 flex items-center gap-1 text-xs">
          {change && !flat ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                change.goodWhen === "neutral"
                  ? "text-foreground"
                  : good
                    ? "text-success"
                    : "text-destructive",
              )}
            >
              <Arrow className="h-3 w-3" />
              {formatDiff(change.diff)}
            </span>
          ) : change ? (
            <span className="text-muted-foreground">±0</span>
          ) : null}
          <span className="text-muted-foreground">
            {change ? vsLabel : noPrevious}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function TopList({
  title,
  empty,
  items,
  labels,
  qty,
  value,
  valueClass,
}: {
  title: string;
  empty: string;
  items: VarianceItem[];
  labels: { item: string; qty: string; value: string };
  qty: (item: VarianceItem) => number;
  value: (item: VarianceItem) => string;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">{empty}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8 text-xs">#</TableHead>
                <TableHead className="text-xs">{labels.item}</TableHead>
                <NumHead>{labels.qty}</NumHead>
                <NumHead>{labels.value}</NumHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={item.variantId}>
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="text-sm">{itemName(item)}</TableCell>
                  <NumCell>{qty(item).toLocaleString()}</NumCell>
                  <NumCell className={cn("font-medium", valueClass)}>
                    {value(item)}
                  </NumCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function NumHead({ children }: { children: React.ReactNode }) {
  return (
    <TableHead className="text-xs text-right whitespace-nowrap">{children}</TableHead>
  );
}

function NumCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TableCell className={cn("text-right text-sm tabular-nums whitespace-nowrap", className)}>
      {children}
    </TableCell>
  );
}
