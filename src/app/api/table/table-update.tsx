import { table_restaurant_tables } from "@/generated/tables";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { NextResponse } from "next/server";
import { z } from "zod";

const restaurantTableSchema = z.object({
  id: z.string(),
  tableNumber: z.string().min(1, "Table number is required"),
  seatingCapacity: z.number().min(1, "Seating capacity is required"),
  section: z.string().min(1, "Section is required"),
  tableShape: z.string().min(1, "Table shape is required"),
  locationDescription: z.string().optional(),
  features: z.array(z.string()),
  additionalNotes: z.string().optional(),
});

// Infer TypeScript type
export type RestaurantUpdateTable = z.infer<typeof restaurantTableSchema>;

export const updateTable = withAuthApi<RestaurantUpdateTable>(
  async ({ db, body }) => {
    const input = restaurantTableSchema.parse(body);

    const data = {
      table_name: input.tableNumber,
      setting_capacity: input.seatingCapacity,
      section: input.section,
      table_shape: input.tableShape,
      location_description: input.locationDescription || "",
      special_features: input.features.join(", "),
      addional_notes: input.additionalNotes || "",
    };

    await db
      .table<table_restaurant_tables>("restaurant_tables")
      .update(data)
      .where({ id: input.id });

    return NextResponse.json(
      { success: true, result: { ...data, id: input.id } },
      { status: 200 }
    );
  }
);
