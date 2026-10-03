import { LoaderFactory } from "@/dataloader/loader-factory";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { NextResponse } from "next/server";

export const listBindProduct = withAuthApi<{ id: string }>(
  async ({ db, params, userAuth }) => {
    const id = params?.id;

    const items: { product_id: string }[] = await db
      .table("product_modifier")
      .where({ modifier_id: id })
      .distinct("product_id");

    const productLoader = LoaderFactory.basicProductLoader(db);
    const imageLoader = LoaderFactory.productImageLoader(db);
    const variantLoader = LoaderFactory.productVariantLoader(
      db,
      userAuth.admin!.currentWarehouseId!,
    );

    const products = await Promise.all(
      items.map(async (x) => ({
        product_id: x.product_id,
        modifier_id: id,
        product: await productLoader.load(x.product_id),
        images: await imageLoader.load(x.product_id),
        variants: await variantLoader.load(x.product_id),
      })),
    );

    return NextResponse.json(
      {
        success: true,
        // Deleted products keep their binding row; don't list them.
        result: products
          .filter((p) => p.product && !p.product.deletedAt)
          .sort((a, b) =>
            (a.product?.title ?? "").localeCompare(b.product?.title ?? ""),
          ),
      },
      { status: 200 },
    );
  },
);
