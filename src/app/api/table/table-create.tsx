import { table_restaurant_tables } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { NextResponse } from "next/server";
import { z } from "zod";

const restaurantTableSchema = z.object({
  tableNumber: z.string().min(1, "Table number is required"),
  seatingCapacity: z.number().min(1, "Seating capacity is required"),
  section: z.string().min(1, "Section is required"),
  tableShape: z.string().min(1, "Table shape is required"),
  locationDescription: z.string().optional(),
  features: z.array(z.string()),
  additionalNotes: z.string().optional(),
});

// Infer TypeScript type
export type RestaurantTable = z.infer<typeof restaurantTableSchema>;

export const createTable = withAuthApi<RestaurantTable>(
  async ({ db, body, userAuth }) => {
    const user = userAuth.admin!;
    const input = restaurantTableSchema.parse(body);

    const data: table_restaurant_tables = {
      id: generateId(),
      table_name: input.tableNumber,
      setting_capacity: input.seatingCapacity,
      section: input.section,
      table_shape: input.tableShape,
      location_description: input.locationDescription || "",
      special_features: input.features.join(", "),
      addional_notes: input.additionalNotes || "",
      status: "available",
      created_at: Formatter.getNowDateTime(),
      created_by: user.id,
      warehouse_id: user.currentWarehouseId || "",
      deleted_at: null,
      deleted_by: null,
    };

    await db.table<table_restaurant_tables>("restaurant_tables").insert(data);

    return NextResponse.json({ success: true, result: data }, { status: 200 });
  }
);
