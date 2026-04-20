/* eslint-disable @typescript-eslint/no-explicit-any */
export interface table_cinema_hall {
  columns: number;
  created_at: string;
  created_by: string | null;
  deleted_at: string | null;
  hall_features: any | null;
  hall_id: string;
  hall_name: string;
  hall_number: number;
  parts: any | null;
  rows: number;
  status?: "active" | "maintenance" | "inactive";
  total_seats?: number;
  updated_at: string;
  warehouse_id: string;
}
