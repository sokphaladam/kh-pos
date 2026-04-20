import {
  table_customer_order,
  table_customer_order_detail,
  table_order_detail_modifier,
  table_order_item_status,
  table_restaurant_tables,
} from "@/generated/tables";
import { generateId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { InvoiceNumberService } from "./invoice-number";
import { OrderService } from "./order";
import {
  getDiscountLogByOrderDetailId,
  OrderDiscountService,
} from "./order-discount";
import { getAppliedModifiers, OrderModifierService } from "./order-modifier";
import { OrderStatusService } from "./order-status";

export interface TransferProp {
  sourceTableId: string;
  orderId: string;
  orderItems: OrderItem[];
  destinationTableId: string;
}

interface OrderItem {
  orderItemId: string;
  variantId: string;
  orderItemStatuses: OrderItemStatus[];
}

interface OrderItemStatus {
  status: table_order_item_status["status"];
  quantity: number;
}

export class TransferOrderTableService {
  constructor(protected tx: Knex, protected user: UserInfo) {}

  async createOrderTransfer(orderInfo: TransferProp) {
    const { sourceTableId, orderId, orderItems, destinationTableId } =
      orderInfo;

    const order = await getOrder(orderId, this.tx);
    if (!order) throw new Error("Order not found");

    const tableInfo = await getTableInfo(destinationTableId, this.tx);
    if (!tableInfo) throw new Error("Destination table not found");
    const originalOrderItem = await getOrderItems(orderId, this.tx);
    if (!originalOrderItem) throw new Error("Original order items not found");

    const isCompletedOrderItem = isExactMatch(
      originalOrderItem.map((item) => ({
        orderItemId: item.item.order_detail_id || "",
        quantity: item.item.qty || 0,
        variantId: item.item.variant_id || "",
        orderItemStatuses: item.status.map((status) => ({
          status: status.status,
          quantity: status.qty || 0,
        })),
      })),
      orderItems
    );

    if (tableInfo.status === "available" || tableInfo.status === "cleaning") {
      if (isCompletedOrderItem) {
        // transfer: transfer all ordered items from one table to another empty table
        return await transferTable(
          orderId,
          sourceTableId,
          destinationTableId,
          this.tx
        );
      } else {
        // split: transfer partial items from one table to another empty table
        return splitTable(
          order,
          originalOrderItem.map((item) => ({
            orderItemId: item.item.order_detail_id || "",
            quantity: item.item.qty || 0,
            variantId: item.item.variant_id || "",
            price: item.item.price || "",
            discount_amount: item.item.discount_amount || "",
            modifer_amount: item.item.modifer_amount || "",
            orderItemStatuses: item.status.map((status) => ({
              status: status.status,
              quantity: status.qty || 0,
            })),
          })),
          orderItems,
          destinationTableId,
          this.tx,
          this.user
        );
      }
    } else if (tableInfo.status === "order_taken") {
      // merge: transfer items(all or partial) to occupied table
      const destinationOrder = await getDraftOrderByTableId(
        destinationTableId,
        order.warehouse_id || "",
        this.tx
      );
      if (!destinationOrder) {
        throw new Error("No draft order found for destination table");
      }

      return mergeTable(
        order,
        originalOrderItem.map((item) => ({
          orderItemId: item.item.order_detail_id || "",
          quantity: item.item.qty || 0,
          variantId: item.item.variant_id || "",
          price: item.item.price || "",
          discount_amount: item.item.discount_amount || "",
          modifer_amount: item.item.modifer_amount || "",
          orderItemStatuses: item.status.map((status) => ({
            status: status.status,
            quantity: status.qty || 0,
          })),
        })),
        orderItems,
        destinationOrder,
        sourceTableId,
        this.tx,
        this.user
      );
    }
  }
}

async function splitTable(
  order: table_customer_order,
  originalItems: (OrderItem & {
    price: string;
    discount_amount: string;
    modifer_amount: string;
  })[],
  itemsToTransfer: OrderItem[],
  destinationTableId: string,
  tx: Knex,
  user: UserInfo
): Promise<string> {
  return await tx.transaction(async (trx) => {
    const orderService = new OrderService(trx);
    const orderStatusService = new OrderStatusService(trx, user);
    /* Create new order */
    // find invoice number
    const invoiceNumber = await new InvoiceNumberService(
      trx,
      user
    ).getNextInvoiceNumber(1);
    const newOrder = await orderService.create({
      items: [],
      invoiceNo: invoiceNumber[0],
      customerId: order.customer_id,
      warehouseId: order.warehouse_id,
      createdBy: user,
      status: "DRAFT",
      tableNumber: destinationTableId,
    });

    for (const itemToTransfer of itemsToTransfer) {
      const originalItem = originalItems.find(
        (i) => i.orderItemId === itemToTransfer.orderItemId
      );
      if (!originalItem) continue;

      for (const status of itemToTransfer.orderItemStatuses) {
        const originalStatus = originalItem.orderItemStatuses.find(
          (s) => s.status === status.status
        );
        if (!originalStatus) continue;

        const leftOverStatusQty =
          (originalStatus?.quantity || 0) - status.quantity;

        /* Update original order item status quantity */
        await orderStatusService.forceUpdateOrderItemStatusQty({
          orderItemId: originalItem.orderItemId,
          status: originalStatus?.status,
          qty: Math.max(leftOverStatusQty, 0),
        });
      }

      /* Add new order item */
      const newItemId = generateId();
      await orderService.addOrderItem(
        newOrder.order.order_id,
        {
          id: newItemId,
          variantId: itemToTransfer.variantId,
          qty: 0,
          price: originalItem.price || "",
        },
        user,
        "TRANSFER"
      );

      // apply discount if any
      if (Number(originalItem.discount_amount || 0) > 0) {
        const discounts = await getDiscountLogByOrderDetailId(
          originalItem.orderItemId,
          trx
        );
        const discountService = new OrderDiscountService(trx);
        for (const discount of discounts) {
          if (discount.is_manual_discount) {
            await discountService.updateManualDiscount([
              {
                orderId: newOrder.order.order_id,
                itemId: newItemId,
                discountType: discount.discount_type,
                amount: Number(discount.value || 0),
                user,
              },
            ]);
          } else {
            await discountService.addPromotion({
              orderId: newOrder.order.order_id,
              itemId: newItemId,
              discountId: discount.discount_id || "",
              user,
            });
          }
        }
      }
      // apply modifier if any
      const modifiers = await getAppliedModifiers(
        originalItem.orderItemId,
        trx
      );

      const modifierService = new OrderModifierService(trx, user);
      for (const modifier of modifiers) {
        await modifierService.addOrderModifier({
          orderDetailId: newItemId,
          modifierItemId: modifier.modifier_item_id || "notes",
          price: Number(modifier.price || 0),
          notes: modifier.notes ?? undefined,
        });
      }

      // update order item status
      for (const status of itemToTransfer.orderItemStatuses) {
        await orderStatusService.forceUpdateOrderItemStatusQty({
          orderItemId: newItemId,
          status: status.status,
          qty: status.quantity,
        });
      }
    }
    return newOrder.order.order_id;
  });
}

async function mergeTable(
  sourceOrder: table_customer_order,
  originalItems: (OrderItem & {
    price: string;
    discount_amount: string;
    modifer_amount: string;
  })[],
  itemsToTransfer: OrderItem[],
  destinationOrder: table_customer_order,
  sourceTableId: string,
  tx: Knex,
  user: UserInfo
): Promise<string> {
  return await tx.transaction(async (trx) => {
    const orderService = new OrderService(trx);
    const orderStatusService = new OrderStatusService(trx, user);

    // Process each item that needs to be transferred
    for (const itemToTransfer of itemsToTransfer) {
      let originalModifier: table_order_detail_modifier[] = [];
      // Find the corresponding original item with full details
      const originalItem = originalItems.find(
        (i) => i.orderItemId === itemToTransfer.orderItemId
      );
      if (!originalItem) continue;

      // Update source order quantities by reducing the transferred amounts
      for (const status of itemToTransfer.orderItemStatuses) {
        const originalStatus = originalItem.orderItemStatuses.find(
          (s) => s.status === status.status
        );
        if (!originalStatus) continue;

        // Calculate remaining quantity in source after transfer
        const leftOverStatusQty =
          (originalStatus?.quantity || 0) - status.quantity;

        // Update the source order item status with remaining quantity
        await orderStatusService.forceUpdateOrderItemStatusQty({
          orderItemId: originalItem.orderItemId,
          status: originalStatus?.status,
          qty: Math.max(leftOverStatusQty, 0),
        });
      }

      // Calculate total quantity being transferred for this item
      const totalTransferQty = itemToTransfer.orderItemStatuses.reduce(
        (acc, status) => acc + status.quantity,
        0
      );

      // Check if the same product variant already exists in destination order
      const existingItemInDestination = await tx
        .table<table_customer_order_detail>("customer_order_detail")
        .where({
          order_id: destinationOrder.order_id,
          variant_id: itemToTransfer.variantId,
        });

      let newItemId;
      let orderStatus = itemToTransfer.orderItemStatuses;
      let isSameModifier = false;

      // Handle case where the same product variant exists in destination
      if (existingItemInDestination.length > 0) {
        for (const destItems of existingItemInDestination) {
          // Get modifiers for both source and destination items to compare
          const orderModifier: table_order_detail_modifier[] = await tx
            .table<table_order_detail_modifier>("order_detail_modifier")
            .whereIn("order_detail_id", [
              destItems.order_detail_id,
              originalItem.orderItemId,
            ]);

          // Separate and sort modifiers for comparison
          originalModifier = orderModifier
            .filter((mod) => mod.order_detail_id === originalItem.orderItemId)
            .sort();
          const existingModifier = orderModifier
            .filter((mod) => mod.order_detail_id === destItems.order_detail_id)
            .sort();

          // Check if both items have identical modifiers
          isSameModifier = isOrderItemModifierSame(
            originalModifier,
            existingModifier
          );

          if (!isSameModifier) {
            // Different modifiers: create new separate item in destination
            newItemId = generateId();
            await orderService.addOrderItem(
              destinationOrder.order_id!,
              {
                id: newItemId,
                variantId: itemToTransfer.variantId,
                qty: totalTransferQty,
                price: originalItem.price || "",
              },
              user
            );
          } else {
            // Same modifiers: merge with existing item by adding quantities
            newItemId = destItems.order_detail_id;
            const existingStatus = await tx.table("order_item_status").where({
              order_item_id: destItems.order_detail_id,
            });

            // Combine existing quantities with transferred quantities
            orderStatus = itemToTransfer.orderItemStatuses.map((s) => {
              const qty = Number(
                existingStatus.find((f) => f.status === s.status)?.qty ?? 0
              );
              return {
                ...s,
                quantity: qty + s.quantity, // Add transferred qty to existing qty
              };
            });
          }
        }
      } else {
        // No existing variant in destination: create new item
        newItemId = generateId();
        await orderService.addOrderItem(
          destinationOrder.order_id!,
          {
            id: newItemId,
            variantId: itemToTransfer.variantId,
            qty: totalTransferQty,
            price: originalItem.price || "",
          },
          user,
          "TRANSFER"
        );
      }

      // Transfer any discounts from the original item to the destination item
      if (Number(originalItem.discount_amount || 0) > 0) {
        const discounts = getDiscountLogByOrderDetailId(
          originalItem.orderItemId,
          trx
        );
        const discountService = new OrderDiscountService(trx);
        for (const discount of await discounts) {
          if (discount.is_manual_discount) {
            // Apply manual discount to destination item
            await discountService.updateManualDiscount([
              {
                orderId: destinationOrder.order_id!,
                itemId: newItemId,
                discountType: discount.discount_type,
                amount: Number(discount.value || 0),
                user,
              },
            ]);
          } else {
            // Apply promotional discount to destination item
            await discountService.addPromotion({
              orderId: destinationOrder.order_id!,
              itemId: newItemId,
              discountId: discount.discount_id || "",
              user,
            });
          }
        }
      }

      // Transfer any modifiers from the original item to the destination item
      if (originalModifier?.length > 0 && isSameModifier === false) {
        const modifierService = new OrderModifierService(trx, user);
        for (const modifier of originalModifier) {
          await modifierService.addOrderModifier({
            orderDetailId: newItemId,
            modifierItemId: modifier.modifier_item_id || "notes",
            price: Number(modifier.price || 0),
            notes: modifier.notes ?? undefined,
          });
        }
      }

      // Update the order item status for the destination item with final quantities
      for (const status of orderStatus) {
        await orderStatusService.forceUpdateOrderItemStatusQty({
          orderItemId: newItemId,
          status: status.status,
          qty: status.quantity,
        });
      }
    }

    // Check if the source order has any remaining items after the transfer
    const remainingItems = await getOrderItems(sourceOrder.order_id!, trx);
    const hasRemainingItems = remainingItems?.some((item) =>
      item.status.some((status) => (status.qty || 0) > 0)
    );

    // Clean up source if completely empty after transfer
    if (!hasRemainingItems) {
      // Delete the source order since all items have been transferred
      await orderService.delete(sourceOrder.order_id!);

      // Mark source table as needing cleaning (available for new customers)
      await trx<table_restaurant_tables>("restaurant_tables")
        .where("id", sourceTableId)
        .update({ status: "cleaning" });
    }

    return destinationOrder.order_id!;
  });
}

async function getDraftOrderByTableId(
  tableId: string,
  warehouseId: string,
  tx: Knex
) {
  const draftOrder = await tx<table_customer_order>("customer_order")
    .where("table_number", tableId)
    .andWhere("order_status", "DRAFT")
    .where("warehouse_id", warehouseId)
    .first();
  return draftOrder;
}

async function transferTable(
  orderId: string,
  fromTableId: string,
  toTableId: string,
  tx: Knex
) {
  return await tx.transaction(async (trx) => {
    await trx<table_customer_order>("customer_order")
      .where("order_id", orderId)
      .update({ table_number: toTableId });

    await trx<table_restaurant_tables>("restaurant_tables")
      .where("id", toTableId)
      .update({ status: "order_taken" });

    await trx<table_restaurant_tables>("restaurant_tables")
      .where("id", fromTableId)
      .update({ status: "cleaning" });
    return orderId;
  });
}

async function getTableInfo(tableId: string, tx: Knex) {
  const tableInfo = await tx<table_restaurant_tables>("restaurant_tables")
    .where("id", tableId)
    .first();
  return tableInfo;
}

async function getOrderItems(orderId: string, tx: Knex) {
  const orderItems = await tx<table_customer_order_detail>(
    "customer_order_detail"
  ).where("order_id", orderId);
  if (orderItems.length === 0) {
    return null;
  }

  // get order items status
  const orderItemStatuses = await tx<table_order_item_status>(
    "order_item_status"
  ).whereIn(
    "order_item_id",
    orderItems.map((item) => item.order_detail_id)
  );
  return orderItems.map((item) => ({
    item: item,
    status: orderItemStatuses.filter(
      (status) => status.order_item_id === item.order_detail_id
    ),
  }));
}

async function getOrder(orderId: string, tx: Knex) {
  const order = await tx<table_customer_order>("customer_order")
    .where("order_id", orderId)
    .first();
  return order;
}

function isExactMatch(
  originalItems: OrderItem[],
  toTransferItems: OrderItem[]
): boolean {
  if (originalItems.length !== toTransferItems.length) {
    return false;
  }

  for (const originalItem of originalItems) {
    const matchingItem = toTransferItems.find(
      (item) => item.orderItemId === originalItem.orderItemId
    );
    if (!matchingItem) {
      return false;
    }
    const totalOriginalQty = originalItem.orderItemStatuses.reduce(
      (total, status) => total + (status.quantity || 0),
      0
    );
    const totalMatchingQty = matchingItem.orderItemStatuses.reduce(
      (total, status) => total + (status.quantity || 0),
      0
    );
    if (totalOriginalQty !== totalMatchingQty) {
      return false;
    }
  }

  return true;
}

function isOrderItemModifierSame(
  originalModifiers: table_order_detail_modifier[],
  toCheckModifiers: table_order_detail_modifier[]
): boolean {
  if (originalModifiers.length !== toCheckModifiers.length) {
    return false;
  }

  const sortedOriginal = [...originalModifiers].sort(
    (a, b) => a.order_detail_id?.localeCompare(b.modifier_item_id ?? "") ?? 0
  );
  const sortedToCheck = [...toCheckModifiers].sort(
    (a, b) => a.order_detail_id?.localeCompare(b.modifier_item_id ?? "") ?? 0
  );

  for (let i = 0; i < sortedOriginal.length; i++) {
    if (
      sortedOriginal[i].modifier_item_id !== sortedToCheck[i].modifier_item_id
    ) {
      return false;
    }
    if (
      sortedOriginal[i].modifier_item_id ===
        sortedToCheck[i].modifier_item_id &&
      sortedOriginal[i].order_detail_id === "notes"
    ) {
      if (sortedOriginal[i].notes !== sortedToCheck[i].notes) {
        return false;
      }
      if (sortedOriginal[i].price !== sortedToCheck[i].price) {
        return false;
      }
    }
  }

  return true;
}
