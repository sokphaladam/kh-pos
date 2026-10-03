"use client";

import {
  requestPromotionSetChoices,
  useQueryMenuPromotionSets,
} from "@/app/hooks/use-query-promotion-set";
import { CARD_BADGE_CLASS } from "@/components/product-card-badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { table_restaurant_tables } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import {
  describePromotionSet,
  isPromotionSetActive,
  PromotionSetDefinition,
} from "@/lib/promotion-set";
import { cn } from "@/lib/utils";
import { Clock, Gift, Loader2 } from "lucide-react";
import moment from "moment-timezone";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { usePromotionSetI18n } from "../../promotion-set/use-promotion-set-i18n";
import { PromotionImageCollage } from "../../restaurant/promotion/promotion-image-collage";
import {
  buildPromotionCartLines,
  restaurantPromotionPicker,
} from "../../restaurant/promotion/restaurant-promotion-picker";
import { useCartActions } from "./context/use-cart-action";

/** Category key for the "Promotions" chip on the customer menu. */
export const MENU_PROMOTIONS_CATEGORY = "__promotions__";

/** Promotion sets running now at the branch (re-checked every minute). */
export function useMenuPromotionSets(warehouseId: string) {
  const { data, isLoading } = useQueryMenuPromotionSets(warehouseId);
  const promotions = useMemo(() => {
    // The server already filters; re-check so a set that just ended (happy
    // hour) disappears before the next refresh.
    const now = Formatter.getNowDateTime();
    return (data?.result ?? []).filter((p) => isPromotionSetActive(p, now));
  }, [data]);
  return { promotions, isLoading };
}

/**
 * Table ordering: load the menu products for each slot, ask the customer only
 * when a slot has several options, then add the whole set to the order.
 */
export function useMenuAddPromotionSet() {
  const { t } = usePromotionSetI18n();
  const { addPromotionSet } = useCartActions();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const add = useCallback(
    async (
      promotion: PromotionSetDefinition,
      table: table_restaurant_tables | undefined,
    ) => {
      if (!table) return toast.error(t("pos.selectTable"));
      if (loadingId) return;

      setLoadingId(promotion.id);
      try {
        const res = await requestPromotionSetChoices(promotion.id);
        const slots = res?.success ? res.result : undefined;
        if (!slots) return toast.error(t("pos.loadFailed"));
        if (slots.some((s) => s.candidates.length === 0)) {
          return toast.error(t("pos.unavailable", { title: promotion.title }));
        }

        const lines = slots.every((s) => s.candidates.length === 1)
          ? buildPromotionCartLines(
              slots,
              slots.map((s) => s.candidates[0]),
            )
          : await restaurantPromotionPicker.show({
              title: promotion.title,
              slots,
              hint: t("menu.pickerHint"),
              submitLabel: t("menu.addToOrder"),
            });
        if (!lines) return;

        if (await addPromotionSet(lines, table)) {
          toast.success(t("pos.added", { title: promotion.title }));
        }
      } catch {
        toast.error(t("pos.loadFailed"));
      } finally {
        setLoadingId(null);
      }
    },
    [loadingId, addPromotionSet, t],
  );

  return { addPromotionSet: add, loadingId };
}

