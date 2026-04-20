import {
  table_backlog_orders,
  table_customer_order,
  table_customer_order_detail,
  table_fulfilment,
  table_fulfilment_detail,
  table_inventory,
  table_inventory_transactions,
  table_order_payment,
  table_setting,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";

export class UndoCustomerOrderService {
  constructor(
    protected db: Knex,
    protected user: UserInfo,
  ) {}

  async undoOrderFromCompletedToDraft(orderId: string) {
    const now = Formatter.getNowDateTime();
    return await this.db.transaction(async (trx) => {
      const editableOrder = await getEditableOrder(trx, orderId);
      if (!editableOrder) {
        throw new Error("This order is not editable");
      }

      const fulfillment = await getFulfillmentDetail(trx, orderId);

      // Stock in back
      await stockInBackForUndo(fulfillment.fulfillmentDetail, trx);

      // remove fulfillment record
      if (fulfillment.fulfillment?.id) {
        await removeFulfillment(fulfillment.fulfillment?.id, trx);
      }

      // remove payment record
      await trx
        .table<table_order_payment>("order_payment")
        .where("order_id", orderId)
        .delete();

      // update fulfilled qty to 0
      await trx
        .table<table_customer_order_detail>("customer_order_detail")
        .where("order_id", orderId)
        .update({ fulfilled_qty: 0 });

      // update customer order
      await trx
        .table<table_customer_order>("customer_order")
        .where("order_id", orderId)
        .update({ order_status: "DRAFT", paid_at: null, updated_at: now });

      // update seat reservation status to pending
      const items = await trx
        .table("customer_order_detail")
        .where("order_id", orderId)
        .select();
      for (const item of items) {
        await trx
          .table("seat_reservation")
          .where({ order_detail_id: item.order_detail_id })
          .update({
            reservation_status: "pending",
            confirmed_at: null,
            confirmed_by: null,
          });
      }

      if (!!editableOrder.order.table_number) {
        const table = await trx
          .table("restaurant_tables")
          .where({
            id: editableOrder.order.table_number,
            status: "available",
            deleted_at: null,
            warehouse_id: this.user.currentWarehouseId,
          })
          .first();

        if (table) {
          await trx
            .table("restaurant_tables")
            .where({ id: table.id })
            .update({ status: "order_taken" });
        } else {
          const availableTable = await trx
            .table("restaurant_tables")
            .where({
              status: "available",
              deleted_at: null,
              warehouse_id: this.user.currentWarehouseId,
            })
            .first();
          if (availableTable) {
            await trx
              .table("restaurant_tables")
              .where({ id: availableTable.id })
              .update({ status: "order_taken" });
            await trx
              .table<table_customer_order>("customer_order")
              .where("order_id", orderId)
              .update({ table_number: availableTable.id });

            return {
              orderId,
              tableNumber: availableTable.id,
            };
          }
        }
      }

      return {
        orderId,
        tableNumber: null,
      };
    });
  }
}

async function removeFulfillment(fulfillmentId: string, tx: Knex) {
  await tx
    .table<table_fulfilment>("fulfilment")
    .where("id", fulfillmentId)
    .delete();

  // remove fulfillment detail record
  await tx
    .table<table_fulfilment_detail>("fulfilment_detail")
    .where("fulfilment_id", fulfillmentId)
    .delete();
}

async function stockInBackForUndo(
  fulfillmentDetails: table_fulfilment_detail[],
  tx: Knex,
) {
  for (const f of fulfillmentDetails) {
    if (!f.transaction_id)
      throw new Error("Invalid transaction of fulfillment" + f.id);

    // if transaction_id start with back_log:: then we need to delete from backlog_orders

    if (f.transaction_id.startsWith("back_log::")) {
      await tx
        .table<table_backlog_orders>("backlog_orders")
        .where("id", f.transaction_id)
        .delete();
      continue;
    }

    const transactionDetail = await getTransaction(f.transaction_id, tx);
    if (!transactionDetail) {
      throw new Error("Transaction not found for fulfillment " + f.id);
    }
    await increaseStockBackByTransaction(transactionDetail, tx);

    // remove this transaction
    await tx
      .table<table_inventory_transactions>("inventory_transactions")
      .where("id", transactionDetail.id)
      .delete();
  }
}

async function increaseStockBackByTransaction(
  transactionDetail: table_inventory_transactions,
  tx: Knex,
) {
  const inventory = await findInventoryByInventoryTransaction(
    transactionDetail,
    tx,
  );
  if (!inventory) {
    throw new Error(
      "Inventory not found for transaction " + transactionDetail.id,
    );
  }

  await tx
    .table<table_inventory>("inventory")
    .increment("qty", Math.abs(transactionDetail.qty))
    .where("id", inventory.id);
}

async function findInventoryByInventoryTransaction(
  transaction: table_inventory_transactions,
  tx: Knex,
) {
  return await tx
    .table<table_inventory>("inventory")
    .where("variant_id", transaction.variant_id)
    .where("slot_id", transaction.slot_id)
    .where("lot_id", transaction.lot_id)
    .first();
}

async function getTransaction(
  trxId: string,
  tx: Knex,
): Promise<table_inventory_transactions | null> {
  const transactionDetail: table_inventory_transactions = await tx
    .table<table_inventory_transactions>("inventory_transactions")
    .where("id", trxId)
    .first();
  if (!transactionDetail) return null;
  return transactionDetail;
}

async function getFulfillmentDetail(
  trx: Knex,
  orderId: string,
): Promise<{
  fulfillment: table_fulfilment | null;
  fulfillmentDetail: table_fulfilment_detail[];
}> {
  const fulfillment: table_fulfilment = await trx
    .table("fulfilment")
    .where({ order_id: orderId })
    .first();

  if (!fulfillment) {
    return { fulfillment: null, fulfillmentDetail: [] };
  }

  const fulfillmentDetail: table_fulfilment_detail[] = await trx
    .table<table_fulfilment_detail>("fulfilment_detail")
    .where("fulfilment_id", fulfillment.id)
    .select();

  return { fulfillment, fulfillmentDetail };
}

async function getEditableDays(trx: Knex) {
  const isEditable: table_setting = await trx
    .table("setting")
    .where("option", "EDITABLE_ORDER_DAY")
    .first();

  const editableDays = isEditable ? parseInt(isEditable.value || "1", 10) : 0;

  return editableDays;
}

async function getEditableOrder(
  trx: Knex,
  orderId: string,
): Promise<{
  order: table_customer_order;
  orderDetail: table_customer_order_detail[];
} | null> {
  const editableDays = await getEditableDays(trx);
  const latestEditableDate = Formatter.addDateToNow(-editableDays, "day");

  const order: table_customer_order = await trx
    .table<table_customer_order>("customer_order")
    .where({ order_id: orderId })
    .where("order_status", "COMPLETED")
    .where("paid_at", ">=", latestEditableDate)
    .first();
  if (!order) {
    return null;
  }

  const orderDetail: table_customer_order_detail[] = await trx
    .table<table_customer_order_detail>("customer_order_detail")
    .where({ order_id: orderId });

  return { order, orderDetail };
}
