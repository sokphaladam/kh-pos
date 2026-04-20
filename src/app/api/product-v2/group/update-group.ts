import {
  ProductGroupInputSchema,
  ProductGroupInputType,
  ProductGroupService,
} from "@/classes/product-group";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export const updateProductGroup = withAuthApi<
  unknown,
  ProductGroupInputType & { groupId: string },
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  const schemaInput = ProductGroupInputSchema.extend({
    groupId: z.string().min(1),
  });
  const parsedInput = schemaInput.parse(body);

  const productGroupService = new ProductGroupService(db);

  const result = await productGroupService.updateProductGroup(
    parsedInput.groupId,
    parsedInput,
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
