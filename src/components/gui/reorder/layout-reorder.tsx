"use client";

import {
  useApplyReorderLevels,
  useQueryReorder,
} from "@/app/hooks/use-query-reorder";
import type { ReorderItem, ReorderStatus } from "@/classes/reorder";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { formatCurrency } from "@/lib/currency";
import { onGetExportExcel } from "@/lib/export-xlsx";
import { cn } from "@/lib/utils";
import { useAuthentication } from "contexts/authentication-context";
import { Download, RefreshCw, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Filter = "TO_ORDER" | "ALL" | "NO_USAGE";

const PARAMS = [
  { key: "lookbackDays", label: "params.lookback", fallback: 14 },
  { key: "leadTimeDays", label: "params.leadTime", fallback: 1 },
  { key: "orderCycleDays", label: "params.orderCycle", fallback: 2 },
  { key: "safetyDays", label: "params.safety", fallback: 1 },
] as const;

const STATUS_CLASS: Record<ReorderStatus, string> = {
  OUT: "border-destructive/30 bg-destructive/10 text-destructive",
  ORDER: "border-warning/30 bg-warning/10 text-warning",
  OK: "border-success/30 bg-success/10 text-success",
  NO_USAGE: "border-border bg-muted text-muted-foreground",
};

function itemName(item: ReorderItem) {
  return item.variantName && !["Default", "ns"].includes(item.variantName)
    ? `${item.productTitle} (${item.variantName})`
    : item.productTitle;
}

export function LayoutReorder(props: WithLayoutPermissionProps) {
  const t = useTranslations("reorder");
  const { currencyCode, currentWarehouse } = useAuthentication();
  const search = useSearchParams();
  const pathname = usePathname();
  const { push } = useRouter();

  const params = Object.fromEntries(
    PARAMS.map((p) => [p.key, Number(search.get(p.key) ?? p.fallback)]),
  ) as Record<(typeof PARAMS)[number]["key"], number>;
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(PARAMS.map((p) => [p.key, String(params[p.key])])),
  );
  const [filter, setFilter] = useState<Filter>("TO_ORDER");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading, mutate } = useQueryReorder(params);
  const { trigger: applyLevels, isMutating } = useApplyReorderLevels();
  const items = useMemo(() => data?.result || [], [data]);
  const isMain = !!currentWarehouse?.isMain;

  const visible = items.filter((i) =>
    filter === "ALL"
      ? true
      : filter === "NO_USAGE"
        ? i.status === "NO_USAGE"
        : i.status === "OUT" || i.status === "ORDER",
  );
  const groups = useMemo(() => {
    const map = new Map<string, ReorderItem[]>();
    for (const item of visible) {
      const key = item.supplierName || t("table.noSupplier");
      map.set(key, [...(map.get(key) || []), item]);
    }
    return Array.from(map);
  }, [visible, t]);

  const toOrder = items.filter((i) => i.status === "OUT" || i.status === "ORDER");
  const money = (v: number) => formatCurrency(v, currencyCode);
  const num = (v: number, digits = 0) =>
    v.toLocaleString(undefined, { maximumFractionDigits: digits });

  const recalc = () => {
    const next = new URLSearchParams(search.toString());
    PARAMS.forEach((p) => {
      const v = Number(draft[p.key]);
      if (Number.isFinite(v) && v >= 0) next.set(p.key, String(v));
    });
    push(`${pathname}?${next.toString()}`);
  };

  const withUsage = visible.filter((i) => i.status !== "NO_USAGE");
  const allSelected =
    withUsage.length > 0 && withUsage.every((i) => selected.has(i.variantId));

  const onApply = async () => {
    const chosen = items.filter((i) => selected.has(i.variantId));
    const res = await applyLevels({
      items: chosen.map((i) => ({
        variantId: i.variantId,
        lowStockQty: i.reorderPoint,
        idealStockQty: i.parLevel,
      })),
    });
    if (!res?.success) {
      toast.error(res?.error || "Failed");
      return;
    }
    toast.success(t("levels.applied", { count: res.result ?? 0 }));
    setSelected(new Set());
    mutate();
  };

  const onExport = () =>
    onGetExportExcel(
      toOrder.map((i) => ({
        Supplier: i.supplierName || "",
        [t("table.item")]: itemName(i),
        [t("table.current")]: i.currentQty,
        [t("table.avgDaily")]: Number(i.avgDailyUsage.toFixed(2)),
        [t("table.days")]: i.daysOfStock === null ? "" : Number(i.daysOfStock.toFixed(1)),
        [t("table.reorderPoint")]: i.reorderPoint,
        [t("table.par")]: i.parLevel,
        [t("table.orderQty")]: i.orderQty,
        [`${t("table.value")} (${currencyCode})`]: Number(i.orderValue.toFixed(2)),
      })),
      `reorder-${new Date().toISOString().slice(0, 10)}`,
      t("title"),
    );

  return (
    <div className="w-full flex flex-col gap-4 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button variant="outline" onClick={onExport} disabled={!toOrder.length}>
          <Download className="h-4 w-4 mr-1" />
          {t("export")}
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          {PARAMS.map((p) => (
            <label key={p.key} className="flex flex-col gap-1 text-xs text-muted-foreground">
              {t(p.label)}
              <Input
                type="number"
                min={p.key === "lookbackDays" ? 1 : 0}
                className="h-9 w-32"
                value={draft[p.key]}
                onChange={(e) => setDraft((d) => ({ ...d, [p.key]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && recalc()}
              />
            </label>
          ))}
          <Button variant="secondary" onClick={recalc}>
            <RefreshCw className="h-4 w-4 mr-1" />
            {t("params.apply")}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingState label={t("loading")} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label={t("summary.toOrder")} value={String(toOrder.length)} />
            <Stat
              label={t("summary.out")}
              value={String(items.filter((i) => i.status === "OUT").length)}
              className={items.some((i) => i.status === "OUT") ? "text-destructive" : undefined}
            />
            <Stat
              label={t("summary.value")}
              value={money(toOrder.reduce((sum, i) => sum + i.orderValue, 0))}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["TO_ORDER", t("filter.toOrder"), toOrder.length],
                  ["ALL", t("filter.all"), items.length],
                  ["NO_USAGE", t("filter.noUsage"), items.filter((i) => i.status === "NO_USAGE").length],
                ] as [Filter, string, number][]
              ).map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    filter === key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden max-w-sm text-right text-[11px] text-muted-foreground md:block">
                {isMain ? t("levels.hint") : t("levels.mainOnly")}
              </span>
              <Button
                size="sm"
                onClick={onApply}
                disabled={!isMain || !props.allowUpdate || selected.size === 0 || isMutating}
              >
                <Save className="h-4 w-4 mr-1" />
                {t("levels.apply", { count: selected.size })}
              </Button>
            </div>
          </div>

          {groups.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <EmptyState title={t("empty.title")} description={t("empty.description")} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          aria-label={t("levels.selectAll")}
                          checked={allSelected}
                          disabled={!isMain || withUsage.length === 0}
                          onCheckedChange={(v) =>
                            setSelected(
                              v ? new Set(withUsage.map((i) => i.variantId)) : new Set(),
                            )
                          }
                        />
                      </TableHead>
                      <TableHead className="text-xs">{t("table.item")}</TableHead>
                      <Num>{t("table.current")}</Num>
                      <Num>{t("table.avgDaily")}</Num>
                      <Num>{t("table.days")}</Num>
                      <Num>{t("table.reorderPoint")}</Num>
                      <Num>{t("table.par")}</Num>
                      <Num>{t("table.orderQty")}</Num>
                      <Num>{t("table.value")}</Num>
                      <TableHead className="text-xs">{t("table.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map(([supplier, rows]) => (
                      <SupplierRows
                        key={supplier}
                        supplier={supplier}
                        rows={rows}
                        selected={selected}
                        selectable={isMain}
                        onToggle={(id, on) =>
                          setSelected((s) => {
                            const next = new Set(s);
                            if (on) next.add(id);
                            else next.delete(id);
                            return next;
                          })
                        }
                        render={(item) => (
                          <>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <ImageWithFallback
                                  src={item.image ?? undefined}
                                  alt=""
                                  width={28}
                                  height={28}
                                  className="h-7 w-7 shrink-0 rounded border object-contain"
                                />
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium">
                                    {itemName(item)}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {item.savedLowStockQty != null || item.savedIdealStockQty != null
                                      ? t("table.saved", {
                                          low: item.savedLowStockQty ?? "—",
                                          ideal: item.savedIdealStockQty ?? "—",
                                        })
                                      : t("table.notSaved")}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <NumCell>{num(item.currentQty)}</NumCell>
                            <NumCell>{num(item.avgDailyUsage, 1)}</NumCell>
                            <NumCell
                              className={cn(
                                item.daysOfStock !== null &&
                                  item.status !== "OK" &&
                                  "font-semibold text-destructive",
                              )}
                            >
                              {item.daysOfStock === null ? "—" : num(item.daysOfStock, 1)}
                            </NumCell>
                            <NumCell>{num(item.reorderPoint)}</NumCell>
                            <NumCell>{num(item.parLevel)}</NumCell>
                            <NumCell className="font-semibold">
                              {item.orderQty > 0 ? num(item.orderQty) : "—"}
                            </NumCell>
                            <NumCell>{item.orderQty > 0 ? money(item.orderValue) : "—"}</NumCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                  STATUS_CLASS[item.status],
                                )}
                              >
                                {t(`status.${item.status}`)}
                              </span>
                            </TableCell>
                          </>
                        )}
                      />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function SupplierRows({
  supplier,
  rows,
  selected,
  selectable,
  onToggle,
  render,
}: {
  supplier: string;
  rows: ReorderItem[];
  selected: Set<string>;
  selectable: boolean;
  onToggle: (id: string, on: boolean) => void;
  render: (item: ReorderItem) => React.ReactNode;
}) {
  return (
    <>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableCell colSpan={10} className="py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {supplier}
        </TableCell>
      </TableRow>
      {rows.map((item) => (
        <TableRow key={item.variantId}>
          <TableCell>
            <Checkbox
              aria-label={item.productTitle}
              checked={selected.has(item.variantId)}
              disabled={!selectable || item.status === "NO_USAGE"}
              onCheckedChange={(v) => onToggle(item.variantId, !!v)}
            />
          </TableCell>
          {render(item)}
        </TableRow>
      ))}
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

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("text-xl font-semibold tabular-nums", className)}>{value}</div>
      </CardContent>
    </Card>
  );
}
