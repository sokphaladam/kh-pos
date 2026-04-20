import { LoaderFactory } from "@/dataloader/loader-factory";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { NextResponse } from "next/server";

export const listBindProduct = withAuthApi<{ id: string }>(
  async ({ db, params, userAuth }) => {
    const id = params?.id;

    const items = await db.table("product_modifier").where({ modifier_id: id });

    const productLoader = LoaderFactory.basicProductLoader(db);
    const imageLoader = LoaderFactory.productImageLoader(db);
    const variantLoader = LoaderFactory.productVariantLoader(
      db,
      userAuth.admin!.currentWarehouseId!
    );

    const products = await Promise.all(
      items.map(async (x) => {
        return {
          ...x,
          product: await productLoader.load(x.product_id),
          images: await imageLoader.load(x.product_id),
          variants: await variantLoader.load(x.product_id),
        };
      })
    );

    return NextResponse.json(
      { success: true, result: products },
      { status: 200 }
    );
  }
);
