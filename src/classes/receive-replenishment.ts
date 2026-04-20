import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { SlotMovementService } from "./slot-movement";
import { generateId } from "@/lib/generate-id";
import { Formatter } from "@/lib/formatter";
import {
  table_receive_replenishment,
  table_receive_replenishment_detail,
  table_replenishment,
  table_replenishment_items,
} from "@/generated/tables";

export interface ReceivedReplenishedItem {
  replenishmentDetailId: string;
  slotId: string;
  lotNumber?: string;
  expiredAt?: string;
  manufacturedAt?: string;
  costPerUnit?: number;
  qty: number;
}

export class ReceiveReplenishment {
  constructor(
    protected db: Knex,
    protected replenishmentId: string,
    protected user: UserInfo,
  ) {}

  async receive(data: ReceivedReplenishedItem[]) {
    return this.db.transaction(async (tx) => {
      const replenishment = await getReplenishmentInfo(
        this.replenishmentId,
        tx,
      );

      if (replenishment.from_warehouse === this.user.currentWarehouseId) {
        throw new Error("Cannot receive replenishment from the same warehouse");
      }

      // add received items to inventory
      const stockService = new SlotMovementService(tx);

      const receivedId = await createReceivedReplenishment(
        this.replenishmentId,
        this.user.id,
        tx,
      );

      for (const item of data) {
        const replenishmentDetail = await getReplenishmentDetail(
          item.replenishmentDetailId,
          tx,
        );
        if (!replenishmentDetail) {
          throw new Error("Replenishment detail not found");
        }

        const remainingQty =
          Number(replenishmentDetail.sent_qty || 0) -
          Number(replenishmentDetail.received_qty || 0);

        if (item.qty > remainingQty) {
          throw new Error("Received quantity exceeds the order qty");
        }

        const transactionId = await stockService.stockin({
          variantId: replenishmentDetail.product_variant_id!,
          slotId: item.slotId,
          qty: item.qty,
          createdBy: this.user,
          transactionType: "REPLENISHMENT",
          productLot: {
            variantId: replenishmentDetail.product_variant_id!,
            lotNumber: item.lotNumber,
            expiredAt: item.expiredAt,
            costPerUnit: item.costPerUnit,
            manufacturedAt: item.manufacturedAt,
          },
        });

        // create received purchase order detail
        await tx
          .table<table_receive_replenishment_detail>(
            "receive_replenishment_detail",
          )
          .insert({
            id: generateId(),
            receive_id: receivedId,
            transaction_id: transactionId.transactionId,
          });

        // update replenishment detail
        await updateReceiveReplenishmentDetail(
          replenishmentDetail.replenish_items_id!,
          item.qty,
          tx,
        );
      }

      await updateReplenishment(this.replenishmentId, tx);

      return receivedId;
    });
  }
}
async function updateReplenishment(replenishmentId: string, tx: Knex) {
  const hasPendingItems = await tx
    .table<table_replenishment_items>("replenishment_items")
    .where("replenish_id", replenishmentId)
    .whereRaw("COALESCE(received_qty, 0) < sent_qty")
    .first();

  const newStatus = hasPendingItems ? "receiving" : "received";

  await tx
    .table<table_replenishment>("replenishment")
    .where("replenish_id", replenishmentId)
    .update({ status: newStatus });
}

async function updateReceiveReplenishmentDetail(
  replenishmentDetailId: string,
  receivedQty: number,
  tx: Knex,
) {
  await tx
    .table<table_replenishment_items>("replenishment_items")
    .where({ replenish_items_id: replenishmentDetailId })
    .update({
      received_qty: tx.raw("COALESCE(received_qty, 0) + ?", receivedQty),
    });
}

async function getReplenishmentDetail(id: string, tx: Knex) {
  const replenishmentDetail: table_replenishment_items = await tx
    .table("replenishment_items")
    .where("replenish_items_id", id)
    .first();

  return replenishmentDetail;
}

async function createReceivedReplenishment(
  replenishedId: string,
  createdBy: string,
  tx: Knex,
) {
  const receivedId = generateId();
  await tx.table<table_receive_replenishment>("receive_replenishment").insert({
    id: receivedId,
    replenishment_id: replenishedId,
    created_by: createdBy,
    created_at: Formatter.getNowDateTime(),
  });
  return receivedId;
}

async function getReplenishmentInfo(replenishmentId: string, tx: Knex) {
  const replenishment = await tx
    .table<table_replenishment>("replenishment")
    .where("replenish_id", replenishmentId)
    .first();

  if (!replenishment) {
    throw new Error("Replenishment not found");
  }

  return replenishment;
}
