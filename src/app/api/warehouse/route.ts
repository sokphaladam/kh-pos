import { WarehouseService, WarehouseV2ResponseType } from "@/classes/warehouse";
import { createWarehouse } from "@/lib/server-functions/warehouse/create-warehouse";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import withDatabaseApi from "@/lib/server-functions/with-database-api";
import { ResponseType, WarehouseInput } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputSlotSchema = z.object({
  id: z.string().optional(),
  slotName: z.string().trim().min(1, { message: "Required" }),
  slotCapacity: z.number(),
  slotStatus: z.enum(["ACTIVE", "INACTIVE"]),
});

const inputWarehouseSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, { message: "Required" }),
  isMain: z.boolean(),
  slot: z.array(inputSlotSchema),
});

export const GET = withDatabaseApi<
  unknown,
  unknown,
  ResponseType<{ data: WarehouseV2ResponseType[]; total: number }>
>(async ({ db, req }) => {
  const params = req.nextUrl.searchParams;
  const limit = parseInt(params.get("limit") || "10", 10);
  const offset = parseInt(params.get("offset") || "0", 10);
  const id = params.get("id")?.split(",");

  const warehouseService = new WarehouseService(db);

  const warehouse = await warehouseService.getWarehouse(limit, offset, id);

  if (warehouse) {
    return NextResponse.json(
      { success: true, result: warehouse },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { success: false, error: "No warehouse found" },
    { status: 500 }
  );
});

export const POST = withAuthApi<
  unknown,
  WarehouseInput,
  ResponseType<{ message: string }>
>(async ({ db, body, logger }) => {
  try {
    const input: WarehouseInput = inputWarehouseSchema.parse(body);
    if (!input.id) {
      return NextResponse.json(
        { success: false, error: "Warehouse ID is required" },
        { status: 400 }
      );
    }
    const warehouse = await createWarehouse(db, input, logger);

    return NextResponse.json(warehouse, {
      status: warehouse.success ? 200 : 500,
    });
  } catch {
    return NextResponse.json(
      { error: "Unknown error", success: false },
      {
        status: 500,
      }
    );
  }
});
