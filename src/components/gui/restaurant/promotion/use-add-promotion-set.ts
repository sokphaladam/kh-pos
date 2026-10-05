"use client";

import { requestPromotionSetChoices } from "@/app/hooks/use-query-promotion-set";
import { table_restaurant_tables } from "@/generated/tables";
import type { PromotionSetDefinition } from "@/lib/promotion-set";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { usePromotionSetI18n } from "../../promotion-set/use-promotion-set-i18n";
import { useRestaurantActions } from "../hooks/use-restaurant-actions";
import {
  buildPromotionCartLines,
  restaurantPromotionPicker,
} from "./restaurant-promotion-picker";

/**
 * Tap-to-add for a promotion set on the restaurant menu: loads the menu
 * products for each slot, asks the cashier only when a slot has several
 * options, then adds every line to the table's order.
 */
export function useAddPromotionSet() {
  const { t } = usePromotionSetI18n();
  const { selectPromotionSet } = useRestaurantActions();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const addPromotionSet = useCallback(
    async (
      promotion: PromotionSetDefinition,
      table: table_restaurant_tables | undefined,
    ) => {
      if (!table) return toast.error(t("pos.selectTable"));
      if (loadingId) return;

      setLoadingId(promotion.id);
      try {
        const res = await requestPromotionSetChoices(promotion.id);
        if (res?.error === "notActive") {
          return toast.info(t("pos.notStartedNoTime", { title: promotion.title }));
        }
        const slots = res.success ? res.result : undefined;
        if (!slots) return toast.error(t("pos.loadFailed"));
        if (slots.some((s) => s.candidates.length === 0)) {
          return toast.error(t("pos.unavailable", { title: promotion.title }));
        }

        // Every slot has exactly one option: add straight away.
        const lines = slots.every((s) => s.candidates.length === 1)
          ? buildPromotionCartLines(
              slots,
              slots.map((s) => s.candidates[0]),
            )
          : await restaurantPromotionPicker.show({
              title: promotion.title,
              slots,
            });
        if (!lines) return;

        if (await selectPromotionSet(lines, table)) {
          toast.success(t("pos.added", { title: promotion.title }));
        }
      } catch {
        toast.error(t("pos.loadFailed"));
      } finally {
        setLoadingId(null);
      }
    },
    [loadingId, selectPromotionSet, t],
  );

  return { addPromotionSet, loadingId };
}
