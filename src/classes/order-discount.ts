import { CustomerOrderDiscount } from "@/dataloader/discount-by-order-items-loader";
import {
  table_customer_order_detail,
  table_discount,
  table_discount_log,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { computeVariantDiscount } from "@/lib/variant-discount";
import {
  OrderDiscountRules,
  allocateDiscount,
  computeOrderLevelDiscount,
  variantMaxQtyFromRules,
} from "@/lib/order-discount-rules";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import {
  getOrderDetail,
  recalculateCustomerOrder,
  updateOrderDetail,
  updateOrderTotalAmount,
} from "./order";
import { applyModifierToOrderItem } from "./order-modifier";

/** Sentinel `discount_log.discount_id` for the auto order-level discount. */
export const ORDER_LEVEL_DISCOUNT_ID = "order";
const ORDER_LEVEL_DISCOUNT_TITLE = "Order discount";

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

        const subtotalCents = Math.round(subtotalAmount * 100);
        const discountAmount =
          discountType === "PERCENTAGE"
            ? Math.floor((subtotalCents * amount) / 100) / 100
            : Math.floor(subtotalAmount * amount) / 100;

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
  rules?: OrderDiscountRules,
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

  // sort manual discount first, and the auto order-level slice last (it is a
  // stored absolute amount that sits on top of every per-line discount).
  existingDiscounts.sort((a, b) => {
    const rank = (d: table_discount_log) =>
      d.discount_id === ORDER_LEVEL_DISCOUNT_ID
        ? 2
        : d.is_manual_discount === 1
          ? 0
          : 1;
    return rank(a) - rank(b);
  });

  const variantMaxQty = rules ? variantMaxQtyFromRules(rules) : undefined;

  await knex.transaction(async (trx) => {
    for (const discount of existingDiscounts) {
      // Auto order-level threshold discount. Owned entirely by
      // recalculateOrderLevelDiscount, which rebuilds each line from gross and
      // then writes the allocated slice onto discount_amount / total_amount.
      // Skip it here so this per-line pass always yields the line net *before*
      // the order-level slice.
      if (discount.discount_id === ORDER_LEVEL_DISCOUNT_ID) {
        continue;
      }

      // Auto-applied product-variant menu discount. Recomputed from the variant
      // config on every recalc so it stays correct across qty changes, and is
      // per-unit (unlike the generic promotion AMOUNT branch which is per-line).
      // computeVariantDiscount caps the discounted units at the configured
      // max-qty-per-line, so units beyond that on the line pay full price.
      if (discount.discount_id === "variant") {
        const variantDiscount = computeVariantDiscount(
          Number(orderItem.price || 0),
          discount.discount_type,
          Number(discount.value || 0),
          Number(orderItem.qty || 0),
          variantMaxQty,
        );
        const discountValue = Math.min(
          variantDiscount?.lineDiscountAmount ?? 0,
          orderItemAmount,
        );
        totalDiscount += discountValue;
        orderItemAmount -= discountValue;
        await updateDiscountLog(
          discount.id!,
          discount.order_detail_id!,
          { discount_amount: String(discountValue) },
          trx,
        );
        continue;
      }

      if (discount.is_manual_discount === 1) {
        if (discount.discount_type === "AMOUNT") {
          totalDiscount += Number(discount.discount_amount || "0");
          orderItemAmount -= Number(discount.discount_amount || "0");
        } else {
          const orderItemAmountCents = Math.round(orderItemAmount * 100);
          const discountValue =
            Math.floor(
              (orderItemAmountCents * Number(discount.value || "0")) / 100,
            ) / 100;
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
          const orderItemAmountCents = Math.round(orderItemAmount * 100);
          const discountValue =
            Math.floor(
              (orderItemAmountCents * Number(discount.value || "0")) / 100,
            ) / 100;
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

/**
 * Re-evaluate the whole-order threshold discount (rules 1 & 2 of
 * ORDER_DISCOUNT_RULES) for one order and persist it as a per-line
 * `discount_log` slice (`discount_id = "order"`), proportional to each line's
 * value. When both threshold rules qualify the larger discount wins (see
 * computeOrderLevelDiscount); the discount never stacks.
 *
 * Idempotent: it rebuilds every line from gross on each call, so it converges
 * no matter how stale the existing "order" rows are. Runs after every per-line
 * recalc, inside the same transaction.
 */
export async function recalculateOrderLevelDiscount(
  orderId: string,
  trx: Knex,
  rules: OrderDiscountRules,
  createdBy: string | null,
): Promise<void> {
  const lines = await trx
    .table<table_customer_order_detail>("customer_order_detail")
    .where({ order_id: orderId });
  if (lines.length === 0) return;

  const existingOrderLogs = await trx
    .table<table_discount_log>("discount_log")
    .whereIn(
      "order_detail_id",
      lines.map((l) => l.order_detail_id!),
    )
    .where("discount_id", ORDER_LEVEL_DISCOUNT_ID);
  const existingByLine = new Map(
    existingOrderLogs.map((l) => [l.order_detail_id!, l] as const),
  );

  // Rebuild each line from gross (modifiers + line discounts, but NOT the
  // order-level slice — applyDiscountToOrderItem skips it) so we get a clean
  // "net before order discount" and the line-discount total for every line,
  // regardless of how other discount types store their amounts.
  const netBeforeOrder: number[] = [];
  const lineDiscountOnly: number[] = [];
  let totalQty = 0;
  for (const line of lines) {
    line.total_amount = String(
      Number(line.price || 0) * Number(line.qty || 0),
    );
    line.discount_amount = "0";
    line.modifer_amount = "0";
    await applyModifierToOrderItem(line, trx);
    await applyDiscountToOrderItem(line, trx, rules);
    netBeforeOrder.push(Math.max(0, Number(line.total_amount || 0)));
    lineDiscountOnly.push(Number(line.discount_amount || 0));
    totalQty += Number(line.qty || 0);
  }

  const subtotal = netBeforeOrder.reduce((a, b) => a + b, 0);
  const orderDiscount = computeOrderLevelDiscount({ subtotal, totalQty, rules });
  const shares =
    orderDiscount && orderDiscount.amount > 0
      ? allocateDiscount(orderDiscount.amount, netBeforeOrder)
      : lines.map(() => 0);

  const now = Formatter.getNowDateTime();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const share = shares[i] ?? 0;
    const existing = existingByLine.get(line.order_detail_id!);

    if (share > 0 && orderDiscount) {
      const row = {
        discount_amount: String(share),
        discount_title: ORDER_LEVEL_DISCOUNT_TITLE,
        discount_type: orderDiscount.discountType,
        value: String(orderDiscount.value),
        is_manual_discount: 0,
      };
      if (existing) {
        await trx
          .table<table_discount_log>("discount_log")
          .where("id", existing.id)
          .update(row);
      } else {
        await trx.table<table_discount_log>("discount_log").insert({
          ...row,
          id: generateId(),
          order_detail_id: line.order_detail_id!,
          discount_id: ORDER_LEVEL_DISCOUNT_ID,
          created_at: now,
          created_by: createdBy,
        });
      }
    } else if (existing) {
      await trx
        .table<table_discount_log>("discount_log")
        .where("id", existing.id)
        .delete();
    }

    await updateOrderDetail(
      line.order_detail_id!,
      {
        discount_amount: String(lineDiscountOnly[i] + share),
        total_amount: String(Math.max(0, netBeforeOrder[i] - share)),
        modifer_amount: line.modifer_amount,
      },
      trx,
    );
  }

  await updateOrderTotalAmount(orderId, trx);
}
