import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const toggleProductCategorySchema = z.object({
  categoryIds: z.array(z.string()),
  status: z.enum(["enable", "disable"]),
});

type ToggleProductCategoryRequest = z.infer<typeof toggleProductCategorySchema>;

export const POST = withAuthApi<
  ToggleProductCategoryRequest,
  ResponseType<{ affectedProducts: number }>
>(async ({ db, body }) => {
  const toggleData = toggleProductCategorySchema.parse(body);
  const res = await db.transaction(async (trx) => {
    const product_categories = await trx("product_categories")
      .select("*")
      .whereIn("category_id", toggleData.categoryIds);

    if (product_categories.length > 0) {
      await trx("product")
        .whereIn(
          "id",
          product_categories.map((pc) => pc.product_id),
        )
        .update({
          is_for_sale: toggleData.status === "enable" ? true : false,
        });

      return product_categories.length;
    }

    return 0;
  });

  return NextResponse.json(
    {
      success: true,
      message: `Products have been ${toggleData.status === "enable" ? "enabled" : "disabled"} successfully.`,
      result: { affectedProducts: res },
    } as ResponseType<{ affectedProducts: number }>,
    { status: 200 },
  );
});