/** What a set contains, its hours, and how to get it. */
function PromotionDetailsDialog({
  promotion,
  open,
  onOpenChange,
  onAdd,
}: {
  promotion: PromotionSetDefinition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: () => void;
}) {
  const { t, currencySymbol, summaryLabels, rewardLabel } =
    usePromotionSetI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="size-5 text-primary" />
            {promotion.title}
          </DialogTitle>
          <DialogDescription>
            {promotion.description ||
              describePromotionSet(
                promotion.items,
                currencySymbol,
                summaryLabels,
              )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("menu.detailsTitle")}
          </p>
          <ul className="divide-y rounded-lg border">
            {promotion.items
              .filter((i) => i.qty > 0)
              .map((item) => {
                const reward = rewardLabel(item);
                return (
                  <li key={item.id} className="flex items-center gap-3 p-2.5">
                    {item.matchImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.matchImage}
                        alt=""
                        className="size-11 rounded-md bg-muted object-cover"
                      />
                    ) : (
                      <div className="flex size-11 items-center justify-center rounded-md bg-muted">
                        <Gift className="size-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-sm">
                      <span className="font-semibold">{item.qty} ×</span>{" "}
                      {item.matchTitle}
                    </div>
                    {reward && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {reward}
                      </span>
                    )}
                  </li>
                );
              })}
          </ul>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {promotion.dailyStartTime && promotion.dailyEndTime && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {t("menu.availableHours", {
                start: promotion.dailyStartTime,
                end: promotion.dailyEndTime,
              })}
            </span>
          )}
          {promotion.endAt && (
            <span>
              {t("menu.until", {
                date: moment(promotion.endAt).format("DD MMM YYYY"),
              })}
            </span>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {onAdd ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("menu.close")}
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onAdd();
                }}
              >
                {t("menu.addToOrder")}
              </Button>
            </>
          ) : (
            <p className="w-full text-center text-xs text-muted-foreground">
              {t("menu.browseHint")}
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Promotion-set cards for the customer menu grid (same size as product
 * cards). With `onAdd` (table ordering) a tap opens the details with an
 * "Add to order" button; without it (browse-only menu) the details only.
 */
export function MenuPromotionCards({
  promotions,
  onAdd,
  loadingId,
  disabled,
}: {
  promotions: PromotionSetDefinition[];
  onAdd?: (promotion: PromotionSetDefinition) => void;
  loadingId?: string | null;
  disabled?: boolean;
}) {
  const { t, currencySymbol, summaryLabels, rewardLabel } =
    usePromotionSetI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = promotions.find((p) => p.id === openId);

  return (
    <>
      {promotions.map((promotion) => {
        const itemCount = promotion.items.reduce((a, b) => a + b.qty, 0);
        const summary = describePromotionSet(
          promotion.items,
          currencySymbol,
          summaryLabels,
        );
        return (
          <Card
            key={promotion.id}
            role="button"
            tabIndex={0}
            aria-label={promotion.title}
            onClick={() => !disabled && setOpenId(promotion.id)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !disabled) {
                e.preventDefault();
                setOpenId(promotion.id);
              }
            }}
            className={cn(
              "group relative flex h-full flex-col overflow-hidden rounded-xl border border-primary/40 bg-card shadow-sm transition-all duration-300",
              disabled
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:-translate-y-1 hover:shadow-lg active:scale-95",
            )}
          >
            <div className="relative aspect-[5/5] w-full overflow-hidden rounded-t-xl bg-muted p-1.5 sm:p-2">
              <PromotionImageCollage
                items={promotion.items}
                rewardLabel={rewardLabel}
                className="rounded-lg"
              />
              <div className="pointer-events-none absolute left-3.5 top-3.5 z-10 sm:left-4 sm:top-4">
                <span
                  className={cn(
                    CARD_BADGE_CLASS,
                    "bg-primary text-primary-foreground",
                  )}
                >
                  <Gift className="size-3 sm:size-3.5" />
                  {t("pos.badge")} · {t("pos.items", { count: itemCount })}
                </span>
              </div>
              {loadingId === promotion.id && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/60 backdrop-blur-[1px]">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-0.5 p-1.5 sm:p-2">
              <h3 className="line-clamp-2 text-center text-xs font-medium leading-tight text-foreground sm:text-sm">
                {promotion.title}
              </h3>
              <p
                className="line-clamp-2 text-center text-[10px] text-muted-foreground sm:text-xs"
                title={summary}
              >
                {summary}
              </p>
              {promotion.dailyStartTime && promotion.dailyEndTime && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-xs">
                  <Clock className="size-3" />
                  {promotion.dailyStartTime}–{promotion.dailyEndTime}
                </span>
              )}
            </div>
          </Card>
        );
      })}
      {/* Outside the cards: clicks in a portal still bubble to the parent. */}
      {open && (
        <PromotionDetailsDialog
          promotion={open}
          open
          onOpenChange={(o) => !o && setOpenId(null)}
          onAdd={onAdd ? () => onAdd(open) : undefined}
        />
      )}
    </>
  );
}
