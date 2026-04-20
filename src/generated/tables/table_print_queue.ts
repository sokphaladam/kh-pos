/* eslint-disable @typescript-eslint/no-explicit-any */
export interface table_print_queue {
  id?: number;
  created_at: string;
  created_by: string;
  content: any;
  printer_info: any;
  warehouse_id: string;
  order_id: string | null;
  order_detail_id: string | null;
  item_price: string | null;
}
