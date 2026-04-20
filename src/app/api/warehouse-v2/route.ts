import { WarehouseService } from "@/classes/warehouse";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputWarehouseSchema = z.object({
  warehouseName: z.string().trim().min(3, { message: "Required" }),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  ownerName: z.string().trim().min(3, { message: "Required" }),
  userName: z.string().trim().min(4, { message: "Required" }),
  password: z.string().trim().min(4, { message: "Required" }),
  image: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  useMainBranchVisibility: z.boolean().optional(),
});

const inputUpdateWarehouseSchema = z.object({
  id: z.string().trim().min(1, { message: "Required" }),
  warehouseName: z.string().trim().min(3, { message: "Required" }),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  ownerName: z.string().trim().min(3, { message: "Required" }),
  image: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  useMainBranchVisibility: z.boolean().optional(),
});

export interface CreateWarehouseV2Input {
  warehouseName?: string;
  phoneNumber?: string;
  address?: string;
  ownerName?: string;
  userName?: string;
  password?: string;
  image?: string;
  lat?: string;
  lng?: string;
  useMainBranchVisibility?: boolean;
}

export interface UpdateWarehouseV2Input extends Omit<
  CreateWarehouseV2Input,
  "userName" | "password"
> {
  id: string;
}

export const POST = withAuthApi<
  unknown,
  CreateWarehouseV2Input,
  ResponseType<string>
>(async ({ db, userAuth, body }) => {
  const input = inputWarehouseSchema.parse(body);
  const warehouseService = new WarehouseService(db);
  const warehouseId = await warehouseService.createWarehouse({
    warehouseName: input.warehouseName,
    phoneNumber: input.phoneNumber,
    address: input.address,
    ownerName: input.ownerName,
    userName: input.userName,
    password: input.password,
    createdBy: userAuth.admin!.id,
    image: input.image,
    lat: input.lat,
    lng: input.lng,
    useMainBranchVisibility: input.useMainBranchVisibility,
  });

  return NextResponse.json(
    { success: true, result: warehouseId },
    { status: 200 },
  );
});

export const DELETE = withAuthApi<
  unknown,
  { id: string },
  ResponseType<{ message: string }>
>(async ({ db, body, logger }) => {
  const id = String(body?.id || "");

  const warehouseService = new WarehouseService(db);
  await warehouseService.deleteWarehouse(id);

  logger.serverLog("warehouse:delete", {
    action: "delete",
    table_name: "warehouse",
    key: id,
  });

  return NextResponse.json({
    success: true,
    result: { message: "Warehouse deleted" },
  });
});

export const PUT = withAuthApi<
  unknown,
  UpdateWarehouseV2Input,
  ResponseType<boolean>
>(async ({ db, body, logger, userAuth }) => {
  const input = inputUpdateWarehouseSchema.parse(body);
  const warehouseService = new WarehouseService(db);
  const result = await warehouseService.updateWarehouse({
    id: input.id,
    warehouseName: input.warehouseName,
    phoneNumber: input.phoneNumber,
    address: input.address,
    ownerName: input.ownerName,
    createdBy: userAuth.admin!.id,
    image: input.image,
    lat: input.lat,
    lng: input.lng,
    useMainBranchVisibility: input.useMainBranchVisibility,
  });

  logger.serverLog("warehouse:update", {
    action: "update",
    table_name: "warehouse",
    key: input.id ?? "",
  });

  return NextResponse.json(
    {
      success: true,
      result,
    },
    {
      status: 200,
    },
  );
});
