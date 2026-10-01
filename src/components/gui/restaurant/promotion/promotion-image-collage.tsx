"use client";

import type { PromotionSetItem } from "@/lib/promotion-set";
import { cn } from "@/lib/utils";
import { Gift } from "lucide-react";
import { useState } from "react";

interface CollageTile {
  key: string;
  image: string | null;
  title: string;
  qty: number;
  /** Short reward label ("Free", "-50%") when the slot is discounted. */
  reward: string | null;
}

/**
 * Grid layout per tile count, filling the square:
 * 1 -> full, 2 -> side by side, 3 -> one large + two stacked, 4 -> 2x2.
 */
const LAYOUT: Record<number, { grid: string; tile: (i: number) => string }> = {
  1: { grid: "grid-cols-1 grid-rows-1", tile: () => "" },
  2: { grid: "grid-cols-2 grid-rows-1", tile: () => "" },
  3: {
    grid: "grid-cols-2 grid-rows-2",
    tile: (i) => (i === 0 ? "row-span-2" : ""),
  },
  4: { grid: "grid-cols-2 grid-rows-2", tile: () => "" },
};

const MAX_TILES = 4;

function TileImage({ tile }: { tile: CollageTile }) {
  const [failed, setFailed] = useState(false);
  if (!tile.image || failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-muted p-1 text-muted-foreground">
        <Gift className="size-5 opacity-50" />
        <span className="line-clamp-2 text-center text-[10px] leading-tight">
          {tile.title}
        </span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tile.image}
      alt={tile.title}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full bg-card object-cover"
    />
  );
}

/**
 * Picture of what is inside a promotion set: one tile per slot, with its
 * quantity and reward, laid out to fill a square card.
 */
export function PromotionImageCollage({
  items,
  rewardLabel,
  className,
}: {
  items: PromotionSetItem[];
  rewardLabel: (item: PromotionSetItem) => string | null;
  className?: string;
}) {
  // One tile per slot (not merged by item): "Beer x6" and "Beer x2 Free" read
  // as the promotion, where one "Beer x8 Free" tile would not.
  const tiles: CollageTile[] = items
    .filter((item) => item.qty > 0)
    .map((item) => ({
      key: item.id,
      image: item.matchImage ?? null,
      title: item.matchTitle || "",
      qty: item.qty,
      reward: rewardLabel(item),
    }));

  if (tiles.length === 0) return null;
  const shown = tiles.slice(0, MAX_TILES);
  const hidden = tiles.length - shown.length;
  const layout = LAYOUT[shown.length];

  return (
    <div
      className={cn(
        "grid h-full w-full gap-0.5 overflow-hidden",
        layout.grid,
        className,
      )}
    >
      {shown.map((tile, i) => (
        <div
          key={tile.key}
          className={cn("relative min-h-0 overflow-hidden", layout.tile(i))}
        >
          <TileImage tile={tile} />
          {/* Labels share one bottom row, inset from the tile edges, so the
              top stays clear for the card's "Set" badge. */}
          <div className="pointer-events-none absolute inset-x-1.5 bottom-1.5 flex items-end justify-between gap-1">
            <span className="rounded-full bg-black/60 px-1.5 text-[10px] font-semibold leading-4 text-white backdrop-blur-sm">
              ×{tile.qty}
            </span>
            {tile.reward && (
              <span className="truncate rounded-full bg-destructive px-1.5 text-[10px] font-bold uppercase leading-4 text-destructive-foreground shadow-sm">
                {tile.reward}
              </span>
            )}
          </div>
          {hidden > 0 && i === shown.length - 1 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
              +{hidden}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
