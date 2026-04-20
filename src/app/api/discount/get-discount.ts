import { DiscountService } from "@/classes/discount";
import { LoaderFactory } from "@/dataloader/loader-factory";
import { Formatter } from "@/lib/formatter";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { DiscountType, ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const getDiscount = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ data: DiscountType[]; total: number }>
>(async ({ db, req, userAuth }) => {
  const params = req.nextUrl.searchParams;
  const limit = parseInt(params.get("limit") || "10", 10);
  const offset = parseInt(params.get("offset") || "0", 10);
  const id = params.get("id");

  const userLoader = LoaderFactory.userLoader(db);
  const warehouseLoader = LoaderFactory.warehouseLoader(db);
  const productDiscountLoader = LoaderFactory.appliedDiscountLoader(db);

  const discount = new DiscountService(db);

  const { items, total } = await discount.list(
    limit,
    offset,
    id,
    userAuth.admin!.currentWarehouseId || null
  );

  const discounts: DiscountType[] = await Promise.all(
    items.map(async (item) => {
      return {
        id: item.discount_id || "",
        title: item.title || "",
        description: item.description || "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        discountType: item.discount_type as any,
        value: Number(item.value || 0),
        warehouseId: item.warehouse_id || "",
        createdAt: Formatter.dateTime(item.created_at ?? "") || "",
        updatedAt: Formatter.dateTime(item.update_at ?? "") || "",
        createdBy: item.created_by
          ? await userLoader.load(item.created_by)
          : null,
        updatedBy: item.updated_by
          ? await userLoader.load(item.updated_by)
          : null,
        warehouse: item.warehouse_id
          ? await warehouseLoader.load(item.warehouse_id)
          : null,
        applied: await productDiscountLoader.load(item.discount_id),
      };
    })
  );

  return NextResponse.json(
    {
      success: true,
      result: {
        data: discounts,
        total,
      },
    },
    { status: 200 }
  );
});
