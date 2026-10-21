"use client";

import { useQueryStockVariance } from "@/app/hooks/use-query-stock-variance";
import type { VarianceItem } from "@/classes/stock-variance";
import { DateRangePicker } from "@/components/date-range-picker";
import { ImageWithFallback } from "@/components/image-with-fallback";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/currency";
import { onGetExportExcel } from "@/lib/export-xlsx";
import { VarianceStatus } from "@/lib/stock-variance";
import { cn } from "@/lib/utils";
import { useAuthentication } from "contexts/authentication-context";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { Download, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const DAY = "yyyy-MM-dd";
const STATUSES: VarianceStatus[] = ["INVESTIGATE", "CHECK", "OK", "NOT_COUNTED"];

const STATUS_CLASS: Record<VarianceStatus, string> = {
  INVESTIGATE: "border-destructive/30 bg-destructive/10 text-destructive",
  CHECK: "border-warning/30 bg-warning/10 text-warning",
  OK: "border-success/30 bg-success/10 text-success",
  NOT_COUNTED: "border-border bg-muted text-muted-foreground",
};

function itemName(item: VarianceItem) {
  return item.variantName && !["Default", "ns"].includes(item.variantName)
    ? `${item.productTitle} (${item.variantName})`
    : item.productTitle;
}

export function LayoutStockVariance() {
  const t = useTranslations("stockVariance");
  const { currencyCode } = useAuthentication();
  const search = useSearchParams();
  const pathname = usePathname();
  const { push } = useRouter();
  const [statusFilter, setStatusFilter] = useState<VarianceStatus | "ALL">(
    "ALL",
  );
  const [term, setTerm] = useState("");

  const now = new Date();
  const from = search.get("from") || format(startOfMonth(now), DAY);
  const to = search.get("to") || format(endOfMonth(now), DAY);
  const { data, isLoading } = useQueryStockVariance({ from, to });

  const items = useMemo(() => data?.result?.items || [], [data]);
  const summary = data?.result?.summary;
  const visible = useMemo(() => {
    const q = term.trim().toLowerCase();
    return items.filter(
      (i) =>
        (statusFilter === "ALL" || i.status === statusFilter) &&
        (!q || itemName(i).toLowerCase().includes(q)),
    );
  }, [items, statusFilter, term]);

  const money = (v: number) => formatCurrency(Math.abs(v), currencyCode);
  const signedMoney = (v: number) =>
    Math.abs(v) < 0.005 ? money(0) : `${v < 0 ? "-" : "+"}${money(v)}`;
  const pct = (v: number | null) =>
    v === null ? "—" : `${v > 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;
  const qty = (v: number) => v.toLocaleString();

  const dateRange = useMemo(
    () => ({
      from: new Date(`${from}T00:00:00`),
      to: new Date(`${to}T00:00:00`),
    }),
    [from, to],
  );

  const onExport = () =>
    onGetExportExcel(
      visible.map((i) => ({
        [t("table.item")]: itemName(i),
        [t("table.opening")]: i.openingQty,
        [t("table.received")]: i.receivedQty,
        [t("table.standard")]: i.standardQty,
        [t("table.waste")]: i.wasteQty,
        [t("table.nonSale")]: i.nonSaleQty,
        [t("table.actual")]: i.actualQty,
        [t("table.closing")]: i.closingQty,
        [`${t("table.saving")} (qty)`]: i.savingQty,
        [`${t("table.saving")} (${currencyCode})`]: Number(
          i.savingValue.toFixed(2),
        ),
        [t("table.pct")]: pct(i.savingPct),
        [t("table.status")]: t(`status.${i.status}`),
      })),
      `stock-variance-${from}-${to}`,
      t("title"),
    );

  const savingTone = (v: number) =>
    v < -0.005 ? "text-destructive" : v > 0.005 ? "text-success" : undefined;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button variant="outline" onClick={onExport} disabled={!visible.length}>
          <Download className="h-4 w-4 mr-1" />
          {t("export")}
        </Button>
      </div>

      <div>
        <DateRangePicker
          dateRange={dateRange}
          onChange={(range) => {
            if (!range?.from) return;
            const params = new URLSearchParams(search.toString());
            params.set("from", format(range.from, DAY));
            params.set("to", format(range.to ?? range.from, DAY));
            push(`${pathname}?${params.toString()}`);
          }}
        />
      </div>

      {isLoading || !summary ? (
        <LoadingState label={t("loading")} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat label={t("summary.standard")} value={money(summary.standardValue)} />
            <Stat label={t("summary.actual")} value={money(summary.actualValue)} />
            <Stat
              label={t("summary.saving")}
              value={signedMoney(summary.savingValue)}
              className={savingTone(summary.savingValue)}
              sub={
                summary.savingPct !== null
                  ? t("summary.ofStandard", { pct: pct(summary.savingPct) })
                  : undefined
              }
            />
            <Stat
              label={t("summary.waste")}
              value={money(summary.wasteValue)}
              className={summary.wasteValue > 0 ? "text-destructive" : undefined}
            />
            <Stat label={t("summary.nonSale")} value={money(summary.nonSaleValue)} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {(["ALL", ...STATUSES] as const).map((status) => {
                const count =
                  status === "ALL"
                    ? items.length
                    : summary.statusCount[status];
                const active = statusFilter === status;
                const chip = (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? status === "ALL"
                          ? "border-primary bg-primary text-primary-foreground"
                          : cn(STATUS_CLASS[status], "ring-1 ring-current")
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {t(`status.${status}`)} ({count})
                  </button>
                );
                if (status === "ALL") return chip;
                return (
                  <TooltipProvider key={status}>
                    <Tooltip>
                      <TooltipTrigger asChild>{chip}</TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{t(`statusHint.${status}`)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-9 pl-8"
                placeholder={t("search")}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {visible.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title={t("empty.title")}
                    description={t("empty.description")}
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">{t("table.item")}</TableHead>
                      <Num>{t("table.opening")}</Num>
                      <Num>{t("table.received")}</Num>
                      <Num>{t("table.standard")}</Num>
                      <Num>{t("table.waste")}</Num>
                      <Num>{t("table.actual")}</Num>
                      <Num>{t("table.closing")}</Num>
                      <Num>{t("table.saving")}</Num>
                      <Num>{t("table.pct")}</Num>
                      <TableHead className="text-xs">{t("table.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((item) => (
                      <TableRow key={item.variantId}>
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
                                {item.lastCountDate
                                  ? t("table.lastCount", { date: item.lastCountDate })
                                  : item.categoryTitle}
                                {item.otherOutQty !== 0 &&
                                  ` · ${t("table.otherOut", { qty: qty(item.otherOutQty) })}`}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <NumCell>{qty(item.openingQty)}</NumCell>
                        <NumCell>{qty(item.receivedQty)}</NumCell>
                        <NumCell>
                          <div>{qty(item.standardQty)}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {money(item.standardValue)}
                          </div>
                        </NumCell>
                        <NumCell>
                          <div>{qty(item.wasteQty)}</div>
                          {item.nonSaleQty !== 0 && (
                            <div className="text-[11px] text-muted-foreground">
                              {t("table.nonSale")} {qty(item.nonSaleQty)}
                            </div>
                          )}
                        </NumCell>
                        <NumCell className="font-medium">
                          {item.counted ? qty(item.actualQty) : "—"}
                        </NumCell>
                        <NumCell>{qty(item.closingQty)}</NumCell>
                        <NumCell className={cn("font-semibold", savingTone(item.savingValue))}>
                          {item.counted ? (
                            <>
                              <div>
                                {item.savingQty > 0 ? "+" : ""}
                                {qty(item.savingQty)}
                              </div>
                              <div className="text-[11px] font-normal">
                                {signedMoney(item.savingValue)}
                              </div>
                            </>
                          ) : (
                            "—"
                          )}
                        </NumCell>
                        <NumCell className={savingTone(item.savingValue)}>
                          {item.counted ? pct(item.savingPct) : "—"}
                        </NumCell>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">{t("formula")}</p>
        </>
      )}
    </div>
  );
}

function Num({ children }: { children: React.ReactNode }) {
  return <TableHead className="text-xs text-right whitespace-nowrap">{children}</TableHead>;
}

function NumCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TableCell className={cn("text-right text-sm whitespace-nowrap", className)}>
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
        <div className={cn("text-xl font-semibold", className)}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
