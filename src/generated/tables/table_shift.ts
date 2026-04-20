export interface table_shift {
  actual_cash_khr: string | null;
  actual_cash_usd: string | null;
  closed_at: string | null;
  closed_by: string | null;
  closed_cash_khr: string | null;
  closed_cash_usd: string | null;
  exchange_rate: string | null;
  opened_at: string | null;
  opened_by: string | null;
  opened_cash_khr: string | null;
  opened_cash_usd: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  receipt: any | null;
  shift_id: string;
  status?: "OPEN" | "CLOSE";
  updated_at: string | null;
}
