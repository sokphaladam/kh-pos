"use client";

import { useQueryMenuAnalysis } from "@/app/hooks/use-query-menu-analysis";
import type { MenuClass, MenuItemAnalysis } from "@/classes/menu-analysis";
import { DateRangePicker } from "@/components/date-range-picker";
import { ProductCategoryPicker } from "@/components/gui/product/form/product-cateory";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { onGetExportExcel } from "@/lib/export-xlsx";
import { cn } from "@/lib/utils";
import { useAuthentication } from "contexts/authentication-context";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { Download, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const DAY = "yyyy-MM-dd";
// Matrix layout: top row high profit, left column popular.
const MATRIX: MenuClass[] = ["STAR", "PUZZLE", "PLOWHORSE", "DOG"];
const CLASS_CLASS: Record<MenuClass, string> = {
  STAR: "border-success/30 bg-success/10 text-success",
  PLOWHORSE: "border-warning/30 bg-warning/10 text-warning",
  PUZZLE: "border-info/30 bg-info/10 text-info",
  DOG: "border-border bg-muted text-muted-foreground",
};
/** BBQ / full-service food cost benchmark from the workbook (30-35%). */
const DEFAULT_TARGET_PCT = 33;

function itemName(item: MenuItemAnalysis) {
  return item.variantName && !["Default", "ns"].includes(item.variantName)
    ? `${item.productTitle} (${item.variantName})`
    : item.productTitle;
}

export function LayoutMenuAnalysis() {
  const t = useTranslations("menuAnalysis");
  const { currencyCode } = useAuthentication();
  const search = useSearchParams();
  const pathname = usePathname();
  const { push } = useRouter();
  const [targetPct, setTargetPct] = useState(String(DEFAULT_TARGET_PCT));

  const now = new Date();
  const from = search.get("from") || format(startOfMonth(now), DAY);
  const to = search.get("to") || format(endOfMonth(now), DAY);
  const categoryId = search.get("categoryId") || undefined;
  const { data, isLoading } = useQueryMenuAnalysis({ from, to, categoryId });
  const items = useMemo(() => data?.result?.items || [], [data]);
  const summary = data?.result?.summary;

  const target = Number(targetPct) / 100;
  const money = (v: number) => formatCurrency(v, currencyCode);
  const pct = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);

  const setParam = (values: Record<string, string | null>) => {
    const params = new URLSearchParams(search.toString());
    Object.entries(values).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    push(`${pathname}?${params.toString()}`);
  };

  const dateRange = useMemo(
    () => ({ from: new Date(`${from}T00:00:00`), to: new Date(`${to}T00:00:00`) }),
    [from, to],
  );

  const onExport = () =>
    onGetExportExcel(
      items.map((i) => ({
        [t("table.item")]: itemName(i),
        [t("table.qty")]: i.qty,
        [t("table.mix")]: pct(i.mixPct),
        [t("table.price")]: Number(i.pricePerServing.toFixed(2)),
        [t("table.costServing")]: Number(i.costPerServing.toFixed(4)),
        [t("table.costPct")]: pct(i.costPct),
        [t("table.margin")]: Number(i.marginPerServing.toFixed(2)),
        [t("table.total")]: Number(i.totalMargin.toFixed(2)),
        [t("table.class")]: t(`class.${i.menuClass}`),
      })),
      `menu-analysis-${from}-${to}`,
      t("title"),
    );

  return (
    <div className="w-full flex flex-col gap-4 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button variant="outline" onClick={onExport} disabled={!items.length}>
          <Download className="h-4 w-4 mr-1" />
          {t("export")}
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <DateRangePicker
          dateRange={dateRange}
          onChange={(range) =>
            range?.from &&
            setParam({
              from: format(range.from, DAY),
              to: format(range.to ?? range.from, DAY),
            })
          }
        />
        {/* The picker is a fixed 300px wide. */}
        <div className="w-[300px] shrink-0">
          <ProductCategoryPicker
            allowCreateNew={false}
            value={categoryId}
            onChange={(c) => setParam({ categoryId: c?.id ?? null })}
          />
        </div>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("target")}
          <Input
            type="number"
            min={1}
            max={100}
            className="h-9 w-28"
            value={targetPct}
            onChange={(e) => setTargetPct(e.target.value)}
          />
        </label>
      </div>

      {isLoading || !summary ? (
        <LoadingState label={t("loading")} />
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState title={t("empty.title")} description={t("empty.description")} />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={t("summary.revenue")} value={money(summary.revenue)} />
            <Stat label={t("summary.cost")} value={money(summary.cost)} />
            <Stat
              label={t("summary.costPct")}
              value={pct(summary.costPct)}
              className={
                summary.costPct !== null && summary.costPct > target
                  ? "text-destructive"
                  : undefined
              }
            />
            <Stat
              label={t("summary.margin")}
              value={money(summary.totalMargin)}
              sub={t("summary.avgMargin", { value: money(summary.avgMarginPerServing) })}
            />
          </div>

          <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
            <div />
            <AxisLabel>{t("axis.popular")}</AxisLabel>
            <AxisLabel>{t("axis.notPopular")}</AxisLabel>
            {MATRIX.map((menuClass, i) => (
              <Quadrant
                key={menuClass}
                rowLabel={
                  i % 2 === 0
                    ? i === 0
                      ? t("axis.profitable")
                      : t("axis.notProfitable")
                    : null
                }
                title={t(`class.${menuClass}`)}
                hint={t(`classHint.${menuClass}`)}
                badgeClass={CLASS_CLASS[menuClass]}
                items={items.filter((it) => it.menuClass === menuClass)}
                money={money}
              />
            ))}
          </div>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {t("rules")}
          </p>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t("table.item")}</TableHead>
                    <Num>{t("table.qty")}</Num>
                    <Num>{t("table.mix")}</Num>
                    <Num>{t("table.price")}</Num>
                    <Num>{t("table.costServing")}</Num>
                    <Num>{t("table.costPct")}</Num>
                    <Num>{t("table.margin")}</Num>
                    <Num>{t("table.total")}</Num>
                    <TableHead className="text-xs">{t("table.class")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const above = item.costPct !== null && item.costPct > target;
                    return (
                      <TableRow key={item.variantId}>
                        <TableCell>
                          <div className="text-sm font-medium">{itemName(item)}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {item.categoryTitle}
                          </div>
                        </TableCell>
                        <NumCell>{item.qty.toLocaleString()}</NumCell>
                        <NumCell
                          className={cn(!item.popular && "text-muted-foreground")}
                        >
                          {pct(item.mixPct)}
                        </NumCell>
                        <NumCell>{money(item.pricePerServing)}</NumCell>
                        <NumCell>
                          <span
                            title={item.costEstimated ? t("table.estimated") : undefined}
                          >
                            {money(item.costPerServing)}
                            {item.costEstimated && "*"}
                          </span>
                        </NumCell>
                        <NumCell className={cn(above && "font-semibold text-destructive")}>
                          {pct(item.costPct)}
                          {above && (
                            <div className="text-[10px] font-normal">
                              {t("table.aboveTarget")}
                            </div>
                          )}
                        </NumCell>
                        <NumCell
                          className={cn(!item.profitable && "text-muted-foreground")}
                        >
                          {money(item.marginPerServing)}
                        </NumCell>
                        <NumCell className="font-semibold">{money(item.totalMargin)}</NumCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              CLASS_CLASS[item.menuClass],
                            )}
                          >
                            {t(`class.${item.menuClass}`)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {items.some((i) => i.costEstimated) && (
            <p className="text-xs text-muted-foreground">* {t("table.estimated")}</p>
          )}
        </>
      )}
    </div>
  );
}

function AxisLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

function Quadrant({
  rowLabel,
  title,
  hint,
  badgeClass,
  items,
  money,
}: {
  rowLabel: string | null;
  title: string;
  hint: string;
  badgeClass: string;
  items: MenuItemAnalysis[];
  money: (v: number) => string;
}) {
  return (
    <>
      {rowLabel !== null && (
        <div className="flex items-center text-xs font-semibold uppercase tracking-wide text-muted-foreground [writing-mode:vertical-rl] rotate-180">
          {rowLabel}
        </div>
      )}
      <Card className="min-h-[140px]">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                badgeClass,
              )}
            >
              {title} · {items.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
          <ul className="space-y-1">
            {items.slice(0, 8).map((item) => (
              <li key={item.variantId} className="flex justify-between gap-2 text-sm">
                <span className="truncate">{itemName(item)}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {money(item.totalMargin)}
                </span>
              </li>
            ))}
            {items.length > 8 && (
              <li className="text-xs text-muted-foreground">+{items.length - 8}</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}

function Num({ children }: { children: React.ReactNode }) {
  return <TableHead className="text-xs text-right whitespace-nowrap">{children}</TableHead>;
}

function NumCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <TableCell className={cn("text-right text-sm tabular-nums whitespace-nowrap", className)}>
      {children}
    </TableCell>
  );
}

function Stat({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("text-xl font-semibold tabular-nums", className)}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
