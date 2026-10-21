// Standard-vs-actual stock variance, after the BBQ stock-control workbook:
//   standard usage = what sales (and production) should have used (recipe x sold)
//   saving / (loss) = counted - expected, from stock counts in the period
//   actual usage   = standard usage - saving / (loss)
// Status (Meez benchmark): under 2% of standard is well managed, above 5% must
// be investigated, and differences worth less than a small amount are noise.

export type VarianceStatus = "OK" | "CHECK" | "INVESTIGATE" | "NOT_COUNTED";

export const VARIANCE_OK_WITHIN = 0.02;
export const VARIANCE_INVESTIGATE_ABOVE = 0.05;

/** Differences worth less than this (in the branch currency) are marked OK. */
const IGNORE_BELOW_BY_CURRENCY: Record<string, number> = { USD: 2, KHR: 8000 };

export function ignoreVarianceBelow(currencyCode: string | undefined) {
  return IGNORE_BELOW_BY_CURRENCY[currencyCode ?? "USD"] ?? 2;
}

export function varianceStatus({
  counted,
  standardQty,
  savingQty,
  savingAmount,
  ignoreBelow,
}: {
  counted: boolean;
  standardQty: number;
  savingQty: number;
  savingAmount: number;
  ignoreBelow: number;
}): VarianceStatus {
  if (!counted) return "NOT_COUNTED";
  if (savingQty === 0 || Math.abs(savingAmount) < ignoreBelow) return "OK";
  // A difference on an item with no standard usage cannot be judged as a %,
  // so any material one is worth a look.
  if (standardQty <= 0) return "CHECK";
  const pct = Math.abs(savingQty) / standardQty;
  if (pct <= VARIANCE_OK_WITHIN) return "OK";
  if (pct <= VARIANCE_INVESTIGATE_ABOVE) return "CHECK";
  return "INVESTIGATE";
}
