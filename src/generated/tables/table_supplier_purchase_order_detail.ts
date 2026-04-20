export interface table_supplier_purchase_order_detail {
  created_at: string | null;
  id?: string;
  product_variant_id: string;
  purchased_cost: string;
  quantity: number;
  received_qty?: number | null;
  status?: "pending" | "received" | "cancelled";
  supplier_purchase_order_id: string;
  updated_at: string | null;
}
