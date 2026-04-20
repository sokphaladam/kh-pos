import {
  table_customer_order_detail,
  table_inventory_transactions,
  table_order_return,
  table_product_lot,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { SlotMovementService } from "./slot-movement";
import { LoaderFactory } from "@/dataloader/loader-factory";
import { FindProductInSlotResult } from "./find-product-in-slot";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { ShiftService } from "./shift";

export interface OrderReturnInput {
  orderId: string;
  orderItemId: string;
  quantity: number;
  refundAmount: number;
  reason?: string;
  status: table_order_return["status"];
}

export interface OrderReturn {
  id: string;
  orderId: string;
  orderItemId: string;
  quantity: number;
  refundAmount: number;
  reason?: string;
  status: table_order_return["status"];
  returnedAt: string;
  returnedBy?: UserInfo;
  createdBy?: UserInfo;
  createdAt: string;
  stockInAt?: string;
  stockInBy?: UserInfo;
  warehouseId?: string;
  productVariant?: ProductVariantType;
  orderInvoiceNumber?: string;
}

export class OrderReturnService {
  constructor(protected tx: Knex, protected user: UserInfo) {}
  async createOrderReturn(data: OrderReturnInput[]) {
    const now = Formatter.getNowDateTime();
    const returnIds: string[] = [];

    await this.tx.transaction(async (trx) => {
      for (const item of data) {
        const existingReturns: table_order_return[] =
          await trx<table_order_return>("order_return")
            .where("order_id", item.orderId)
            .andWhere("order_item_id", item.orderItemId);

        const orderItem = await trx
          .table<table_customer_order_detail>("customer_order_detail")
          .select("*")
          .where("order_detail_id", item.orderItemId)
          .first();
        if (!orderItem) {
          throw new Error(`Order item  not found`);
        }

        const returnedQty = existingReturns.reduce(
          (sum, returnItem) => sum + returnItem.quantity,
          0
        );
        if (returnedQty + item.quantity > (orderItem.qty || 0)) {
          throw new Error(
            `Cannot return more than the ordered quantity. Ordered: ${orderItem.qty}, Already returned: ${returnedQty}, Attempted to return: ${item.quantity}`
          );
        }

        // Create new order return entry
        const id = generateId();
        returnIds.push(id);

        const shift = await new ShiftService(this.tx).getOpenedShiftByUser(
          this.user.id
        );

        await this.tx<table_order_return>("order_return").insert({
          id,
          order_id: item.orderId,
          order_item_id: item.orderItemId,
          quantity: item.quantity,
          refund_amount: item.refundAmount.toString(),
          reason: item.reason ?? "",
          status: item.status,
          returned_at: now,
          returned_by: this.user.id,
          created_by: this.user.id,
          created_at: now,
          warehouse_id: this.user.currentWarehouseId,
          shift_id: shift.shiftId,
        });
      }
    });

    return returnIds;
  }

  async stockInOrderReturn(id: string) {
    const now = Formatter.getNowDateTime();
    return await this.tx.transaction(async (trx) => {
      const orderReturn = await trx<table_order_return>("order_return")
        .select("*")
        .where("id", id)
        .first();
      if (!orderReturn) {
        throw new Error("Order return not found");
      }
      if (orderReturn.status !== "returned") {
        throw new Error("Order return is not in returned status");
      }

      // Stockin process
      // check the fulfilment log, and return back the stock into inventory accordingly
      // find transaction log for this order item
      const inventoryTransactions: table_inventory_transactions[] = await trx
        .table("fulfilment_detail")
        .innerJoin(
          "inventory_transactions",
          "fulfilment_detail.transaction_id",
          "inventory_transactions.id"
        )
        .select("inventory_transactions.*")
        .orderBy("inventory_transactions.created_at", "desc")
        .where("fulfilment_detail.order_detail_id", orderReturn.order_item_id);

      const stockMovementService = new SlotMovementService(trx);

      let remainingQuantity = orderReturn.quantity;

      for (const transaction of inventoryTransactions) {
        const quantityToReturn = Math.min(
          remainingQuantity,
          Math.abs(transaction.qty)
        );
        if (quantityToReturn <= 0) break;

        const productLotInfo: table_product_lot = await trx
          .table("product_lot")
          .select("*")
          .where("id", transaction.lot_id)
          .first();

        const stockinData = {
          variantId: transaction.variant_id,
          slotId: transaction.slot_id,
          productLot: {
            variantId: productLotInfo.variant_id,
            lotNumber: productLotInfo.lot_number ?? undefined,
            expiredAt: productLotInfo.expiration_date ?? undefined,
            manufacturedAt: productLotInfo.manufacturing_date ?? undefined,
            costPerUnit: Number(productLotInfo.cost_per_unit) ?? undefined,
          },
          qty: quantityToReturn,
          createdBy: this.user,
          transactionType:
            "RETURN" as table_inventory_transactions["transaction_type"],
        };

        const stockintransactionId = await stockMovementService.stockin(
          stockinData
        );

        await trx.table("return_stock_in_transaction").insert({
          return_id: id,
          transaction_id: stockintransactionId,
        });

        remainingQuantity -= quantityToReturn;

        // If no remaining quantity, break
        if (remainingQuantity <= 0) break;
      }

      // Update all order returns to stock_in status
      await trx<table_order_return>("order_return")
        .update({
          status: "stock_in",
          stock_in_at: now,
          stock_in_by: this.user.id,
        })
        .where("id", id);

      return true;
    });
  }

  async getOrderReturnList(
    offset: number = 0,
    limit: number = 10,
    status?: table_order_return["status"]
  ): Promise<{ totalRows: number; data: OrderReturn[] }> {
    const query = this.tx
      .table<table_order_return>("order_return")
      .innerJoin(
        "customer_order_detail",
        "order_return.order_item_id",
        "customer_order_detail.order_detail_id"
      )
      .innerJoin(
        "customer_order",
        "customer_order.order_id",
        "order_return.order_id"
      )
      .select(
        "order_return.*",
        "customer_order_detail.variant_id",
        "invoice_no"
      )
      .where("order_return.warehouse_id", this.user.currentWarehouseId);

    if (status) {
      query.where("status", status);
    }

    const rowsCount = await query
      .clone()
      .count("* as total")
      .first<{ total: number }>();
    const total = rowsCount ? rowsCount.total : 0;

    const orderReturns = await query
      .orderBy("created_at", "desc")
      .offset(offset)
      .limit(limit);

    const data = await Promise.all(
      orderReturns.map(async (item) => OrderReturnService.map(item, this.tx))
    );

    return {
      totalRows: total,
      data,
    };
  }

  static async map(
    item: table_order_return & { variant_id?: string; invoice_no?: string },
    tx: Knex
  ): Promise<OrderReturn> {
    const userLoader = LoaderFactory.userLoader(tx);
    const variantLoader = LoaderFactory.productVariantByIdLoader(
      tx,
      item.warehouse_id || ""
    );
    return {
      id: item.id,
      orderId: item.order_id,
      orderItemId: item.order_item_id,
      quantity: item.quantity,
      refundAmount: Number(item.refund_amount),
      reason: item.reason || undefined,
      status: item.status,
      returnedAt: item.returned_at!,
      returnedBy: item.returned_by
        ? (await userLoader.load(item.returned_by!)) || undefined
        : undefined,
      createdBy: item.created_by
        ? (await userLoader.load(item.created_by!)) ?? undefined
        : undefined,
      createdAt: item.created_at!,
      stockInAt: item.stock_in_at || undefined,
      stockInBy: item.stock_in_by
        ? (await userLoader.load(item.stock_in_by!)) || undefined
        : undefined,
      warehouseId: item.warehouse_id || undefined,
      productVariant: item.variant_id
        ? (await variantLoader.load(item.variant_id)) || undefined
        : undefined,
      orderInvoiceNumber: item.invoice_no,
    };
  }

  async orderReturnSlotList(
    orderReturnId: string
  ): Promise<FindProductInSlotResult[]> {
    return await this.tx.transaction(async (trx) => {
      const orderReturn = await trx<table_order_return>("order_return")
        .select("*")
        .where("id", orderReturnId)
        .first();
      if (!orderReturn) {
        throw new Error("Order return not found");
      }

      const inventoryTransactions: table_inventory_transactions[] = await trx
        .table("fulfilment_detail")
        .innerJoin(
          "inventory_transactions",
          "fulfilment_detail.transaction_id",
          "inventory_transactions.id"
        )
        .select("inventory_transactions.*")
        .orderBy("inventory_transactions.created_at", "desc")
        .where("fulfilment_detail.order_detail_id", orderReturn.order_item_id);

      let remainingQuantity = orderReturn.quantity;
      const result = [];

      for (const transaction of inventoryTransactions) {
        const quantityToReturn = Math.min(
          remainingQuantity,
          Math.abs(transaction.qty)
        );
        if (quantityToReturn <= 0) break;
        result.push({
          variantId: transaction.variant_id,
          slotId: transaction.slot_id,
          qty: quantityToReturn,
        });

        remainingQuantity -= quantityToReturn;
        // If no remaining quantity, break
        if (remainingQuantity <= 0) break;
      }

      // aggregate result by variantId and slotId
      const aggregatedResult: {
        variantId: string;
        slotId: string | null;
        qty: number;
      }[] = [];
      const map = new Map<string, { qty: number }>();

      for (const item of result) {
        const key = `${item.variantId}_${item.slotId}`;
        if (map.has(key)) {
          const existing = map.get(key)!;
          existing.qty += item.qty;
        } else {
          map.set(key, { qty: item.qty });
        }
      }

      map.forEach((value, key) => {
        const [variantId, slotId] = key.split("_");
        aggregatedResult.push({
          variantId,
          slotId,
          qty: value.qty,
        });
      });
      const variantLoader = LoaderFactory.productVariantByIdLoader(
        trx,
        this.user.currentWarehouseId!
      );

      const slotLoader = LoaderFactory.slotLoader(trx);
      const variantSlotStockLoader = LoaderFactory.variantSlotStockLoader(
        trx,
        this.user.currentWarehouseId!
      );

      return (await Promise.all(
        aggregatedResult.map(async (item) => {
          const stock = await variantSlotStockLoader.load(
            `${item.variantId}_${item.slotId}`
          );
          return {
            variant: await variantLoader.load(item.variantId),
            slot: item.slotId ? await slotLoader.load(item.slotId) : null,
            qty: item.qty,
            stock: stock?.stock || 0,
            message: "",
          };
        })
      )) as FindProductInSlotResult[];
    });
  }
}
