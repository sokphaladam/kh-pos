export interface table_pricing_template {
  template_id: string;
  warehouse_id: string;
  template_name: string;
  time_slot: "matinee" | "evening" | "late_night" | "all_day";
  day_type: "weekday" | "weekend" | "holiday" | "all_days";
  extra_seat_prices: Record<string, number> | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}
