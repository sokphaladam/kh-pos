export interface table_product {
  id?: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  weight: number | null;
  length: number | null;
  height: number | null;
  width: number | null;
  is_composite?: number | null;
  use_production?: number | null;
  track_stock?: number | null;
  is_for_sale?: number | null;
  supplier_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
}
