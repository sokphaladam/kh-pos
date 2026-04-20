export interface table_modifier_items {
  id: string;
  modifier_id: string;
  name: string;
  price?: string;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
}
