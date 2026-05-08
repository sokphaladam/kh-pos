import {
  ProductWarehouseVisibility,
  ProductWarehouseVisibilitySchema,
  ProductWarehouseVisibilityService,
} from "@/classes/product-warehouse-visibility";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import z from "zod";

export const POST = withAuthApi<
  unknown,
  {
    input: ProductWarehouseVisibility[];
  },
  ResponseType<unknown>
>(async ({ db, body }) => {
  const input = z.array(ProductWarehouseVisibilitySchema).parse(body?.input);

  const productWarehouseVisibilityService =
    new ProductWarehouseVisibilityService(db);

  const payload = Array.isArray(input) ? input : [input];

  await productWarehouseVisibilityService.setProductWarehouseVisibility(
    payload,
  );

  return NextResponse.json(
    {
      success: true,
      result: payload,
    },
    { status: 200 },
  );
});

export const DELETE = withAuthApi<
  unknown,
  {
    input: {
      warehouseId: string;
      productId: string;
      productVariantId: string;
    }[];
  },
  ResponseType<unknown>
>(async ({ db, body }) => {
  const productWarehouseVisibilityService =
    new ProductWarehouseVisibilityService(db);

  const input = body?.input;

  if (!input || !Array.isArray(input)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid input format",
      },
      { status: 400 },
    );
  }

  await productWarehouseVisibilityService.removeProductWarehouseVisibility(
    input,
  );

  return NextResponse.json(
    {
      success: true,
    },
    { status: 200 },
  );
});
