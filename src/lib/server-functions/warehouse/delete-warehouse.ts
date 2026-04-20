import { table_warehouse, table_warehouse_slot } from "@/generated/tables";
import { Logger } from "@/lib/logger";
import { Knex } from "knex";

export async function deleteWarehouse(db: Knex, id: string) {
  try {
    await db
      .table<table_warehouse>("warehouse")
      .where("id", id)
      .update({ is_deleted: 1 });

    return {
      success: true,
      result: { message: "Delete warehouse #" + id },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function deleteWarehouseSlot(
  db: Knex,
  id: string[],
  logger: Logger
) {
  try {
    await db
      .table<table_warehouse_slot>("warehouse_slot")
      .whereIn("id", id)
      .update({ is_deleted: 1 });

    for (const slotId in id) {
      logger.log("warehouse_slot:delete", {
        action: "delete",
        table_name: "warehouse_slot",
        key: slotId,
      });
    }

    return {
      success: true,
      result: { message: "Delete slot warehouse " + id.join(",") },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
