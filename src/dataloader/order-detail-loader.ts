import { OrderDetail } from "@/classes/order";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";

export function createOrderDetailLoader(
  db: Knex,
  currentWarehouseId?: string,
): DataLoader<string, OrderDetail[]> {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows = await db
      .table("customer_order_detail")
      .innerJoin(
        "product_variant",
        "customer_order_detail.variant_id",
        "product_variant.id",
      )
      .innerJoin("product", "product.id", "product_variant.product_id")
      .select(
        "customer_order_detail.*",
        "product.title as title",
        "product_variant.name as option",
        "product_variant.sku",
        "product_variant.barcode",
      )
      .whereIn("order_id", keys)
      .orderBy("customer_order_detail.created_at");

    const orderDetailMap: Record<string, OrderDetail[]> = {};

    const variantLoader = LoaderFactory.productVariantByIdLoader(
      db,
      currentWarehouseId || "",
    );

    const discountLoader = LoaderFactory.discountByOrderItemLoader(db);

    const orderModifierLoader = LoaderFactory.orderModifierLoader(db);

    const orderStatusItemLoader = LoaderFactory.orderStatusItemLoader(db);

    const kitchenLogLoader = LoaderFactory.kitchenLogByOrderDetailLoader(db);

    const reservationLoader =
      LoaderFactory.cinemaReservationByOrderDetailLoader(db);

    await Promise.all(
      rows.map(async (x) => {
        if (!orderDetailMap[x.order_id!]) {
          orderDetailMap[x.order_id!] = [];
        }
        console.log(x.total_amount);
        orderDetailMap[x.order_id!].push({
          orderDetailId: x.order_detail_id || "",
          variantId: x.variant_id || "",
          title: `${x.title} (${x.option})`,
          sku: x.sku,
          barcode: x.barcode,
          qty: x.qty || 0,
          price: x.price || "0",
          discountAmount: x.discount_amount || "0",
          modiferAmount: x.modifer_amount || "0",
          totalAmount: x.total_amount || "0",
          productVariant: (await variantLoader.load(x.variant_id)) ?? undefined,
          discounts: await discountLoader.load(x.order_detail_id!),
          status: await orderStatusItemLoader.load(x.order_detail_id!),
          orderModifiers: await orderModifierLoader.load(x.order_detail_id!),
          reservation:
            (await reservationLoader.load(x.order_detail_id!)) || undefined,
          kitchenLogs: await kitchenLogLoader.load(x.order_detail_id!),
        });
      }),
    );

    return keys.map((key) => orderDetailMap[key] || []);
  });
}
