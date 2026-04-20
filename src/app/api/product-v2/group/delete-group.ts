import { ProductGroupService } from "@/classes/product-group";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const deleteProductGroup = withAuthApi<
  unknown,
  { groupId: string },
  ResponseType<unknown>
>(async ({ db, userAuth, body }) => {
  const productGroupService = new ProductGroupService(db);

  const result = await productGroupService.deleteProductGroup(
    body?.groupId || "",
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
