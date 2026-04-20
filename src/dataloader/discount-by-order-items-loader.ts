import { table_discount_log } from "@/generated/tables";
import DataLoader from "dataloader";
import { Knex } from "knex";

export interface CustomerOrderDiscount {
  id: string;
  discountId: string;
  orderDetailId: string;
  amount: number;
  name: string;
  discountType?: "PERCENTAGE" | "AMOUNT";
  value?: number;
  createdAt?: string;
  isManualDiscount?: boolean;
}

export function createDiscountByOrderItemLoader(
  db: Knex
): DataLoader<string, CustomerOrderDiscount[]> {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_discount_log[] = await db
      .table("discount_log")
      .select("discount_log.*")
      .whereIn("order_detail_id", keys);

    const discountMap: Record<string, CustomerOrderDiscount[]> = {};
    rows.forEach((row) => {
      if (!discountMap[row.order_detail_id!]) {
        discountMap[row.order_detail_id!] = [];
      }
      discountMap[row.order_detail_id!].push({
        id: row.id,
        discountId: row.discount_id!,
        orderDetailId: row.order_detail_id!,
        amount: Number(row.discount_amount || 0),
        name: row.discount_title || "",
        discountType: row.discount_type || undefined,
        value: Number(row.value || 0),
        createdAt: row.created_at || undefined,
        isManualDiscount: row.is_manual_discount === 1,
      });
    });

    return keys.map((key) => discountMap[key] || []);
  });
}
