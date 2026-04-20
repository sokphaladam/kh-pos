import { LoaderFactory } from "@/dataloader/loader-factory";
import { table_product_discount } from "@/generated/tables";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const discountProductList = withAuthApi<
  unknown,
  unknown,
  ResponseType<unknown>
>(async ({ db, req, userAuth }) => {
  const user = userAuth.admin!;
  const discountLoader = LoaderFactory.discountLoader(db);
  let data: table_product_discount[] = [];
  const param = req.nextUrl.searchParams;
  const productId = param.get("productId");
  const id = param.get("id");
  const query = db.table<table_product_discount>("product_discount");

  if (id) {
    query.where("discount_id", id);
  }

  if (productId) {
    const all = await query.clone().where({ is_applied_all: 1 });
    data = [...data, ...all];
    const category = await query
      .clone()
      .distinct("product_discount.*")
      .innerJoin(
        "product_categories",
        "product_discount.category_id",
        "product_categories.category_id"
      )
      .where("product_categories.product_id", productId);
    data = [...data, ...category];
    query.where("product_id", productId);
  }

  const items: table_product_discount[] = await query.clone().select();

  data = [...data, ...items];

  const productLoader = LoaderFactory.basicProductLoader(db);
  const productVariantLoader = LoaderFactory.productVariantLoader(
    db,
    user.currentWarehouseId || ""
  );
  const categoryLoader = LoaderFactory.productCategoryLoader(db);

  const result = await Promise.all(
    data.map(async (item) => {
      return {
        productId: item.product_id,
        discountId: item.discount_id,
        discount: item.discount_id
          ? await discountLoader.load(item.discount_id)
          : null,
        product: item.product_id
          ? await productLoader.load(item.product_id)
          : null,
        productVariants: item.product_id
          ? await productVariantLoader.load(item.product_id)
          : null,
        isAppliedAll: item.is_applied_all === 1,
        category: item.category_id
          ? await categoryLoader.load(item.category_id)
          : null,
      };
    })
  );

  return NextResponse.json({ success: true, result }, { status: 200 });
});
