import { CustomerOrderDiscount } from "@/dataloader/discount-by-order-items-loader";
import {
  table_customer_order_detail,
  table_discount,
  table_discount_log,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { getOrderDetail, recalculateCustomerOrder } from "./order";

export class OrderDiscountService {
  constructor(protected tx: Knex) {}

  async addPromotion({
    itemId,
    discountId,
    user,
  }: {
    orderId: string;
    itemId: string;
    discountId: string;
    user: UserInfo;
  }): Promise<{
    totalDiscount: number;
    orderItemAmount: number;
    discountLog: CustomerOrderDiscount[];
  }> {
    return await this.tx.transaction(async (trx) => {
      const now = Formatter.getNowDateTime();
      const orderItem = await getOrderDetail(itemId, trx);
      if (!orderItem) {
        throw new Error("Order item not found");
      }

      /* calculate total discount amount of order item */
      // get existing discount
      const existingDiscounts: table_discount_log[] =
        await getDiscountLogByOrderDetailId(orderItem.order_detail_id!, trx);

      if (existingDiscounts.find((d) => d.discount_id === discountId)) {
        throw new Error("Discount already applied to this item");
      }

      const discountInfo = await trx
        .table<table_discount>("discount")
        .where("discount_id", discountId)
        .first();

      if (!discountInfo) {
        throw new Error("Discount not found");
      }

      await addDiscountLog(
        {
          id: generateId(),
          order_detail_id: itemId,
          discount_id: discountInfo.discount_id,
          created_at: now,
          value: discountInfo.value.toString(),
          discount_title: discountInfo.title || "",
          discount_type: discountInfo.discount_type,
          is_manual_discount: 0,
          created_by: user.id,
        },
        trx,
      );

      // recalculate total discount and amount
      const { totalDiscount, orderItemAmount, discountLog } =
        await recalculateCustomerOrder(orderItem, trx);

      return {
        totalDiscount,
        orderItemAmount,
        discountLog,
      };
    });
  }

  async removePromotion({
    itemId,
    discountId,
  }: {
    orderId: string;
    itemId: string;
    discountId: string;
  }): Promise<{
    totalDiscount: number;
    orderItemAmount: number;
    discountLog: CustomerOrderDiscount[];
  }> {
    return await this.tx.transaction(async (trx) => {
      const orderItem = await getOrderDetail(itemId, trx);
      if (!orderItem) {
        throw new Error("Order item not found");
      }

      // get existing discount
      const existingDiscounts: table_discount_log[] =
        await getDiscountLogByOrderDetailId(orderItem.order_detail_id!, trx);

      const discountIndex = existingDiscounts.findIndex(
        (d) => d.discount_id === discountId,
      );
      if (discountIndex === -1) {
        throw new Error("Discount not found in this item");
      }

      // remove discount log
      await removeDiscountLog(discountId, orderItem.order_detail_id!, trx);

      // recalculate total discount and amount
      const { totalDiscount, orderItemAmount, discountLog } =
        await recalculateCustomerOrder(orderItem, trx);

      return { totalDiscount, orderItemAmount, discountLog };
    });
  }

  async updateManualDiscount(
    items: {
      orderId: string;
      itemId: string;
      amount: number;
      user: UserInfo;
      discountType: "PERCENTAGE" | "AMOUNT";
    }[],
  ) {
    return await this.tx.transaction(async (trx) => {
      const now = Formatter.getNowDateTime();
      const results: {
        itemId: string;
        totalDiscount: number;
        orderItemAmount: number;
        discountLog: CustomerOrderDiscount[];
      }[] = [];

      for (const item of items) {
        const { itemId, amount, user, discountType } = item;

        const orderItem = await getOrderDetail(itemId, trx);
        if (!orderItem) {
          throw new Error(`Order item not found: ${itemId}`);
        }

        const manualDiscount = await getManualDiscountLog(
          orderItem.order_detail_id!,
          trx,
        );

        const subtotalAmount = Number(orderItem.price) * Number(orderItem.qty);

        const discountAmount = Math.floor(subtotalAmount * amount) / 100;

        if (!manualDiscount && amount > 0) {
          // add manual discount
          await addDiscountLog(
            {
              order_detail_id: itemId,
              discount_id: "manual",
              discount_amount:
                discountType === "AMOUNT"
                  ? String(amount)
                  : String(discountAmount),
              is_manual_discount: 1,
              created_at: now,
              created_by: user.id,
              discount_title: "Manual Discount",
              discount_type: discountType,
              id: generateId(),
              value: String(amount), // original value
            },
            trx,
          );
        } else if (manualDiscount) {
          if (amount > 0) {
            await updateDiscountLog(
              manualDiscount!.id!,
              itemId,
              {
                discount_amount:
                  discountType === "AMOUNT"
                    ? String(amount)
                    : String(discountAmount),
                created_at: now,
                created_by: user.id,
                discount_type: discountType,
                value: String(amount),
              },
              trx,
            );
          } else {
            await removeDiscountLog(manualDiscount!.discount_id!, itemId, trx);
          }
        }

        // recalculate total discount and amount
        const { totalDiscount, orderItemAmount, discountLog } =
          await recalculateCustomerOrder(orderItem, trx);

        results.push({
          itemId,
          totalDiscount,
          orderItemAmount,
          discountLog,
        });
      }

      return results;
    });
  }
}

export function mapDiscountLog(
  discountLog: table_discount_log,
): CustomerOrderDiscount {
  return {
    id: discountLog.id,
    discountId: discountLog.discount_id!,
    orderDetailId: discountLog.order_detail_id!,
    amount: Number(discountLog.discount_amount || 0),
    name: discountLog.discount_title || "",
    discountType: discountLog.discount_type || undefined,
    value: Number(discountLog.value || 0),
    createdAt: discountLog.created_at || undefined,
    isManualDiscount: discountLog.is_manual_discount === 1,
  };
}

export async function getDiscountLogByOrderDetailId(
  orderDetailId: string,
  trx: Knex,
): Promise<table_discount_log[]> {
  return await trx
    .table<table_discount_log>("discount_log")
    .where("order_detail_id", orderDetailId)
    .orderBy("created_at");
}

async function addDiscountLog(input: table_discount_log, trx: Knex) {
  await trx.table<table_discount_log>("discount_log").insert(input);
}

async function removeDiscountLog(
  discountId: string,
  orderDetailId: string,
  trx: Knex,
) {
  await trx
    .table<table_discount_log>("discount_log")
    .where("discount_id", discountId)
    .andWhere("order_detail_id", orderDetailId)
    .delete();
}

async function getManualDiscountLog(
  orderDetailId: string,
  trx: Knex,
): Promise<table_discount_log | undefined> {
  return await trx
    .table<table_discount_log>("discount_log")
    .where("order_detail_id", orderDetailId)
    .andWhere("is_manual_discount", 1)
    .first();
}

async function updateDiscountLog(
  discountId: string,
  orderDetailId: string,
  updateData: Partial<table_discount_log>,
  trx: Knex,
) {
  await trx
    .table<table_discount_log>("discount_log")
    .where("id", discountId)
    .andWhere("order_detail_id", orderDetailId)
    .update(updateData);
}

export async function applyDiscountToOrderItem(
  orderItem: table_customer_order_detail,
  knex: Knex,
) {
  // order item amount
  let orderItemAmount = Number(orderItem.total_amount || 0);

  // total discount amount
  let totalDiscount = Number(orderItem.discount_amount || 0);

  // get existing discounts
  const existingDiscounts = await getDiscountLogByOrderDetailId(
    orderItem.order_detail_id,
    knex,
  );

  // sort manual discount first
  existingDiscounts.sort((a, b) => {
    if (a.is_manual_discount === b.is_manual_discount) return 0;
    if (a.is_manual_discount === 1) return -1;
    return 1;
  });

  await knex.transaction(async (trx) => {
    for (const discount of existingDiscounts) {
      if (discount.is_manual_discount === 1) {
        if (discount.discount_type === "AMOUNT") {
          totalDiscount += Number(discount.discount_amount || "0");
          orderItemAmount -= Number(discount.discount_amount || "0");
        } else {
          const discountValue =
            Math.floor(orderItemAmount * Number(discount.value || "0")) / 100;
          totalDiscount += discountValue;
          orderItemAmount -= discountValue;
          // for percentage, we need to update discount.discount_amount
          await updateDiscountLog(
            discount.discount_id!,
            discount.order_detail_id!,
            {
              discount_amount: String(discountValue),
            },
            trx,
          );
        }
      } else {
        if (discount.discount_type === "PERCENTAGE") {
          const discountValue =
            Math.floor(orderItemAmount * Number(discount.value || "0")) / 100;
          totalDiscount += discountValue;
          orderItemAmount -= discountValue;
          await updateDiscountLog(
            discount.discount_id!,
            discount.order_detail_id!,
            {
              discount_amount: String(discountValue),
            },
            trx,
          );
        } else {
          totalDiscount += Number(discount.value || "0");
          orderItemAmount -= Number(discount.value || "0");
        }
      }
    }
  });

  if (orderItemAmount < 0) orderItemAmount = 0;
  orderItem.discount_amount = totalDiscount.toString();
  orderItem.total_amount = orderItemAmount.toString();
}
