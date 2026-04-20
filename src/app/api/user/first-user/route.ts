import { WarehouseService } from "@/classes/warehouse";
import withDatabaseApi from "@/lib/server-functions/with-database-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { CreateWarehouseV2Input } from "../../warehouse-v2/route";

const inputWarehouseSchema = z.object({
  warehouseName: z.string().trim().min(3, { message: "Required" }),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  ownerName: z.string().trim().min(3, { message: "Required" }),
  userName: z.string().trim().min(3, { message: "Required" }),
  password: z.string().trim().min(3, { message: "Required" }),
});

export const POST = withDatabaseApi<
  unknown,
  CreateWarehouseV2Input,
  ResponseType<string>
>(async ({ db, body }) => {
  const input = inputWarehouseSchema.parse(body);
  const warehouseService = new WarehouseService(db);
  const warehouseId = await warehouseService.createWarehouse({
    warehouseName: input.warehouseName,
    phoneNumber: input.phoneNumber,
    address: input.address,
    ownerName: input.ownerName,
    userName: input.userName,
    password: input.password,
    createdBy: undefined,
    isMain: true,
  });

  return NextResponse.json(
    { success: true, result: warehouseId },
    { status: 200 }
  );
});
