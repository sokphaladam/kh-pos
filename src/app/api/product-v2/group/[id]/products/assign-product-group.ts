import { GroupProduct, ProductGroupService } from "@/classes/product-group";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const assignProductGroup = withAuthApi<
  { id: string },
  GroupProduct[],
  ResponseType<unknown>
>(async ({ db, body, params }) => {
  const groupId = params?.id;
  const input = body;

  const productGroupService = new ProductGroupService(db);

  const result = await productGroupService.assignProductsToGroup(
    groupId || "",
    input as GroupProduct[],
  );

  return NextResponse.json(
    {
      success: true,
      data: result,
    },
    { status: 200 },
  );
});
