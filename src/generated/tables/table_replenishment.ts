export interface table_replenishment {
  replenish_id?: string;
  from_warehouse: string | null;
  to_warehouse: string | null;
  status?: "draft" | "approved" | "receiving" | "received" | "deleted";
  created_at: string | null;
  created_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  receiving_at: string | null;
  receiving_by: string | null;
  received_at: string | null;
  received_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  auto_id: number;
  updated_at: string | null;
  updated_by: string | null;
}
