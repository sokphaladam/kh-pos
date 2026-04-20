import { table_warehouse_slot } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { Knex } from "knex";

interface SearchSlotProps {
  searchName?: string;
  warehouseId: string;
  offset?: number;
  limit?: number;
}

export interface SlotDetail {
  id: string;
  name: string;
  warehouseId: string;
  createdAt: string;
  updatedAt: string;
  posSlot: boolean;
  forReplenishment?: boolean;
}

export interface SlotProps {
  warehouseId: string;
  slotName: string;
  createdBy: string;
  posSlot?: boolean;
  forReplenishment?: boolean;
}

export interface SlotUpdateProps {
  id: string;
  warehouseId: string;
  slotName: string;
  forReplenishment?: boolean;
  updatedBy: string;
}

export class SlotService {
  constructor(protected tx: Knex) {}

  async createSlot({
    warehouseId,
    slotName,
    createdBy,
    posSlot = false,
    forReplenishment = false,
  }: SlotProps) {
    const now = Formatter.getNowDateTime();
    const slotId = generateId();
    await this.tx.table<table_warehouse_slot>("warehouse_slot").insert({
      id: slotId,
      warehouse_id: warehouseId,
      slot_name: slotName,
      created_by: createdBy,
      pos_slot: posSlot ? 1 : 0,
      for_replenishment: forReplenishment ? 1 : 0,
      created_at: now,
    });
    return slotId;
  }

  async updateSlot({
    id,
    slotName,
    warehouseId,
    updatedBy,
    forReplenishment,
  }: SlotUpdateProps & { forReplenishment?: boolean }): Promise<boolean> {
    const now = Formatter.getNowDateTime();
    await this.tx
      .table<table_warehouse_slot>("warehouse_slot")
      .where({ id, warehouse_id: warehouseId })
      .update({
        slot_name: slotName,
        updated_by: updatedBy,
        updated_at: now,
        for_replenishment: forReplenishment ? 1 : 0,
      });
    return true;
  }

  async searchSlot({
    searchName,
    warehouseId,
    offset,
    limit,
  }: SearchSlotProps) {
    const query = this.tx
      .table<table_warehouse_slot>("warehouse_slot")
      .where({ warehouse_id: warehouseId, is_deleted: 0 });

    if (searchName) {
      query.whereRaw("LOWER(slot_name) LIKE ?", [
        `%${searchName.toLowerCase()}%`,
      ]);
    }

    const rowsCount = await query
      .clone()
      .count("* as total")
      .first<{ total: number }>();
    const total = rowsCount ? rowsCount.total : 0;

    const slots = await query
      .select<table_warehouse_slot[]>()
      .orderBy("created_at", "desc")
      .offset(offset ?? 0)
      .limit(limit ?? 10);

    const data = slots.map((slot) => ({
      id: slot.id!,
      name: slot.slot_name,
      warehouseId: slot.warehouse_id,
      createdAt: slot.created_at,
      updatedAt: slot.updated_at,
      posSlot: slot.pos_slot ?? false,
      forReplenishment: slot.for_replenishment ?? false,
    })) as SlotDetail[];
    return {
      data,
      total,
    };
  }

  async deleteSlotByWarehouseId(warehouseId: string) {
    await this.tx
      .table<table_warehouse_slot>("warehouse_slot")
      .where({ warehouse_id: warehouseId })
      .update({ is_deleted: 1 });
    return true;
  }

  async deleteSlot(id: string) {
    const slotDetail: table_warehouse_slot = await this.tx
      .table("warehouse_slot")
      .where({ id })
      .first();
    if (slotDetail && slotDetail.pos_slot) {
      throw new Error("POS Slot cannot be deleted");
    }

    // before delete, check if there is stock in this slot
    const stockCount = await this.tx
      .table("inventory")
      .where({ slot_id: id })
      .where("qty", ">", 0)
      .count("* as total")
      .first<{ total: number }>();
    if (stockCount && stockCount.total > 0) {
      throw new Error("Cannot delete slot with existing stock");
    }

    await this.tx
      .table<table_warehouse_slot>("warehouse_slot")
      .where({ id })
      .update({ is_deleted: 1 });
    return true;
  }
}
