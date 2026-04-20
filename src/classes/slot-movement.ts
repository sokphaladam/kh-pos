import { TransferInput } from "@/app/api/inventory/transfer/route";
import {
  table_backlog_orders,
  table_inventory,
  table_inventory_transactions,
  table_product,
  table_product_lot,
  table_product_variant,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";

interface SlotStockoutProps {
  slotId: string;
  variantId: string;
  qty: number;
  createdBy: UserInfo;

  transactionType: table_inventory_transactions["transaction_type"];

  // When there is no stock quantity or when stock is currently busy
  // because of other transaction already acquire all the lock,
  // instead of throwing an error, we fallback to backorder.
  //
  // Backorder helps prevent negative stock quantity, as well as
  // blocking sales from being made.
  fallbackBacklogOrder?: boolean;

  // @TODO: We might need to provide a reference order item,
  // when we specify backorder, so we can bind the transaction
  // refernece back to order once backorder is fulfilled.
  referenceOrderItemId?: string;
  lotId?: string;
}

interface SlotStockinProps {
  variantId: string;
  slotId: string;
  productLot: ProductLot;
  qty: number;
  createdBy: UserInfo;
  transactionType: table_inventory_transactions["transaction_type"];
}

interface SlotStockAjustmentProps {
  variantId: string;
  slotId: string;
  qty: number;
  lotId: string;
  createdBy: UserInfo;
  transactionType: table_inventory_transactions["transaction_type"];
}

interface ProductLot {
  variantId: string;
  lotNumber?: string | null;
  expiredAt?: string;
  manufacturedAt?: string;
  costPerUnit?: number;
}

export class SlotMovementService {
  constructor(protected tx: Knex) {}

  private async createProductLot(
    productLot: ProductLot,
    tx: Knex,
  ): Promise<table_product_lot> {
    const now = Formatter.getNowDateTime();
    const findQuery = tx.table<table_product_lot>("product_lot").where({
      variant_id: productLot.variantId,
      expiration_date: productLot.expiredAt ?? null,
      manufacturing_date: productLot.manufacturedAt ?? null,
      cost_per_unit: productLot.costPerUnit?.toString() ?? null,
      lot_number: productLot.lotNumber ?? null,
    });

    const existingLot = await findQuery.first();
    if (existingLot) return existingLot;

    const lotId = generateId();
    await tx.table<table_product_lot>("product_lot").insert({
      id: lotId,
      variant_id: productLot.variantId,
      lot_number: productLot.lotNumber,
      expiration_date: productLot.expiredAt,
      manufacturing_date: productLot.manufacturedAt,
      cost_per_unit: productLot.costPerUnit?.toString(),
      created_at: now,
    });
    return {
      id: lotId,
      variant_id: productLot.variantId,
      lot_number: productLot.lotNumber ?? null,
      expiration_date: productLot.expiredAt ?? null,
      manufacturing_date: productLot.manufacturedAt ?? null,
      cost_per_unit: productLot.costPerUnit?.toString() ?? null,
      created_at: now,
    };
  }

  async stockin({
    variantId,
    slotId,
    productLot,
    qty,
    createdBy,
    transactionType,
  }: SlotStockinProps) {
    return await this.tx.transaction(async (tx) => {
      const now = Formatter.getNowDateTime();

      const lot = await this.createProductLot(productLot, tx);
      if (!lot) throw new Error("Product lot not found");

      // add to inventory transaction
      const transactionId = generateId();
      await tx
        .table<table_inventory_transactions>("inventory_transactions")
        .insert({
          id: transactionId,
          transaction_type: transactionType,
          lot_id: lot.id,
          variant_id: variantId,
          slot_id: slotId,
          qty,
          created_by: createdBy.id,
          created_at: now,
          updated_at: now,
        });

      // get existing inventory if any
      const existingInventory: table_inventory = await tx
        .table("inventory")
        .where({
          variant_id: variantId,
          slot_id: slotId,
          lot_id: lot.id,
        })
        .first()
        .forUpdate()
        .noWait();

      if (existingInventory) {
        // update existing inventory
        await tx
          .table<table_inventory>("inventory")
          .where("id", existingInventory.id)
          .increment("qty", qty);
      } else {
        // add to inventory
        await tx.table<table_inventory>("inventory").insert({
          id: generateId(),
          lot_id: lot.id,
          variant_id: variantId,
          slot_id: slotId,
          qty,
          expired_at: productLot.expiredAt,
        });
      }
      return { transactionId, lotId: lot.id };
    });
  }

  async stockout({
    slotId,
    variantId,
    qty,
    transactionType,
    fallbackBacklogOrder,
    createdBy,
    lotId,
  }: SlotStockoutProps) {
    return await this.tx.transaction(async (tx) => {
      const now = Formatter.getNowDateTime();

      // Getting the first expiry stock first and lock to
      // prevents other transaction from access the same stock.

      const stockQuery = tx
        .table("inventory")
        .where({
          variant_id: variantId,
          slot_id: slotId,
        })
        .where("qty", ">", 0)
        .orderBy("expired_at", "asc")
        .forUpdate()
        .skipLocked()
        .select<table_inventory[]>();

      if (lotId !== undefined) {
        stockQuery.where("lot_id", lotId);
      }

      const stockExpiryList = await stockQuery;

      const transactionIdList: string[] = [];

      // Deduct the stock quantity
      let remainingQty = qty;

      for (const stock of stockExpiryList) {
        const stockQty = stock.qty;
        const qtyToDeduct = Math.min(remainingQty, stockQty);

        await tx
          .table<table_inventory>("inventory")
          .where("id", stock.id)
          .decrement("qty", qtyToDeduct);

        const transactionId = generateId();
        transactionIdList.push(transactionId);

        await tx
          .table<table_inventory_transactions>("inventory_transactions")
          .insert({
            id: transactionId,
            transaction_type: transactionType,
            lot_id: stock.lot_id,
            variant_id: stock.variant_id,
            slot_id: stock.slot_id,
            qty: -qtyToDeduct,
            created_by: createdBy.id,
            created_at: now,
            updated_at: now,
          });

        remainingQty -= qtyToDeduct;
        if (remainingQty === 0) break;
      }

      if (remainingQty > 0) {
        // If there is still remaining quantity and no backorder is specified,
        // we throw an error because we can't fulfill the stock quantity and we
        // don't want to do negative stock quantity.
        if (!fallbackBacklogOrder)
          throw new Error("Stock quantity not enough or busy");
        // get product info to check if it is stock tracked
        const product: table_product = await tx
          .table<table_product_variant>("product_variant")
          .innerJoin("product", "product_variant.product_id", "product.id")
          .where({ "product_variant.id": variantId })
          .select("product.*")
          .first();
        if (product.track_stock === 1) {
          // We will resolve this failed transaction later.
          const backlogId = "back_log::" + generateId();
          await this.tx.table<table_backlog_orders>("backlog_orders").insert({
            id: backlogId,
            slot_id: slotId,
            variant_id: variantId,
            qty: remainingQty,
            created_by: createdBy.id,
            created_at: now,
            updated_at: now,
          });
          transactionIdList.push(backlogId);
        }
      }

      return transactionIdList;
    });
  }

  async adjustStock({
    variantId,
    slotId,
    qty,
    lotId,
    createdBy,
    transactionType,
  }: SlotStockAjustmentProps) {
    return await this.tx.transaction(async (tx) => {
      const now = Formatter.getNowDateTime();

      // add to inventory transaction
      const transactionId = generateId();
      await tx
        .table<table_inventory_transactions>("inventory_transactions")
        .insert({
          id: transactionId,
          transaction_type: transactionType,
          lot_id: lotId,
          variant_id: variantId,
          slot_id: slotId,
          qty: qty,
          created_by: createdBy.id,
          created_at: now,
          updated_at: now,
        });

      // get existing inventory if any
      const existingInventory: table_inventory = await tx
        .table<table_inventory>("inventory")
        .where({
          variant_id: variantId,
          slot_id: slotId,
          lot_id: lotId,
        })
        .first()
        .forUpdate()
        .noWait();

      if (existingInventory) {
        // update existing inventory
        await tx
          .table<table_inventory>("inventory")
          .where("id", existingInventory.id)
          .increment("qty", qty);
      } else {
        // add to inventory
        await tx.table<table_inventory>("inventory").insert({
          id: generateId(),
          lot_id: lotId,
          variant_id: variantId,
          slot_id: slotId,
          qty,
        });
      }
      return transactionId;
    });
  }

  async transfer(input: TransferInput & { createdBy: string }) {
    return await this.tx.transaction(async (tx) => {
      const now = Formatter.getNowDateTime();

      const existingCurrent: table_inventory = await tx
        .table<table_inventory>("inventory")
        .where({
          variant_id: input.variantId,
          slot_id: input.currentSlotId,
        })
        .where("qty", ">", 0)
        .first()
        .forUpdate()
        .noWait();

      const existingDestination: table_inventory = await tx
        .table<table_inventory>("inventory")
        .where({
          variant_id: input.variantId,
          slot_id: input.destinationSlotId,
        })
        .first()
        .forUpdate()
        .noWait();

      if (existingCurrent && existingCurrent.qty >= input.qty) {
        let lot;
        await tx
          .table<table_inventory>("inventory")
          .where("id", existingCurrent.id)
          .decrement("qty", input.qty);

        if (existingDestination) {
          await tx
            .table<table_inventory>("inventory")
            .where("id", existingDestination.id)
            .increment("qty", input.qty);
        } else {
          const variant: table_product_variant = await tx
            .table<table_product_variant>("product_variant")
            .where({ id: input.variantId })
            .first();
          lot = await this.createProductLot(
            {
              variantId: input.variantId,
              costPerUnit: Number(variant.purchased_cost),
            },
            tx,
          );

          await tx.table<table_inventory>("inventory").insert({
            id: generateId(),
            lot_id: lot.id,
            variant_id: input.variantId,
            slot_id: input.destinationSlotId,
            qty: input.qty,
            expired_at: lot.expiration_date || now,
          });
        }

        // add to inventory transaction
        const transaction: table_inventory_transactions[] = [
          {
            id: generateId(),
            transaction_type: "TRANSFER_OUT",
            variant_id: input.variantId,
            slot_id: input.currentSlotId,
            qty: -input.qty,
            created_by: input.createdBy,
            created_at: now,
            updated_at: now,
            lot_id: existingCurrent.lot_id,
          },
          {
            id: generateId(),
            transaction_type: "TRANSFER_IN",
            variant_id: input.variantId,
            slot_id: input.destinationSlotId,
            qty: input.qty,
            created_by: input.createdBy,
            created_at: now,
            updated_at: now,
            lot_id: existingDestination
              ? existingDestination.lot_id
              : lot?.id || "",
          },
        ];

        await tx
          .table<table_inventory_transactions>("inventory_transactions")
          .insert(transaction);

        if (input.orderId) {
          await tx
            .table("customer_order")
            .where({ order_id: input.orderId })
            .update({ transfer_by: input.createdBy, transfer_at: now });
        }
      }

      return true;
    });
  }

  async getTransactionDetail(transactionId: string) {
    const result: table_inventory_transactions | null = await this.tx
      .table<table_inventory_transactions>("inventory_transactions")
      .where({ id: transactionId })
      .first();

    if (!result) return null;

    const productLot: table_product_lot | null = await this.tx
      .table<table_product_lot>("product_lot")
      .where({ id: result.lot_id })
      .first();

    return {
      transaction: result,
      lot: productLot,
    };
  }
}
