export interface table_promotion_set {
  id: string;
  warehouse_id: string | null;
  title: string;
  description: string | null;
  is_active?: number;
  start_at: string | null;
  end_at: string | null;
  daily_start_time: string | null;
  daily_end_time: string | null;
  max_apply_per_order: number | null;
  priority?: number;
  created_at: string | null;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
  deleted_at: string | null;
}
