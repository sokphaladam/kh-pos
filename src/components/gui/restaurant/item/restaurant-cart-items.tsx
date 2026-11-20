"use client";

import { useCommonDialog } from "@/components/common-dialog";
import { Button } from "@/components/ui/button";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { Gift, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { usePromotionSetI18n } from "../../promotion-set/use-promotion-set-i18n";
import { CartItemGroup, RestaurantaAction } from "../class/restaurant";
import { RestaurantOrderItem, useRestaurant } from "../contexts/restaurant-context";
import { useRestaurantActions } from "../hooks/use-restaurant-actions";
import { RestaurantItem } from "./restaurant-item";

/** Units of a line already sent to the kitchen (not pending). */
function sentQty(item: RestaurantOrderItem) {
  return (item.status ?? [])
    .filter((s) => s.status !== "pending")
    .reduce((acc, s) => acc + Number(s.qty || 0), 0);
}

/**
 * The cart lines of an order, with the lines of each promotion set grouped
 * under the set's title (paid and free lines together).
 */
export function RestaurantCartItems({
  items,
  className = "space-y-2",
  ...props
}: WithLayoutPermissionProps & {
  items: RestaurantOrderItem[];
  className?: string;
}) {
  const { state, loading, isRequest } = useRestaurant();
  const { t } = usePromotionSetI18n();
  const { formatForDisplay } = useCurrencyFormat();
  const { showDialog } = useCommonDialog();
  const { removePromotionSet } = useRestaurantActions();
  const params = useSearchParams();
  const table = state.activeTables.find(
    (f) => f.tables?.id === params.get("table"),
  )?.tables;
  const groups = useMemo(
    () => RestaurantaAction.groupItemsByPromotion(items, state.promotionSets),
    [items, state.promotionSets],
  );

  // Same rule as deleting one line: with the delete permission anything goes,
  // without it only lines not yet sent to the kitchen.
  const canDeleteGroup = (group: CartItemGroup) =>
    !!props.allowDelete || group.items.every(({ item }) => sentQty(item) === 0);

  const deleteGroup = (group: CartItemGroup) => {
    if (!table || !group.promotion) return;
    const title = group.promotion.title;
    const sent = group.items.some(({ item }) => sentQty(item) > 0);
    showDialog({
      title: t("pos.cartDeleteSet"),
      content: [
        t("pos.cartDeleteSetConfirm", { title, count: group.items.length }),
        sent ? t("pos.cartDeleteSetSent") : "",
      ]
        .filter(Boolean)
        .join(" "),
      destructive: true,
      actions: [
        {
          text: t("pos.cartDeleteSet"),
          icon: Trash2,
          onClick: async () => {
            const ok = await removePromotionSet(
              group.items.map(({ item }) => item.orderDetailId),
              table,
            );
            if (ok) toast.success(t("pos.cartDeleted", { title }));
          },
        },
      ],
    });
  };

  return (
    <div className={className}>
      {groups.map((group) =>
        group.promotion ? (
          <div
            key={group.key}
            className="rounded-lg border border-primary/40 bg-primary/5 p-1.5"
          >
            <div className="flex items-center gap-2 px-1.5 pb-1.5 pt-0.5 text-sm">
              <Gift className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate font-semibold text-primary">
                {group.promotion.title}
                {group.promotion.times > 1 && ` ×${group.promotion.times}`}
              </span>
              {group.promotion.saved > 0 && (
                <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                  {t("pos.cartSaved", {
                    amount: formatForDisplay(group.promotion.saved),
                  })}
                </span>
              )}
              <span className="shrink-0 font-semibold">
                {formatForDisplay(group.promotion.total)}
              </span>
              {table && canDeleteGroup(group) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={loading || isRequest}
                  aria-label={t("pos.cartDeleteSet")}
                  title={t("pos.cartDeleteSet")}
                  onClick={() => deleteGroup(group)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
            <div className="space-y-1.5">
              {group.items.map(({ item, index }) => (
                <div key={item.orderDetailId} data-item-index={index}>
                  <RestaurantItem
                    item={item}
                    idx={index}
                    {...props}
                    lockDelete
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          group.items.map(({ item, index }) => (
            <div key={item.orderDetailId} data-item-index={index}>
              <RestaurantItem item={item} idx={index} {...props} />
            </div>
          ))
        ),
      )}
    </div>
  );
}
