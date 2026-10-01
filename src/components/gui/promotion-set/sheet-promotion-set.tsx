"use client";

import type { ProductSearchResult } from "@/app/api/product/search-product/types";
import {
  useCreatePromotionSet,
  useUpdatePromotionSet,
} from "@/app/hooks/use-query-promotion-set";
import type {
  PromotionSetInput,
  PromotionSetResponse,
} from "@/classes/promotion-set";
import { createSheet } from "@/components/create-sheet";
import LabelInput from "@/components/label-input";
import SearchProductPicker from "@/components/search-product-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MaterialInput } from "@/components/ui/material-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  PromotionMatchType,
  PromotionSetItem,
  describePromotionSet,
} from "@/lib/promotion-set";
import type { Category } from "@/lib/server-functions/category/create-category";
import { produce } from "immer";
import { DatePickerWithRange } from "@/components/date-picker-with-range";
import { format } from "date-fns";
import { Copy, Gift, Tag, Trash2, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { v4 } from "uuid";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { DiscountSearchCategory } from "../discount/discount-search-category";
import { usePromotionSetI18n } from "./use-promotion-set-i18n";

/** How a slot is priced, as presented to the user. */
type PriceMode = "FULL" | "FREE" | "PERCENTAGE" | "AMOUNT";

function priceModeOf(item: PromotionSetItem): PriceMode {
  if (!(item.discountValue > 0)) return "FULL";
  if (item.discountType === "PERCENTAGE" && item.discountValue >= 100) {
    return "FREE";
  }
  return item.discountType;
}

const MATCH_LABEL_KEY: Record<PromotionMatchType, string> = {
  VARIANT: "form.matchVariant",
  PRODUCT: "form.matchProduct",
  CATEGORY: "form.matchCategory",
};

/** "2026-10-02 18:00:00" -> local Date of that calendar day (no tz shift). */
const toLocalDate = (v?: string | null) => {
  if (!v) return undefined;
  const [y, m, d] = v.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

const toDateRange = (
  startAt?: string | null,
  endAt?: string | null,
): DateRange | undefined =>
  startAt || endAt
    ? { from: toLocalDate(startAt ?? endAt), to: toLocalDate(endAt) }
    : undefined;

interface EditorItem extends PromotionSetItem {
  /** Set for slots picked in this session, so a variant slot can be widened
   * to "any variant of the product" and back. */
  productId?: string;
  productTitle?: string;
  variantId?: string;
  variantTitle?: string;
}

export const sheetPromotionSet = createSheet<
  { edit?: PromotionSetResponse },
  boolean
>(
  ({ close, edit }) => {
    const { user } = useAuthentication();
    const { t, currencySymbol, summaryLabels, errorMessage } =
      usePromotionSetI18n();
    const [form, setForm] = useState<
      Omit<PromotionSetInput, "items"> & { items: EditorItem[] }
    >(() => ({
      id: edit?.id ?? v4(),
      title: edit?.title ?? "",
      description: edit?.description ?? "",
      warehouseId:
        edit === undefined
          ? user?.currentWarehouseId || null
          : (edit.warehouseId ?? null),
      isActive: edit?.isActive ?? true,
      startAt: edit?.startAt ?? null,
      endAt: edit?.endAt ?? null,
      dailyStartTime: edit?.dailyStartTime ?? null,
      dailyEndTime: edit?.dailyEndTime ?? null,
      maxApplyPerOrder: edit?.maxApplyPerOrder ?? null,
      priority: edit?.priority ?? 0,
      items: (edit?.items ?? []).map((i) => ({ ...i })),
    }));

    const { trigger: create, isMutating: creating } = useCreatePromotionSet();
    const { trigger: update, isMutating: updating } = useUpdatePromotionSet();

    const summary = useMemo(
      () => describePromotionSet(form.items, currencySymbol, summaryLabels),
      [form.items, currencySymbol, summaryLabels],
    );
    const hasReward = form.items.some((i) => i.discountValue > 0);
    const allFree =
      form.items.length > 0 &&
      form.items.every(
        (i) => i.discountType === "PERCENTAGE" && i.discountValue >= 100,
      );

    const addItem = useCallback((item: EditorItem) => {
      setForm(
        produce((draft) => {
          draft.items.push(item);
        }),
      );
    }, []);

    const onPickProduct = useCallback(
      (p: ProductSearchResult) => {
        if (!p?.variantId) return;
        const productTitle = p.productTitle.replace(/\s*\([^)]*\)$/, "");
        addItem({
          id: v4(),
          matchType: "VARIANT",
          matchId: p.variantId,
          matchTitle: p.productTitle,
          productId: p.productId,
          productTitle,
          variantId: p.variantId,
          variantTitle: p.productTitle,
          qty: 1,
          discountType: "PERCENTAGE",
          discountValue: 0,
        });
      },
      [addItem],
    );

    const onPickCategory = useCallback(
      (c: Category) => {
        if (!c?.id) return;
        addItem({
          id: v4(),
          matchType: "CATEGORY",
          matchId: c.id,
          matchTitle: c.title,
          qty: 1,
          discountType: "PERCENTAGE",
          discountValue: 100,
        });
      },
      [addItem],
    );

    const patchItem = useCallback(
      (index: number, fn: (item: EditorItem) => void) => {
        setForm(
          produce((draft) => {
            fn(draft.items[index]);
          }),
        );
      },
      [],
    );

    const onSave = useCallback(async () => {
      if (!form.title.trim()) return toast.error(t("errors.titleRequired"));
      if (form.items.length === 0) {
        return toast.error(t("errors.itemsRequired"));
      }
      if (!hasReward) {
        return toast.error(t("errors.rewardRequired"));
      }

      const payload: PromotionSetInput = {
        ...form,
        items: form.items.map((i) => ({
          id: i.id,
          matchType: i.matchType,
          matchId: i.matchId,
          qty: i.qty,
          discountType: i.discountType,
          discountValue: i.discountValue,
        })),
      };
      try {
        const res = await (edit ? update : create)(payload);
        if (res.success) {
          toast.success(t(edit ? "form.updated" : "form.created"));
          close(true);
        } else {
          toast.error(errorMessage(res.error));
        }
      } catch {
        toast.error(t("form.saveFailed"));
      }
    }, [form, hasReward, edit, update, create, close, t, errorMessage]);

    return (
      <>
        <SheetHeader>
          <SheetTitle>
            {t(edit ? "form.editTitle" : "form.createTitle")}
          </SheetTitle>
          <SheetDescription>{t("form.description")}</SheetDescription>
        </SheetHeader>

        <div className="my-4 flex flex-col gap-6">
          <MaterialInput
            label={t("form.name")}
            placeholder={t("form.namePlaceholder")}
            required
            value={form.title}
            onChange={(e) =>
              setForm(
                produce((d) => {
                  d.title = e.target.value;
                }),
              )
            }
          />

          {/* Set contents */}
          <section className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold">
                  {t("form.itemsTitle")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("form.itemsHint")}
                </p>
              </div>
            </div>

            {/* items-end: the item picker has a Title/Barcode toggle above its
                input, so bottom-align both pickers to keep the inputs level. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 md:items-end">
              <SearchProductPicker
                clearInput
                label={t("form.searchItem")}
                onChange={onPickProduct}
              />
              <DiscountSearchCategory
                clearInput
                label={t("form.searchCategory")}
                onChange={onPickCategory}
              />
            </div>

            {form.items.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t("form.noItems")}
              </div>
            ) : (
              <div className="rounded-md border divide-y">
                {form.items.map((item, index) => {
                  const mode = priceModeOf(item);
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col md:flex-row md:items-center gap-3 p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {mode === "FULL" ? (
                            <Tag className="size-4 text-muted-foreground shrink-0" />
                          ) : (
                            <Gift className="size-4 text-primary shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">
                            {item.matchTitle || item.matchId}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {t(MATCH_LABEL_KEY[item.matchType])}
                          </Badge>
                        </div>
                        {item.productId && item.variantId && (
                          <label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Switch
                              checked={item.matchType === "PRODUCT"}
                              onCheckedChange={(any) =>
                                patchItem(index, (d) => {
                                  if (any) {
                                    d.matchType = "PRODUCT";
                                    d.matchId = d.productId!;
                                    d.matchTitle = d.productTitle;
                                  } else {
                                    d.matchType = "VARIANT";
                                    d.matchId = d.variantId!;
                                    d.matchTitle = d.variantTitle;
                                  }
                                })
                              }
                            />
                            {t("form.anyVariant")}
                          </label>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-20">
                          <MaterialInput
                            label={t("form.qty")}
                            type="number"
                            min={1}
                            step={1}
                            value={item.qty}
                            onChange={(e) =>
                              patchItem(index, (d) => {
                                d.qty = Math.max(
                                  1,
                                  Math.floor(Number(e.target.value) || 1),
                                );
                              })
                            }
                          />
                        </div>
                        <div className="w-36">
                          <Select
                            value={mode}
                            onValueChange={(v) =>
                              patchItem(index, (d) => {
                                const next = v as PriceMode;
                                if (next === "FULL") {
                                  d.discountType = "PERCENTAGE";
                                  d.discountValue = 0;
                                } else if (next === "FREE") {
                                  d.discountType = "PERCENTAGE";
                                  d.discountValue = 100;
                                } else {
                                  d.discountType = next;
                                  d.discountValue =
                                    next === "PERCENTAGE" ? 50 : 1;
                                }
                              })
                            }
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FULL">
                                {t("form.priceFull")}
                              </SelectItem>
                              <SelectItem value="FREE">
                                {t("form.priceFree")}
                              </SelectItem>
                              <SelectItem value="PERCENTAGE">
                                {t("form.pricePercent")}
                              </SelectItem>
                              <SelectItem value="AMOUNT">
                                {t("form.priceAmount", {
                                  currency: currencySymbol,
                                })}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {(mode === "PERCENTAGE" || mode === "AMOUNT") && (
                          <div className="w-20">
                            <MaterialInput
                              label={mode === "PERCENTAGE" ? "%" : currencySymbol}
                              type="number"
                              min={0}
                              max={mode === "PERCENTAGE" ? 100 : undefined}
                              step={mode === "PERCENTAGE" ? 1 : 0.01}
                              value={item.discountValue}
                              onChange={(e) =>
                                patchItem(index, (d) => {
                                  d.discountValue = Math.max(
                                    0,
                                    Number(e.target.value) || 0,
                                  );
                                })
                              }
                            />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title={t("form.duplicate")}
                          onClick={() =>
                            addItem({
                              ...item,
                              id: v4(),
                              discountType: "PERCENTAGE",
                              discountValue: mode === "FULL" ? 100 : 0,
                            })
                          }
                        >
                          <Copy className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title={t("form.remove")}
                          onClick={() =>
                            setForm(
                              produce((d) => {
                                d.items.splice(index, 1);
                              }),
                            )
                          }
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {form.items.length > 0 && (
              <div
                className={
                  hasReward
                    ? "rounded-md bg-muted/60 px-3 py-2 text-xs"
                    : "rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
                }
              >
                {hasReward ? (
                  <>
                    <span className="font-medium">{t("form.setLabel")} </span>
                    {summary}
                  </>
                ) : (
                  t("form.needReward")
                )}
              </div>
            )}
            {/* Almost always a mistake (e.g. the "buy 6" row left on Free). */}
            {allFree && (
              <div className="rounded-md bg-warning/15 px-3 py-2 text-xs text-warning">
                {t("form.allFreeWarning")}
              </div>
            )}
          </section>

          {/* Rules */}
          <section className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold">{t("form.rules")}</h3>
            <label className="flex items-center justify-between gap-4 rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">{t("form.active")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("form.activeHint")}
                </div>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) =>
                  setForm(
                    produce((d) => {
                      d.isActive = v;
                    }),
                  )
                }
              />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">
                  {t("form.allBranches")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("form.allBranchesHint")}
                </div>
              </div>
              <Switch
                checked={!form.warehouseId}
                onCheckedChange={(all) =>
                  setForm(
                    produce((d) => {
                      d.warehouseId = all
                        ? null
                        : user?.currentWarehouseId || null;
                    }),
                  )
                }
              />
            </label>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t("form.period")}</span>
              <div className="flex flex-wrap items-center gap-2">
                <DatePickerWithRange
                  date={toDateRange(form.startAt, form.endAt)}
                  setDate={(range) =>
                    setForm(
                      produce((d) => {
                        d.startAt = range?.from
                          ? `${format(range.from, "yyyy-MM-dd")} 00:00:00`
                          : null;
                        d.endAt = range?.to
                          ? `${format(range.to, "yyyy-MM-dd")} 23:59:59`
                          : null;
                      }),
                    )
                  }
                />
                {(form.startAt || form.endAt) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setForm(
                        produce((d) => {
                          d.startAt = null;
                          d.endAt = null;
                        }),
                      )
                    }
                  >
                    <X className="size-4" />
                    {t("form.clear")}
                  </Button>
                )}
              </div>
              <small className="text-muted-foreground">
                {form.startAt && !form.endAt
                  ? t("form.periodOpenEnd")
                  : t("form.periodHint")}
              </small>
            </div>
            <div className="flex flex-col gap-3 rounded-md border p-3">
              <label className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">
                    {t("form.happyHour")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("form.happyHourHint")}
                  </div>
                </div>
                <Switch
                  checked={!!form.dailyStartTime}
                  onCheckedChange={(on) =>
                    setForm(
                      produce((d) => {
                        d.dailyStartTime = on ? "17:00" : null;
                        d.dailyEndTime = on ? "20:00" : null;
                      }),
                    )
                  }
                />
              </label>
              {form.dailyStartTime && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <MaterialInput
                      label={t("form.from")}
                      type="time"
                      value={form.dailyStartTime ?? ""}
                      onChange={(e) =>
                        setForm(
                          produce((d) => {
                            d.dailyStartTime = e.target.value || null;
                          }),
                        )
                      }
                    />
                    <MaterialInput
                      label={t("form.until")}
                      type="time"
                      value={form.dailyEndTime ?? ""}
                      onChange={(e) =>
                        setForm(
                          produce((d) => {
                            d.dailyEndTime = e.target.value || null;
                          }),
                        )
                      }
                    />
                  </div>
                  <small className="text-muted-foreground">
                    {form.dailyEndTime &&
                    form.dailyEndTime < form.dailyStartTime
                      ? `${t("form.crossesMidnight", {
                          start: form.dailyStartTime,
                          end: form.dailyEndTime,
                        })} `
                      : ""}
                    {t("form.happyHourRule")}
                  </small>
                </>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <MaterialInput
                  label={t("form.maxPerOrder")}
                  type="number"
                  min={0}
                  step={1}
                  placeholder={t("form.unlimited")}
                  value={form.maxApplyPerOrder ?? ""}
                  onChange={(e) =>
                    setForm(
                      produce((d) => {
                        const n = Math.floor(Number(e.target.value));
                        d.maxApplyPerOrder = n > 0 ? n : null;
                      }),
                    )
                  }
                />
                <small className="text-muted-foreground">
                  {t("form.maxPerOrderHint")}
                </small>
              </div>
              <div>
                <MaterialInput
                  label={t("form.priority")}
                  type="number"
                  step={1}
                  value={String(form.priority)}
                  onChange={(e) =>
                    setForm(
                      produce((d) => {
                        d.priority = Math.floor(Number(e.target.value) || 0);
                      }),
                    )
                  }
                />
                <small className="text-muted-foreground">
                  {t("form.priorityHint")}
                </small>
              </div>
            </div>
            <LabelInput
              multiple
              label={t("form.notes")}
              placeholder={t("form.notesPlaceholder")}
              className="h-[80px]"
              value={form.description ?? ""}
              onChange={(e) =>
                setForm(
                  produce((d) => {
                    d.description = e.target.value;
                  }),
                )
              }
            />
          </section>
        </div>

        <SheetFooter>
          <Button onClick={onSave} disabled={creating || updating}>
            {t(edit ? "form.saveChanges" : "form.create")}
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: false },
);
