import {
  table_backlog_orders,
  table_fulfilment_detail,
  table_inventory,
} from "@/generated/tables";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { SlotMovementService } from "./slot-movement";
import { generateId } from "@/lib/generate-id";
import { LoaderFactory } from "@/dataloader/loader-factory";
import { Formatter } from "@/lib/formatter";
import { Slot } from "@/dataloader/slot-loader";
import { ProductVariantType } from "@/dataloader/product-variant-loader";

export interface BacklogOrder {
  id: string;
  orderId: string;
  slot: Slot | null;
  variant: ProductVariantType | null;
  qty: number;
  createdAt: string;
  createdBy: UserInfo | null;
}

export class BacklogService {
  constructor(
    protected tx: Knex,
    protected user: UserInfo,
  ) {}

  async backLogOrderList(limit: number, offset: number) {
    const query = this.tx
      .table("backlog_orders")
      .innerJoin(
        "warehouse_slot",
        "backlog_orders.slot_id",
        "warehouse_slot.id",
      )
      .where("warehouse_slot.warehouse_id", this.user.currentWarehouseId!)
      .orderBy("backlog_orders.created_at", "desc");

    const { total } = await query
      .clone()
      .count("* as total")
      .first<{ total: number }>();

    const backlogOrders = await query
      .limit(limit)
      .offset(offset)
      .select("backlog_orders.*");

    const slotLoader = LoaderFactory.slotLoader(this.tx);
    const productVariantLoader = LoaderFactory.productVariantByIdLoader(
      this.tx,
      this.user.currentWarehouseId!,
    );
    const userLoader = LoaderFactory.userLoader(this.tx);
    const data = await Promise.all(
      backlogOrders.map(async (backlog) => {
        return {
          id: backlog.id,
          orderId: backlog.order_id,
          slot: backlog.slot_id ? await slotLoader.load(backlog.slot_id) : null,
          variant: backlog.variant_id
            ? await productVariantLoader.load(backlog.variant_id)
            : null,
          qty: backlog.qty,
          createdAt: Formatter.dateTime(backlog.created_at),
          createdBy: backlog.created_by
            ? await userLoader.load(backlog.created_by)
            : null,
        } as BacklogOrder;
      }),
    );
    return {
      data,
      total,
    };
  }

  async resolveBacklog(backlogId: string) {
    return await this.tx.transaction(async (tx) => {
      const backlog = await tx
        .table("backlog_orders")
        .where("id", backlogId)
        .first<table_backlog_orders>();

      if (!backlog) {
        throw new Error("Backlog not found");
      }

      const movementService = new SlotMovementService(tx);

      // check if there is enough stock
      const stockAvailable = await tx
        .table<table_inventory>("inventory")
        .where("slot_id", backlog.slot_id)
        .where("variant_id", backlog.variant_id)
        .where("qty", ">=", backlog.qty);

      let transactionIds: string[] = [];

      if (stockAvailable?.length === 0) {
        throw new Error("Not enough stock available");
      }
      // get fullfilled detail by backlog id
      const fulfilledDetail: table_fulfilment_detail = await tx
        .table<table_fulfilment_detail>("fulfilment_detail")
        .where("transaction_id", backlogId)
        .first();

      if (!fulfilledDetail) {
        throw new Error("Fulfilled detail not found");
      }

      // deduct stock and create inventory transaction
      transactionIds = await movementService.stockout({
        slotId: backlog.slot_id,
        variantId: backlog.variant_id!,
        qty: backlog.qty,
        createdBy: this.user,
        transactionType: "SALE",
        fallbackBacklogOrder: true,
        referenceOrderItemId: fulfilledDetail.order_detail_id!,
      });

      const fulfilmentDetail = transactionIds.map((transactionId) => {
        return {
          id: generateId(),
          fulfilment_id: fulfilledDetail.fulfilment_id,
          transaction_id: transactionId,
          order_detail_id: fulfilledDetail.order_detail_id!,
        } as table_fulfilment_detail;
      });
      // create new fulfilment detail
      await tx
        .table<table_fulfilment_detail>("fulfilment_detail")
        .insert(fulfilmentDetail);

      // delete old fulfilment detail
      await tx
        .table<table_fulfilment_detail>("fulfilment_detail")
        .where("transaction_id", backlogId)
        .delete();

      // delete backlog
      await tx.table("backlog_orders").where("id", backlogId).delete();

      return true;
    });
  }
}
