export interface VariantBadgeFlags {
  isPopular?: boolean | null;
  isNew?: boolean | null;
  isMostOrder?: boolean | null;
}

export interface VariantBadge {
  key: "popular" | "new" | "mostOrder";
  label: string;
  className: string;
}

/**
 * Admin-set menu badges (popular / new / most-order) shown on the public menu
 * and POS restaurant screen. A variant can carry more than one at once.
 * Colours are theme tokens (globals.css), so they follow light / dark mode.
 */
export function getVariantBadges(flags: VariantBadgeFlags): VariantBadge[] {
  const badges: VariantBadge[] = [];

  if (flags.isPopular) {
    badges.push({
      key: "popular",
      label: "Popular",
      className: "bg-warning text-warning-foreground",
    });
  }
  if (flags.isNew) {
    badges.push({
      key: "new",
      label: "New",
      className: "bg-success text-success-foreground",
    });
  }
  if (flags.isMostOrder) {
    badges.push({
      key: "mostOrder",
      label: "Best Seller",
      className: "bg-info text-info-foreground",
    });
  }

  return badges;
}
