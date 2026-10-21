export interface table_stock_waste {
  cost_amount: string;
  created_at: string;
  created_by: string | null;
  id: string;
  note: string | null;
  qty: number;
  reason: string;
  slot_id: string;
  variant_id: string;
  warehouse_id: string;
  waste_type: "WASTE" | "NON_SALE";
}
