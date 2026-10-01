"use client";

import { Card } from "@/components/ui/card";
import { Formatter } from "@/lib/formatter";
import {
  PromotionSetDefinition,
  describePromotionSet,
  isPromotionSetActive,
} from "@/lib/promotion-set";
import { cn } from "@/lib/utils";
import { CARD_BADGE_CLASS } from "@/components/product-card-badges";
import { Clock, Gift, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { usePromotionSetI18n } from "../../promotion-set/use-promotion-set-i18n";
import { PromotionImageCollage } from "./promotion-image-collage";
import { useRestaurant } from "../contexts/restaurant-context";
import { useAddPromotionSet } from "./use-add-promotion-set";

/** Category key for the "Promotions" entry in the restaurant category bar. */
export const PROMOTIONS_CATEGORY = "__promotions__";

/** Promotion sets that can be sold right now (enabled, in date range and hours). */
export function useRunningPromotionSets(): PromotionSetDefinition[] {
  const { state } = useRestaurant();
  const promotionSets = state.promotionSets;
  return useMemo(() => {
    const now = Formatter.getNowDateTime();
    return (promotionSets ?? []).filter((p) => isPromotionSetActive(p, now));
    // Re-evaluated whenever the restaurant state re-syncs (table polling).
  }, [promotionSets]);
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
  const promotions = useRunningPromotionSets();
  const { addPromotionSet, loadingId } = useAddPromotionSet();

  const table = state.activeTables.find(
    (f) => f.tables?.id === params.get("table"),
  )?.tables;
  const disabled = !allowCreate || loading || isRequest || !!loadingId;

  return (
    <>
      {promotions.map((promotion) => {
        const itemCount = promotion.items.reduce((a, b) => a + b.qty, 0);
        return (
          <Card
            key={promotion.id}
            onClick={() => !disabled && addPromotionSet(promotion, table)}
            className={cn(
              "group relative flex h-full flex-col overflow-hidden rounded-xl border border-primary/30 bg-card shadow-sm transition-all duration-300",
              disabled
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:-translate-y-1 hover:shadow-lg active:scale-95",
            )}
          >
            {/* Square picture area, same size as a product card's image. */}
            <div className="relative aspect-[5/5] w-full overflow-hidden rounded-t-xl bg-muted p-1.5 sm:p-2">
              <PromotionImageCollage
                items={promotion.items}
                rewardLabel={rewardLabel}
                className="rounded-lg"
              />

              <div className="pointer-events-none absolute left-3.5 top-3.5 sm:left-4 sm:top-4 z-10 flex flex-col items-start gap-1">
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
                  {promotion.dailyStartTime}–{promotion.dailyEndTime}
                </span>
              )}
            </div>
          </Card>
        );
      })}
    </>
  );
}
