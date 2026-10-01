import type { VariantBadge } from "@/lib/variant-badges";
import { cn } from "@/lib/utils";
import {
  BadgePercent,
  Flame,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

const BADGE_ICON: Record<VariantBadge["key"], LucideIcon> = {
  popular: Flame,
  new: Sparkles,
  mostOrder: Trophy,
};

/** Shared pill style for every badge on a product / promotion card. */
export const CARD_BADGE_CLASS =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold leading-4 shadow-sm ring-1 ring-white/25 sm:text-xs";

/**
 * Badge stack for the top-left of a product card image: the menu discount
 * ("-10%") first, then admin badges (Popular / New / Best Seller), each with
 * its icon. Inset ~8px inside the photo (which sits in p-1.5 / sm:p-2
 * padding), the same margin as the quantity bubble and price tag, so it
 * clears the card's rounded corner.
 * The parent must be `relative`.
 */
export function ProductCardBadges({
  discountLabel,
  badges,
  className,
}: {
  /** Shown only when set (pass it only for a discounted price). */
  discountLabel?: string | null;
  badges?: VariantBadge[];
  className?: string;
}) {
  if (!discountLabel && !badges?.length) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute left-3.5 top-3.5 sm:left-4 sm:top-4 z-10 flex flex-col items-start gap-1",
        className,
      )}
    >
      {discountLabel && (
        <span
          className={cn(
            CARD_BADGE_CLASS,
            "bg-destructive text-destructive-foreground",
          )}
        >
          <BadgePercent className="size-3 sm:size-3.5" />
          {discountLabel}
        </span>
      )}
      {badges?.map((badge) => {
        const Icon = BADGE_ICON[badge.key];
        return (
          <span key={badge.key} className={cn(CARD_BADGE_CLASS, badge.className)}>
            <Icon className="size-3 sm:size-3.5" />
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}
