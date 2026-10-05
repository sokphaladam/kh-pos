"use client";

import { Card } from "@/components/ui/card";
import {
  VisiblePromotionSet,
  describePromotionSet,
  visiblePromotionSets,
} from "@/lib/promotion-set";
import { cn } from "@/lib/utils";
import { CARD_BADGE_CLASS } from "@/components/product-card-badges";
import { Clock, Gift, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { useNowMinute } from "../../promotion-set/use-now-minute";
import { usePromotionSetI18n } from "../../promotion-set/use-promotion-set-i18n";
import { PromotionAvailabilityOverlay } from "./promotion-availability-overlay";
import { PromotionImageCollage } from "./promotion-image-collage";
import { useRestaurant } from "../contexts/restaurant-context";
import { useAddPromotionSet } from "./use-add-promotion-set";

/** Category key for the "Promotions" entry in the restaurant category bar. */
export const PROMOTIONS_CATEGORY = "__promotions__";

/**
 * Promotion sets to show on the menu: running ones first, then ones waiting
 * for today's happy hour (visible, not orderable yet). Re-checked each minute.
 */
export function useVisiblePromotionSets(): VisiblePromotionSet[] {
  const { state } = useRestaurant();
  const promotionSets = state.promotionSets;
  const now = useNowMinute();
  return useMemo(
    () => visiblePromotionSets(promotionSets ?? [], now),
    [promotionSets, now],
  );
}

/**
 * Promotion-set cards for the restaurant menu grid. Rendered as grid items
 * (same size as product cards); tapping one adds the whole set to the order.
 */
export function RestaurantPromotionCards({
  allowCreate,
}: {
  allowCreate?: boolean;
}) {
  const { t, currencySymbol, summaryLabels, rewardLabel } =
    usePromotionSetI18n();
  const { state, loading, isRequest } = useRestaurant();
  const params = useSearchParams();
  const promotions = useVisiblePromotionSets();
  const { addPromotionSet, loadingId } = useAddPromotionSet();

  const table = state.activeTables.find(
    (f) => f.tables?.id === params.get("table"),
  )?.tables;
  const disabled = !allowCreate || loading || isRequest || !!loadingId;

  return (
    <>
      {promotions.map((entry) => {
        const { promotion, availability, startsAt } = entry;
        const waiting = availability === "waiting";
        const itemCount = promotion.items.reduce((a, b) => a + b.qty, 0);
        return (
          <Card
            key={promotion.id}
            aria-disabled={waiting || disabled}
            onClick={() => {
              if (disabled) return;
              if (waiting) {
                toast.info(
                  startsAt
                    ? t("pos.notStarted", { title: promotion.title, time: startsAt })
                    : t("pos.notStartedNoTime", { title: promotion.title }),
                );
                return;
              }
              addPromotionSet(promotion, table);
            }}
            className={cn(
              "group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300",
              waiting ? "border-dashed border-muted-foreground/40" : "border-primary/30",
              disabled
                ? "cursor-not-allowed opacity-60"
                : waiting
                  ? "cursor-default"
                  : "cursor-pointer hover:-translate-y-1 hover:shadow-lg active:scale-95",
            )}
          >
            {/* Square picture area, same size as a product card's image. */}
            <div className="relative aspect-[5/5] w-full overflow-hidden rounded-t-xl bg-muted p-1.5 sm:p-2">
              <PromotionImageCollage
                items={promotion.items}
                rewardLabel={rewardLabel}
                className={cn("rounded-lg", waiting && "grayscale")}
              />

              <PromotionAvailabilityOverlay entry={entry} />

              <div className="pointer-events-none absolute left-3.5 top-3.5 sm:left-4 sm:top-4 z-10 flex flex-col items-start gap-1">
                <span
                  className={cn(
                    CARD_BADGE_CLASS,
                    waiting
                      ? "bg-muted-foreground text-background"
                      : "bg-primary text-primary-foreground",
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
                className="line-clamp-1 text-center text-[10px] text-muted-foreground sm:text-xs"
                title={describePromotionSet(
                  promotion.items,
                  currencySymbol,
                  summaryLabels,
                )}
              >
                {describePromotionSet(
                  promotion.items,
                  currencySymbol,
                  summaryLabels,
                )}
              </p>
              {promotion.dailyStartTime && promotion.dailyEndTime && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-xs">
                  <Clock className="size-3" />
                  {promotion.dailyStartTime.slice(0, 5)}–
                  {promotion.dailyEndTime.slice(0, 5)}
                </span>
              )}
            </div>
          </Card>
        );
      })}
    </>
  );
}
