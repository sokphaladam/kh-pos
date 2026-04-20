import { table_warehouse, table_warehouse_slot } from "@/generated/tables";
import { WarehouseResponseType } from "@/lib/types";
import { Knex } from "knex";

function mapWarhouse(
  warehouse: table_warehouse[],
  slots: table_warehouse_slot[]
): WarehouseResponseType[] {
  return warehouse.map((x) => {
    return {
      id: x.id || "",
      name: x.name || "",
      isMain: Boolean(x.is_main) || false,
      createdAt: x.created_at || "",
      updatedAt: x.updated_at || "",
      lat: x.lat || "",
      lng: x.lng || "",
      slot: slots
        .filter((slot) => slot.warehouse_id === x.id)
        .map((slot) => {
          return {
            id: slot.id || "",
            slotName: slot.slot_name || "",
            warehouseId: slot.warehouse_id || "",
            slotCapacity: slot.slot_capacity || 0,
            slotStatus: slot.slot_status || "INACTIVE",
            createdAt: slot.created_at || "",
            updatedAt: slot.updated_at || "",
          };
        }),
    };
  });
}

export async function getWarehouse(
  db: Knex,
  limit: number = 30,
  offset: number = 0,
  id?: string[]
): Promise<{ data: WarehouseResponseType[]; total: number }> {
  const query = db
    .table<table_warehouse>("warehouse")
    .where("is_deleted", false);

  if (id) {
    query.whereIn("id", id);
  }

  const { total } = await query
    .clone()
    .count("* as total")
    .first<{ total: number }>();

  const warehouse = await query
    .clone()
    .limit(limit)
    .offset(offset)
    .orderBy("created_at", "desc");

  const warehouse_slot: table_warehouse_slot[] = await db
    .table<table_warehouse_slot>("warehouse_slot")
    .whereIn(
      "warehouse_id",
      warehouse.map((x) => x.id || "")
    )
    .where("is_deleted", false);

  return {
    data: mapWarhouse(warehouse, warehouse_slot),
    total,
  };
}
