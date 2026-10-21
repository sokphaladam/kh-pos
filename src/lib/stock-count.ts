// Count schedule from the BBQ stock-control workbook: proteins, seafood and
// bar daily, perishables weekly, dry goods monthly, and everything on the last
// day of the month. Dates are "YYYY-MM-DD" in the branch's day.

export const COUNT_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY"] as const;
export type CountFrequency = (typeof COUNT_FREQUENCIES)[number];

/** Unset frequency counts monthly, so every tracked item is counted at least monthly. */
export const DEFAULT_COUNT_FREQUENCY: CountFrequency = "MONTHLY";

function dayNumber(date: string) {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

export function isLastDayOfMonth(date: string) {
  const next = new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000);
  return next.getUTCDate() === 1;
}

export function isCountDue(
  frequency: CountFrequency | null | undefined,
  lastCountDate: string | null | undefined,
  countDate: string,
): boolean {
  // Already counted on (or after) that day.
  if (lastCountDate && lastCountDate >= countDate) return false;
  if (isLastDayOfMonth(countDate)) return true;
  const freq = frequency ?? DEFAULT_COUNT_FREQUENCY;
  if (freq === "DAILY" || !lastCountDate) return true;
  if (freq === "WEEKLY") {
    return dayNumber(countDate) - dayNumber(lastCountDate) >= 7;
  }
  return lastCountDate.slice(0, 7) !== countDate.slice(0, 7);
}
