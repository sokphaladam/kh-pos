import {
  ProductGroupResult,
  ProductGroupService,
} from "@/classes/product-group";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const getGroupList = withAuthApi<
  unknown,
  unknown,
  ResponseType<{
    total: number;
    result: ProductGroupResult[];
  }>,
  { limit: number; offset: number; warehouseIds?: string }
>(async ({ db, searchParams }) => {
  const params = searchParams;
  const limit = Number(params?.limit) || 30;
  const offset = Number(params?.offset) || 0;
  const warehouseIds = params?.warehouseIds?.split(",") || [];
  const productGroupService = new ProductGroupService(db);

  const result = await productGroupService.getProductGroupList({
    limit,
    offset,
    warehouseIds,
  });

  return NextResponse.json(
    {
      success: true,
      result: {
        ...result,
      },
    },
    { status: 200 },
  );
});
