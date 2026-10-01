import { OrderDetail } from "@/classes/order";
import { table_customer_order_detail } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";

export function createOrderDetailLoader(
  db: Knex,
  currentWarehouseId?: string,
): DataLoader<string, OrderDetail[]> {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_customer_order_detail[] = await db
      .table<table_customer_order_detail>("customer_order_detail")
      .whereIn("order_id", keys)
      .orderBy("created_at");

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

    // Load all relations in parallel so each loader batches into a single
    // query round, instead of waiting on them one after another.
    const details: (OrderDetail | null)[] = await Promise.all(
      rows.map(async (x) => {
        const [
          productVariant,
          discounts,
          status,
          orderModifiers,
          reservation,
          kitchenLogs,
        ] = await Promise.all([
          variantLoader.load(x.variant_id!),
          discountLoader.load(x.order_detail_id!),
          orderStatusItemLoader.load(x.order_detail_id!),
          orderModifierLoader.load(x.order_detail_id!),
          reservationLoader.load(x.order_detail_id!),
          kitchenLogLoader.load(x.order_detail_id!),
        ]);
        // Same as the previous inner join on product_variant / product:
        // skip items whose variant or product no longer exists.
        if (!productVariant || !productVariant.basicProduct) return null;
        const detail: OrderDetail = {
          orderDetailId: x.order_detail_id || "",
          variantId: x.variant_id || "",
          title: `${productVariant.basicProduct.title} (${productVariant.name})`,
          sku: String(productVariant.sku ?? ""),
          barcode: productVariant.barcode,
          qty: x.qty || 0,
          price: x.price || "0",
          discountAmount: x.discount_amount || "0",
          modiferAmount: x.modifer_amount || "0",
          totalAmount: x.total_amount || "0",
          createdAt: Formatter.toDbDateTime(x.created_at),
          productVariant,
          discounts,
          status,
          orderModifiers,
          reservation: reservation || undefined,
          kitchenLogs,
        };
        return detail;
      }),
    );

    // Group after loading so items keep their created_at order
    rows.forEach((x, i) => {
      const detail = details[i];
      if (!detail) return;
      if (!orderDetailMap[x.order_id!]) {
        orderDetailMap[x.order_id!] = [];
      }
      orderDetailMap[x.order_id!].push(detail);
    });

    return keys.map((key) => orderDetailMap[key] || []);
  });
}
