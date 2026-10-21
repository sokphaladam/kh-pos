"use client";

import { useQueryWasteList } from "@/app/hooks/use-query-waste";
import { DateRangePicker } from "@/components/date-range-picker";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import {
  WASTE_REASON_CODES,
  WASTE_REASONS,
  WasteReason,
  WasteType,
} from "@/lib/waste-reasons";
import { useAuthentication } from "contexts/authentication-context";
import { endOfMonth, format, startOfMonth } from "date-fns";
import moment from "moment-timezone";
import { Plus, Trash2, UtensilsCrossed, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { sheetRecordWaste } from "./sheet-record-waste";

const LIMIT = 30;
const ALL = "all";
const DAY = "yyyy-MM-dd";

export function LayoutWaste(props: WithLayoutPermissionProps) {
  const t = useTranslations("waste");
  const { currencyCode } = useAuthentication();
  const search = useSearchParams();
  const pathname = usePathname();
  const { push } = useRouter();

  const now = new Date();
  const from = search.get("from") || format(startOfMonth(now), DAY);
  const to = search.get("to") || format(endOfMonth(now), DAY);
  const offset = Number(search.get("offset") || 0);
  const wasteType = (["WASTE", "NON_SALE"] as const).find(
    (v) => v === search.get("type"),
  );
  const reason = WASTE_REASON_CODES.find((v) => v === search.get("reason"));

  const { data, isLoading, mutate } = useQueryWasteList({
    from,
    to,
    wasteType,
    reason,
    limit: LIMIT,
    offset,
  });

  const setParams = useCallback(
    (values: Record<string, string | null>) => {
      const params = new URLSearchParams(search.toString());
      Object.entries(values).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      params.delete("offset");
      push(`${pathname}?${params.toString()}`);
    },
    [search, push, pathname],
  );

  const money = useCallback(
    (amount: number) => formatCurrency(amount, currencyCode),
    [currencyCode],
  );

  const onRecord = useCallback(async () => {
    await sheetRecordWaste.show({});
    // "Save & add another" can save several entries before the sheet closes.
    mutate();
  }, [mutate]);

  const dateRange = useMemo(
    () => ({ from: new Date(`${from}T00:00:00`), to: new Date(`${to}T00:00:00`) }),
    [from, to],
  );

  const summary = data?.result?.summary;
  const topWaste = summary?.byReason.find(
    (r) => WASTE_REASONS.find((w) => w.code === r.reason)?.type === "WASTE",
  );
  const rows = data?.result?.data || [];
  const hasFilter = !!wasteType || !!reason;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={onRecord} disabled={!props.allowCreate}>
          <Plus className="h-4 w-4 mr-1" />
          {t("record")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={Trash2}
          tone="destructive"
          label={t("summary.waste")}
          value={money(summary?.wasteCost ?? 0)}
          sub={t("summary.entries", { count: summary?.wasteCount ?? 0 })}
        />
        <SummaryCard
          icon={UtensilsCrossed}
          tone="info"
          label={t("summary.nonSale")}
          value={money(summary?.nonSaleCost ?? 0)}
          sub={t("summary.entries", { count: summary?.nonSaleCount ?? 0 })}
        />
        <SummaryCard
          label={t("summary.topReason")}
          value={
            topWaste ? t(`reasons.${topWaste.reason}`) : t("summary.none")
          }
          sub={topWaste ? money(topWaste.cost) : undefined}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DateRangePicker
          dateRange={dateRange}
          onChange={(range) =>
            range?.from &&
            setParams({
              from: format(range.from, DAY),
              to: format(range.to ?? range.from, DAY),
            })
          }
        />
        <FilterSelect
          label={t("filters.type")}
          allLabel={t("filters.all")}
          value={wasteType}
          options={(["WASTE", "NON_SALE"] as WasteType[]).map((v) => ({
            value: v,
            label: t(`types.${v}`),
          }))}
          onChange={(v) => setParams({ type: v })}
        />
        <FilterSelect
          label={t("filters.reason")}
          allLabel={t("filters.all")}
          value={reason}
          options={WASTE_REASONS.map((r) => ({
            value: r.code,
            label: t(`reasons.${r.code}`),
          }))}
          onChange={(v) => setParams({ reason: v })}
        />
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => setParams({ type: null, reason: null })}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            {t("filters.clear")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState label={t("loading")} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("title")}</CardTitle>
            <CardDescription>
              {from} → {to}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <EmptyState
                title={t("empty.title")}
                description={t("empty.description")}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t("table.date")}</TableHead>
                    <TableHead className="text-xs">{t("table.item")}</TableHead>
                    <TableHead className="text-xs text-right">
                      {t("table.qty")}
                    </TableHead>
                    <TableHead className="text-xs">
                      {t("table.reason")}
                    </TableHead>
                    <TableHead className="text-xs text-right">
                      {t("table.cost")}
                    </TableHead>
                    <TableHead className="text-xs">{t("table.slot")}</TableHead>
                    <TableHead className="text-xs">{t("table.by")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const image = row.variant?.basicProduct?.images?.find(
                      (img) => img.productVariantId === row.variant?.id,
                    )?.url;
                    const variantName =
                      row.variant?.name &&
                      !["Default", "ns"].includes(row.variant.name)
                        ? ` (${row.variant.name})`
                        : "";
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {moment(row.createdAt).format("DD MMM, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ImageWithFallback
                              src={image}
                              alt=""
                              width={28}
                              height={28}
                              className="h-7 w-7 rounded border object-contain"
                            />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">
                                {row.variant?.basicProduct?.title}
                                {variantName}
                              </div>
                              {row.note && (
                                <div className="truncate text-xs text-muted-foreground">
                                  {row.note}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {row.qty}
                        </TableCell>
                        <TableCell>
                          <ReasonChip
                            reason={row.reason}
                            type={row.wasteType}
                            label={t(`reasons.${row.reason}`)}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap">
                          {money(row.cost)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.slot?.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.createdBy?.fullname}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
          {rows.length > 0 && (
            <CardFooter>
              <Pagination
                limit={LIMIT}
                offset={offset}
                totalPerPage={rows.length}
                total={data?.result?.total || 0}
                text={t("title")}
              />
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "destructive" | "info";
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              tone === "destructive" && "bg-destructive/10 text-destructive",
              tone === "info" && "bg-info/10 text-info",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="truncate text-lg font-semibold">{value}</div>
          {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function ReasonChip({
  type,
  label,
}: {
  reason: WasteReason;
  type: WasteType;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        type === "WASTE"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-info/30 bg-info/10 text-info",
      )}
    >
      {label}
    </span>
  );
}

function FilterSelect({
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  label: string;
  allLabel: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (value: string | null) => void;
}) {
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(v) => onChange(v === ALL ? null : v)}
    >
      <SelectTrigger
        aria-label={label}
        className={cn(
          "h-8 w-auto min-w-[150px] gap-2 text-xs",
          value && "border-primary/60 bg-primary/5",
        )}
      >
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL} className="text-xs">
          {allLabel}
        </SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
