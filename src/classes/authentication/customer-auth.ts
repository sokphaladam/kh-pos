import {
  table_customer,
  table_restaurant_tables,
  table_warehouse,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateUserToken } from "@/lib/generate-id";
import { getDistanceFromLatLonInMeters } from "@/lib/utils";
import { Knex } from "knex";
import { z } from "zod";

export const walkinLoginInputSchema = z.object({
  tableId: z.string().uuid(),
  deviceId: z.string(),
  metaData: z.object({}).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type WalkinLoginInput = z.infer<typeof walkinLoginInputSchema>;

export class CustomerAuthentication {
  constructor(protected db: Knex) {}

  async walkinLogin(input: WalkinLoginInput): Promise<string> {
    const table = await getTableInfo(this.db, input.tableId);
    if (!table) {
      throw new Error("Table not found");
    }
    const warehouse = await getWarehouseInfo(this.db, table.warehouse_id);
    if (!warehouse) {
      throw new Error("Warehouse not found");
    }
    const isInZone = await isInWarehouseZone(warehouse, input.lat, input.lng);
    if (!isInZone) {
      throw new Error("You are not in the walk-in zone");
    }

    const walkinCustomer = await getWalkinCustomer(this.db, warehouse.id!);
    if (!walkinCustomer) {
      throw new Error("Walk-in customer not found");
    }
    // create customer token
    const now = Formatter.getNowDateTime();
    const expiresAt = Formatter.addDateToNow(1, "day");
    const token = generateUserToken();
    await this.db.table("customer_token").insert({
      created_at: now,
      customer_id: walkinCustomer.id!,
      device_id: input.deviceId,
      expires_at: expiresAt, // expire one day later
      metadata: input.metaData ? JSON.stringify(input.metaData) : null,
      platform: "web",
      token,
      token_type: "walk-in",
      lat: input.lat,
      lng: input.lng,
    });

    return token;
  }
}

async function getTableInfo(db: Knex, tableId: string) {
  const table = await db<table_restaurant_tables>("restaurant_tables")
    .where("id", tableId)
    .whereNull("deleted_at")
    .first();
  return table;
}

export async function getWarehouseInfo(db: Knex, warehouseId: string) {
  const warehouse = await db<table_warehouse>("warehouse")
    .where("id", warehouseId)
    .where("is_deleted", 0)
    .first();
  return warehouse;
}

export function isInWarehouseZone(
  warehouse: table_warehouse,
  lat: number,
  lng: number
) {
  if (!warehouse.lat || !warehouse.lng) {
    return false;
  }
  const radiusInMeters = warehouse.walkin_radius_in_meters || 100;
  const distance = getDistanceFromLatLonInMeters(
    lat,
    lng,
    Number(warehouse.lat),
    Number(warehouse.lng)
  );
  return distance <= radiusInMeters;
}

async function getWalkinCustomer(db: Knex, warehouseId: string) {
  const customer = await db<table_customer>("customer")
    .where("pos_warehouse_id", warehouseId)
    .where("customer_name", "Walk In")
    .first();
  return customer;
}
