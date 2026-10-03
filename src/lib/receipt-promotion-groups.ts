/**
 * Receipt layout for promotion sets: the lines a set used are printed together
 * under one header, in place of the set's first line, so the customer sees
 * which items made up the promotion. Pure, so every template groups the same.
 */

interface LinePromotion {
  promotionId: string;
  title: string;
  units: number | null;
  amount: number;
}

interface GroupableLine {
  orderDetailId: string;
  promotions?: LinePromotion[];
}

export interface ReceiptPromotionGroup {
  promotionId: string;
  title: string;
  /** Money off across the set's lines. */
  saved: number;
  /** orderDetailIds in print order. */
  lineIds: string[];
}

export interface ReceiptPromotionLayout<T> {
  /** Every line, reordered so each promotion's lines sit together. */
  lines: T[];
  /** Header to print right before this line. */
  groupStartingAt: Map<string, ReceiptPromotionGroup>;
  /** Footer to print right after this line. */
  groupEndingAt: Map<string, ReceiptPromotionGroup>;
  /** Lines printed inside a promotion group. */
  inGroup: Set<string>;
}

export function layoutReceiptPromotions<T extends GroupableLine>(
  lines: T[] | null | undefined,
): ReceiptPromotionLayout<T> {
  const list = lines ?? [];
  const groups = new Map<string, ReceiptPromotionGroup>();
  // A line sits in one group only: the set that used most of its units.
  const ownerOf = new Map<string, string>();

  for (const line of list) {
    const promos = line.promotions ?? [];
    for (const p of promos) {
      const g = groups.get(p.promotionId) ?? {
        promotionId: p.promotionId,
        title: p.title,
        saved: 0,
        lineIds: [],
      };
      g.saved = Math.round(g.saved * 100 + Number(p.amount || 0) * 100) / 100;
      groups.set(p.promotionId, g);
    }
    const owner = [...promos].sort(
      (a, b) => (b.units ?? 0) - (a.units ?? 0) || b.amount - a.amount,
    )[0];
    if (owner) ownerOf.set(line.orderDetailId, owner.promotionId);
  }

  const out: T[] = [];
  const placed = new Set<string>();
  const groupStartingAt = new Map<string, ReceiptPromotionGroup>();
  const groupEndingAt = new Map<string, ReceiptPromotionGroup>();

  for (const line of list) {
    if (placed.has(line.orderDetailId)) continue;
    const promotionId = ownerOf.get(line.orderDetailId);
    if (!promotionId) {
      out.push(line);
      placed.add(line.orderDetailId);
      continue;
    }
    // First line of this group: print the whole group here.
    const group = groups.get(promotionId)!;
    const members = list.filter(
      (l) => ownerOf.get(l.orderDetailId) === promotionId,
    );
    group.lineIds = members.map((m) => m.orderDetailId);
    for (const m of members) {
      out.push(m);
      placed.add(m.orderDetailId);
    }
    groupStartingAt.set(members[0].orderDetailId, group);
    groupEndingAt.set(members[members.length - 1].orderDetailId, group);
  }

  return {
    lines: out,
    groupStartingAt,
    groupEndingAt,
    inGroup: new Set(ownerOf.keys()),
  };
}
