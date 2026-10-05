"use client";

import { CARD_BADGE_CLASS } from "@/components/product-card-badges";
import type { VisiblePromotionSet } from "@/lib/promotion-set";
import { cn } from "@/lib/utils";
import { Clock, Sparkles } from "lucide-react";
import { usePromotionSetI18n } from "../../promotion-set/use-promotion-set-i18n";

/**
 * Status layer over a promotion card's picture: a "happy hour until 20:00"
 * badge while it runs, or a dimmed "starts at 17:00" banner while waiting.
 */
export function PromotionAvailabilityOverlay({
  entry,
}: {
  entry: VisiblePromotionSet;
}) {
  const { t } = usePromotionSetI18n();
  const { promotion, availability, startsAt } = entry;
  const end = promotion.dailyEndTime?.slice(0, 5);

  if (availability === "waiting") {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center bg-black/35 p-2">
        <span className="flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-semibold text-foreground shadow sm:text-xs">
          <Clock className="size-3 sm:size-3.5" />
          {startsAt
            ? t("pos.startsAt", { time: startsAt })
            : t("pos.notYet")}
        </span>
      </div>
    );
  }

  if (!promotion.dailyStartTime || !end) return null;
  return (
    <div className="pointer-events-none absolute bottom-3.5 left-3.5 z-10 sm:bottom-4 sm:left-4">
      <span
        className={cn(CARD_BADGE_CLASS, "bg-emerald-600 text-white")}
      >
        <Sparkles className="size-3 sm:size-3.5" />
        {t("pos.happyHourUntil", { end })}
      </span>
    </div>
  );
}
