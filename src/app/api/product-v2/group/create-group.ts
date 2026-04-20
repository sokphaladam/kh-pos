import {
  ProductGroupInputSchema,
  ProductGroupInputType,
  ProductGroupService,
} from "@/classes/product-group";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const createProductGroup = withAuthApi<
  unknown,
  ProductGroupInputType,
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  const input = ProductGroupInputSchema.parse(body);
  const productGroupService = new ProductGroupService(db);

  const result = await productGroupService.createProductGroup(
    input,
    userAuth.admin!,
  );

  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 },
  );
});
