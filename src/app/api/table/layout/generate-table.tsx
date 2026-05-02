import { table_restaurant_tables } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { NextResponse } from "next/server";
import { z } from "zod";

const restaurantTableSchema = z.object({
  count: z.number(),
  default: z.object({
    key: z.string(),
    capacity: z.number(),
    section: z.string(),
    shape: z.string(),
  }),
});

export type RestaurantTableGenerate = z.infer<typeof restaurantTableSchema>;

const GRID_COLUMNS = 10;
const NODE_WIDTH = 150;
const NODE_HEIGHT = 100;
const GAP_X = 50;
const GAP_Y = 50;
const OFFSET_X = 50;
const OFFSET_Y = 50;

export const tableLayoutGenerate = withAuthApi(
  async ({ db, body, userAuth }) => {
    const input = restaurantTableSchema.parse(body);

    for (let i = 0; i < input.count; i++) {
      console.log("Generating table", i + 1);
      const tableName = `${input.default.key}-${String(i + 1).padStart(2, "0")}`;
      const col = i % GRID_COLUMNS;
      const row = Math.floor(i / GRID_COLUMNS);
      const newTable: table_restaurant_tables = {
        id: generateId(),
        table_name: tableName,
        setting_capacity: input.default.capacity,
        section: input.default.section,
        table_shape: input.default.shape,
        addional_notes: null,
        created_at: Formatter.getNowDateTime(),
        created_by: userAuth.admin?.id || "",
        deleted_at: null,
        deleted_by: null,
        location_description: null,
        special_features: null,
        warehouse_id: userAuth.admin?.currentWarehouseId || "",
        status: "available",
        position_x: String(col * (NODE_WIDTH + GAP_X) + OFFSET_X),
        position_y: String(row * (NODE_HEIGHT + GAP_Y) + OFFSET_Y),
      };

      await db.transaction(async (trx) => {
        await trx.table("restaurant_tables").insert(newTable);
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Tables generated successfully",
      },
      { status: 200 },
    );
  },
);
