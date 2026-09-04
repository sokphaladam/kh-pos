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
 */
export function getVariantBadges(flags: VariantBadgeFlags): VariantBadge[] {
  const badges: VariantBadge[] = [];

  if (flags.isPopular) {
    badges.push({
      key: "popular",
      label: "Popular",
      className: "bg-amber-500 text-white",
    });
  }
  if (flags.isNew) {
    badges.push({
      key: "new",
      label: "New",
      className: "bg-emerald-500 text-white",
    });
  }
  if (flags.isMostOrder) {
    badges.push({
      key: "mostOrder",
      label: "Best Seller",
      className: "bg-purple-500 text-white",
    });
  }

  return badges;
}
