import {
  table_customer_order_detail,
  table_fulfilment,
  table_fulfilment_detail,
} from "@/generated/tables";
import { Knex } from "knex";
import { SlotMovementService } from "./slot-movement";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { generateId } from "@/lib/generate-id";
import { Formatter } from "@/lib/formatter";

interface FulfillOption {
  items: {
    orderItemId: string;
    qty: number;
    slotId: string;
  }[];
  createdBy: UserInfo;
}

export class FullfillService {
  constructor(protected tx: Knex) {}

  fullfill({ items, createdBy }: FulfillOption) {
    return this.tx.transaction(async (tx) => {
      const orderItems = await tx
        .table("customer_order_detail")
        .whereIn(
          "order_detail_id",
          items.map((item) => {
            return item.orderItemId;
          })
        )
        .select<table_customer_order_detail[]>();

      // Ensure that no invalid order item id provided
      const orderItemMap = items.map((item) => {
        const found = orderItems.find(
          (orderItem) => orderItem.order_detail_id === item.orderItemId
        );

        if (!found) {
          throw new Error("Order item not found");
        }

        return { item, orderItem: found };
      });

      if (orderItems.length === 0) {
        throw new Error("Order item not found");
      }

      const orderId = orderItems[0].order_id!;

      // Ensure that fulfilled qty does not excess the order qty
      for (const { item, orderItem } of orderItemMap) {
        const remainingQty =
          (orderItem.qty ?? 0) - (orderItem.fulfilled_qty ?? 0);
        if (item.qty > remainingQty) {
          throw new Error("Fulfill quantity excess the order qty");
        }
      }

      const transactionIdsMap: {
        transactionIds: string[];
        orderItemId: string;
      }[] = [];

      const movementService = new SlotMovementService(tx);
      for (const { item, orderItem } of orderItemMap) {
        if (orderItem.variant_id === null) {
          throw new Error("Order item variant id is null");
        }

        const stockTrxIds = await movementService.stockout({
          slotId: item.slotId,
          variantId: orderItem.variant_id!,
          qty: item.qty,
          createdBy,
          transactionType: "SALE",
          fallbackBacklogOrder: true,
          referenceOrderItemId: orderItem.order_detail_id,
        });
        if (stockTrxIds.length === 0) continue;

        transactionIdsMap.push({
          orderItemId: item.orderItemId,
          transactionIds: stockTrxIds,
        });

        // Update the order item fulfilled qty
        await tx
          .table("customer_order_detail")
          .where("order_detail_id", orderItem.order_detail_id)
          .increment("fulfilled_qty", item.qty);
      }

      // Create fulfillment
      if (transactionIdsMap.length > 0) {
        const fulfilmentId = generateId();

        await tx.table<table_fulfilment>("fulfilment").insert({
          id: fulfilmentId,
          order_id: orderId,
          created_at: Formatter.getNowDateTime(),
          created_by: createdBy.id,
        });

        const fulfilmentDetail = transactionIdsMap
          .map((t) => {
            return t.transactionIds.map(
              (transactionId) =>
                ({
                  id: generateId(),
                  fulfilment_id: fulfilmentId,
                  transaction_id: transactionId,
                  order_detail_id: t.orderItemId,
                } as table_fulfilment_detail)
            );
          })
          .flat();

        await tx
          .table<table_fulfilment_detail>("fulfilment_detail")
          .insert(fulfilmentDetail);
      }
    });
  }
}
