"use client";

import {
  useCreateStockCount,
  useQueryCountSheet,
} from "@/app/hooks/use-query-stock-count";
import { useQuerySlotList } from "@/app/hooks/use-query-slot";
import type { CountSheetItem } from "@/classes/stock-count";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, LoadingState } from "@/components/ui/state";
import { Switch } from "@/components/ui/switch";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { Formatter } from "@/lib/formatter";
import { isLastDayOfMonth } from "@/lib/stock-count";
import { cn } from "@/lib/utils";
import { useAuthentication } from "contexts/authentication-context";
import { ArrowLeft, CalendarCheck, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export function StockCountSheet(props: WithLayoutPermissionProps) {
  const t = useTranslations("stockCount");
  const router = useRouter();
  const { currentWarehouse } = useAuthentication();
  const today = Formatter.getNowDate();

  const { data: slots } = useQuerySlotList({
    keyword: "",
    warehouseId: currentWarehouse?.id,
    limit: 100,
  });
  const slotList = useMemo(() => slots?.result?.data || [], [slots]);

  const [slotId, setSlotId] = useState<string>();
  const [date, setDate] = useState(today);
  const [dueOnly, setDueOnly] = useState(true);
  const [showExpected, setShowExpected] = useState(false);
  const [search, setSearch] = useState("");
  // Typed values per variant: "" = not counted, "0" = none left.
  const [counts, setCounts] = useState<Record<string, string>>({});
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (slotId || slotList.length === 0) return;
    setSlotId((slotList.find((s) => s.posSlot) || slotList[0]).id);
  }, [slotList, slotId]);

  const { data, isLoading } = useQueryCountSheet(slotId, date, showExpected);
  const { trigger, isMutating } = useCreateStockCount();

  const allItems = useMemo(() => data?.result || [], [data]);
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allItems.filter(
      (item) =>
        (!dueOnly || item.due || counts[item.variantId]) &&
        (!term ||
          `${item.productTitle} ${item.variantName}`
            .toLowerCase()
            .includes(term)),
    );
  }, [allItems, dueOnly, search, counts]);

  const groups = useMemo(() => {
    const map = new Map<string, CountSheetItem[]>();
    for (const item of visible) {
      const key = item.categoryTitle || t("sheet.uncategorized");
      map.set(key, [...(map.get(key) || []), item]);
    }
    return Array.from(map);
  }, [visible, t]);

  const entered = Object.entries(counts).filter(([, v]) => v !== "");
  const dueCount = allItems.filter((i) => i.due).length;

  const save = async () => {
    if (!slotId) return;
    const items = entered.map(([variantId, value]) => ({
      variantId,
      countedQty: Number(value),
    }));
    if (items.length === 0) {
      toast.error(t("sheet.nothing"));
      return;
    }
    const res = await trigger({ slotId, countDate: date, items });
    if (!res?.success) {
      toast.error(res?.error || "Failed");
      return;
    }
    toast.success(t("sheet.saved"));
    router.push(`/admin/stock-counting/${res.result}`);
  };

  let inputIndex = 0;

  return (
    <div className="w-full flex flex-col gap-4 pb-24">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/stock-counting")}
          aria-label={t("detail.back")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">{t("sheet.title")}</h1>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              {t("sheet.slot")}
            </div>
            <Select
              value={slotId}
              onValueChange={(v) => {
                setSlotId(v);
                setCounts({});
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {slotList.map((slot) => (
                  <SelectItem key={slot.id} value={slot.id}>
                    {slot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              {t("sheet.date")}
            </div>
            <Input
              type="date"
              className="h-9"
              value={date}
              max={today}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">&nbsp;</div>
            <div className="flex h-9 rounded-md border bg-muted/40 p-0.5">
              {[true, false].map((due) => (
                <button
                  key={String(due)}
                  type="button"
                  onClick={() => setDueOnly(due)}
                  className={cn(
                    "flex-1 rounded px-3 text-xs font-medium transition-colors",
                    dueOnly === due
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground",
                  )}
                >
                  {due
                    ? `${t("sheet.dueOnly")} (${dueCount})`
                    : `${t("sheet.allItems")} (${allItems.length})`}
                </button>
              ))}
            </div>
          </div>
          <label className="flex cursor-pointer items-end gap-2 pb-2 text-sm">
            <Switch checked={showExpected} onCheckedChange={setShowExpected} />
            {t("sheet.showExpected")}
          </label>
        </CardContent>
      </Card>

      {isLastDayOfMonth(date) && (
        <div className="flex items-center gap-2 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
          <CalendarCheck className="h-4 w-4" />
          {t("sheet.monthEnd")}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="h-9 pl-8"
            placeholder={t("sheet.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {showExpected ? t("sheet.blankHint") : t("sheet.blindHint")}
        </p>
      </div>

      {isLoading || !slotId ? (
        <LoadingState label={t("loading")} />
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              title={t("sheet.noItems")}
              description={t("sheet.noItemsDescription")}
            />
          </CardContent>
        </Card>
      ) : (
        groups.map(([category, items]) => (
          <Card key={category}>
            <div className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {category}
            </div>
            <ul className="divide-y">
              {items.map((item) => {
                const index = inputIndex++;
                const value = counts[item.variantId] ?? "";
                const name =
                  item.variantName &&
                  !["Default", "ns"].includes(item.variantName)
                    ? `${item.productTitle} (${item.variantName})`
                    : item.productTitle;
                return (
                  <li
                    key={item.variantId}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5",
                      value !== "" && "bg-success/5",
                    )}
                  >
                    <ImageWithFallback
                      src={item.image ?? undefined}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded border object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{name}</div>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <Badge
                          variant="outline"
                          className="px-1.5 py-0 text-[10px] font-normal"
                        >
                          {t(`frequency.${item.countFrequency ?? "MONTHLY"}`)}
                        </Badge>
                        <span>
                          {item.lastCountDate
                            ? t("sheet.lastCounted", {
                                date: item.lastCountDate,
                              })
                            : t("sheet.neverCounted")}
                        </span>
                        {item.systemQty !== undefined && (
                          <span className="font-medium text-foreground">
                            {t("sheet.expected", { qty: item.systemQty })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Input
                      ref={(el) => {
                        inputs.current[index] = el;
                      }}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      placeholder={t("sheet.countedPlaceholder")}
                      aria-label={`${t("sheet.countedPlaceholder")}: ${name}`}
                      className="h-10 w-28 text-right text-base"
                      value={value}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v !== "" && (!/^\d+$/.test(v) || Number(v) < 0))
                          return;
                        setCounts((c) => ({ ...c, [item.variantId]: v }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          inputs.current[index + 1]?.focus();
                        }
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          </Card>
        ))
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur md:left-[var(--sidebar-width,16rem)]">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {t("sheet.progress", {
              counted: entered.length,
              total: dueOnly ? dueCount : allItems.length,
            })}
          </span>
          <Button
            onClick={save}
            disabled={!props.allowCreate || isMutating || entered.length === 0}
          >
            {isMutating ? t("sheet.saving") : t("sheet.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
