"use client";

import type {
  PromotionSetItem,
  PromotionSummaryLabels,
} from "@/lib/promotion-set";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { useAuthentication } from "../../../../contexts/authentication-context";

/** Translations for the promotion-set screens (`discount.promotionSet.*`). */
export function usePromotionSetI18n() {
  const t = useTranslations("discount.promotionSet");
  const { currency } = useAuthentication();
  const currencySymbol = currency || "$";

  const summaryLabels = useMemo<PromotionSummaryLabels>(
    () => ({
      free: t("summary.free"),
      percentOff: (value) => t("summary.percentOff", { value }),
      amountOff: (value) =>
        t("summary.amountOff", { value, currency: currencySymbol }),
    }),
    [t, currencySymbol],
  );

  /** Short reward label for one slot ("free", "-50%"), or null if full price. */
  const rewardLabel = useCallback(
    (item: Pick<PromotionSetItem, "discountType" | "discountValue">) => {
      if (!(item.discountValue > 0)) return null;
      if (item.discountType === "PERCENTAGE") {
        return item.discountValue >= 100
          ? summaryLabels.free
          : summaryLabels.percentOff(item.discountValue);
      }
      return summaryLabels.amountOff(item.discountValue);
    },
    [summaryLabels],
  );

  /** The API returns error keys (see promotionSetInputSchema); translate them. */
  const errorMessage = useCallback(
    (error: string | undefined | null, fallbackKey = "form.saveFailed") => {
      if (error && t.has(`errors.${error}`)) return t(`errors.${error}`);
      return error || t(fallbackKey);
    },
    [t],
  );

  return { t, currencySymbol, summaryLabels, rewardLabel, errorMessage };
}
