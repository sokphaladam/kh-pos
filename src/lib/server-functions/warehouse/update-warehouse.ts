import { table_warehouse, table_warehouse_slot } from "@/generated/tables";
import { WarehouseInput } from "@/lib/types";
import { Knex } from "knex";
import moment from "moment-timezone";
import { v4 } from "uuid";

export async function updateWarehouse(db: Knex, input: WarehouseInput) {
  try {
    return await db.transaction(async (trx) => {
      const warehouseInput = {
        name: input.name,
        is_main: Number(input.isMain),
        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
      };

      const newWarehouseSlotInput = [];

      for (const slot of input.slot) {
        if (slot.id) {
          await db
            .table<table_warehouse_slot>("warehouse_slot")
            .where("id", slot.id)
            .update({
              id: slot.id,
              slot_name: slot.slotName,
              slot_capacity: slot.slotCapacity,
              slot_status: slot.slotStatus,
              updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
              warehouse_id: input.id,
            })
            .transacting(trx);
        } else {
          newWarehouseSlotInput.push({
            id: v4(),
            slot_name: slot.slotName,
            slot_capacity: slot.slotCapacity,
            slot_status: slot.slotStatus,
            created_at: new Date(),
            updated_at: new Date(),
            warehouse_id: input.id,
          });
        }
      }

      await db
        .table<table_warehouse>("warehouse")
        .where("id", input.id)
        .update(warehouseInput)
        .transacting(trx);

      if (newWarehouseSlotInput.length > 0) {
        await db
          .table("warehouse_slot")
          .insert(newWarehouseSlotInput)
          .transacting(trx);
      }

      return {
        success: true,
        result: { message: "Update warehouse #" + input.id },
      };
    });
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
