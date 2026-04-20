import { ProductGroupService } from "@/classes/product-group";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const assignWarehouseGroup = withAuthApi<
  { id: string },
  { warehouseIds: string[] },
  ResponseType<unknown>
>(async ({ db, params, body }) => {
  const groupId = params?.id;
  const warehouseIds = body?.warehouseIds || [];

  const productGroupService = new ProductGroupService(db);

  const result = await productGroupService.assignWarehouseToGroup(
    groupId || "",
    warehouseIds,
  );

  return NextResponse.json(
    {
      success: true,
      data: result,
    },
    {
      status: 200,
    },
  );
});
