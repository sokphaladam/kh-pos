import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const filterSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  warehouseId: z.string().optional(),
  groupBy: z.enum(["product", "time"]).default("product"),
  userIds: z.string().optional(),
  categoryIds: z.string().optional(),
  productId: z.string().optional(),
});

type filterSchemaType = z.infer<typeof filterSchema>;

export type SaleByCategoryReportItem = {
  orderDetailId: string;
  totalAmount: number;
  discountAmount: number;
  modifierAmount: number;
  paidAt: string;
  variantId: string;
  barcode: string;
  variantName: string;
  categoryId: string;
  categoryName: string;
  qty: number;
  price: number;
  cost: number;
  revenue: number;
  profit: number;
  orderedAt?: string;
};

export type SaleByCategoryReportRow = {
  type: "header" | "total" | "category" | "detail";
  productCode?: string;
  name?: string;
  totalQty: number;
  supplyPrice: number;
  totalPrice: number;
  modifier: number;
  discount: number;
  revenue: number;
  profit: number;
  // For detail rows
  orderDetailId?: string;
  categoryId?: string;
  categoryName?: string;
  orderedAt?: string;
};

export const getSaleByCategoryReport = withAuthApi<
  unknown,
  unknown,
  ResponseType<SaleByCategoryReportRow[]>,
  filterSchemaType
>(async ({ db, userAuth, searchParams }) => {
  const user = userAuth.admin!;

  const {
    startDate,
    endDate,
    warehouseId,
    groupBy,
    userIds,
    categoryIds,
    productId,
  } = filterSchema.parse(searchParams);
  const finalWarehouseId = warehouseId || user.currentWarehouseId;

  const allOrdersSubquery = db("customer_order_detail")
    .innerJoin(
      "customer_order",
      "customer_order_detail.order_id",
      "customer_order.order_id",
    )
    .innerJoin(
      "product_variant",
      "customer_order_detail.variant_id",
      "product_variant.id",
    )
    .innerJoin("product", "product_variant.product_id", "product.id")
    .leftJoin(
      "product_categories",
      "product.id",
      "product_categories.product_id",
    )
    .leftJoin(
      "product_category",
      "product_categories.category_id",
      "product_category.id",
    )
    .whereIn("customer_order.warehouse_id", finalWarehouseId?.split(",") || [])
    .where({ "customer_order.order_status": "COMPLETED" })
    .whereBetween("customer_order.paid_at", [startDate, endDate])
    .select([
      "customer_order_detail.*",
      "customer_order_detail.created_at as ordered_at",
      "customer_order.paid_at",
      "product_variant.barcode",
      db.raw(
        "CONCAT(product.title, ' - ', product_variant.name) as variant_name",
      ),
      db.raw(
        "coalesce(product_variant.purchased_cost, 0) * coalesce(customer_order_detail.qty, 0) as purchase_cost",
      ),
      "product_category.id as category_id",
      "product_category.title as category_name",
      "product_category.sort_order",
    ]);

  if (userIds) {
    allOrdersSubquery.whereIn("customer_order.created_by", userIds.split(","));
  }

  if (categoryIds) {
    allOrdersSubquery.whereIn("product_category.id", categoryIds.split(","));
  }

  if (productId) {
    allOrdersSubquery.where("product_variant.product_id", productId);
  }

  const raw = await db
    .with("all_orders", allOrdersSubquery)
    .from("all_orders")
    .leftJoin(
      "fulfilment_detail",
      "all_orders.order_detail_id",
      "fulfilment_detail.order_detail_id",
    )
    .leftJoin(
      "inventory_transactions",
      "inventory_transactions.id",
      "fulfilment_detail.transaction_id",
    )
    .leftJoin("product_lot", "product_lot.id", "inventory_transactions.lot_id")
    .select([
      "all_orders.order_detail_id",
      "all_orders.total_amount", // total_amount = price * qty - discount + modifier_amount
      "all_orders.discount_amount",
      "all_orders.modifer_amount",
      "all_orders.qty",
      "all_orders.price",
      "all_orders.variant_id",
      "all_orders.barcode",
      "all_orders.variant_name",
      "all_orders.category_id",
      "all_orders.category_name",
      "all_orders.purchase_cost", // it is the original purchase_cost * qty from table product_variant
      db.raw("coalesce(??, 0) * coalesce(??, 0) as cost", [
        "inventory_transactions.qty",
        "product_lot.cost_per_unit",
      ]),
      db.raw("DATE_FORMAT(all_orders.paid_at, '%Y-%m-%d') as paid_at"),
      db.raw(
        "DATE_FORMAT(all_orders.ordered_at, '%Y-%m-%d %H:%i') as ordered_at",
      ),
      "all_orders.sort_order",
    ])
    .orderBy("all_orders.sort_order", "asc")
    .orderBy("category_name", "asc")
    .orderBy("all_orders.ordered_at", "asc");

  let result: SaleByCategoryReportItem[] = raw.map((x) => {
    const cost = x.cost > 0 ? x.cost : x.purchase_cost;
    const total =
      Number(x.price) * Number(x.qty) +
      Number(x.modifer_amount) -
      Number(x.discount_amount);

    const revenue =
      x.discount_amount && total !== x.total_amount ? total : x.total_amount;

    const profit = revenue - cost;

    return {
      orderDetailId: x.order_detail_id,
      totalAmount: Number(x.price) * Number(x.qty),
      discountAmount: Number(x.discount_amount),
      modifierAmount: Number(x.modifer_amount),
      paidAt: x.paid_at,
      variantId: x.variant_id,
      barcode: x.barcode,
      variantName: x.variant_name,
      categoryId: x.category_id,
      categoryName: x.category_name,
      qty: x.qty,
      price: x.price,
      cost: Number(cost || 0),
      revenue: Number(revenue || 0),
      profit: Number(profit || 0),
      orderedAt: x.ordered_at,
    };
  });
  // Group by variantId to sum up quantities and amounts (when groupBy is "product")
  if (groupBy === "product") {
    const variantMap = new Map<string, SaleByCategoryReportItem>();
    result.forEach((item) => {
      if (variantMap.has(item.variantId)) {
        const existing = variantMap.get(item.variantId)!;
        existing.qty += item.qty;
        existing.totalAmount += item.totalAmount;
        existing.discountAmount += item.discountAmount;
        existing.modifierAmount += item.modifierAmount;
        existing.cost += item.cost;
        existing.revenue += item.revenue;
        existing.profit += item.profit;
      } else {
        variantMap.set(item.variantId, { ...item });
      }
    });

    result = Array.from(variantMap.values());
  }

  // Always group by category
  const groupedByCategory = result.reduce(
    (acc, item) => {
      if (!acc[item.categoryId]) {
        acc[item.categoryId] = {
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          items: [],
        };
      }
      acc[item.categoryId].items.push(item);
      return acc;
    },
    {} as Record<
      string,
      {
        categoryId: string;
        categoryName: string;
        items: SaleByCategoryReportItem[];
      }
    >,
  );

  // Calculate totals
  const grandTotal = {
    totalQty: 0,
    supplyPrice: 0,
    totalPrice: 0,
    modifier: 0,
    discount: 0,
    revenue: 0,
    profit: 0,
  };

  result.forEach((item) => {
    grandTotal.totalQty += item.qty;
    grandTotal.supplyPrice += item.cost;
    grandTotal.totalPrice += item.totalAmount;
    grandTotal.modifier += item.modifierAmount;
    grandTotal.discount += item.discountAmount;
    grandTotal.revenue += item.revenue;
    grandTotal.profit += item.profit;
  });

  // Build the formatted result
  const formattedResult: SaleByCategoryReportRow[] = [];

  // Add total row first
  formattedResult.push({
    type: "total",
    productCode: "",
    name: "",
    totalQty: grandTotal.totalQty,
    supplyPrice: grandTotal.supplyPrice,
    totalPrice: grandTotal.totalPrice,
    modifier: grandTotal.modifier,
    discount: grandTotal.discount,
    revenue: grandTotal.revenue,
    profit: grandTotal.profit,
  });

  // Add category groups with details
  Object.values(groupedByCategory).forEach((category) => {
    // Calculate category totals
    const categoryTotal = {
      totalQty: 0,
      supplyPrice: 0,
      totalPrice: 0,
      modifier: 0,
      discount: 0,
      revenue: 0,
      profit: 0,
    };

    category.items.forEach((item) => {
      categoryTotal.totalQty += item.qty;
      categoryTotal.supplyPrice += item.cost;
      categoryTotal.totalPrice += item.totalAmount;
      categoryTotal.modifier += item.modifierAmount;
      categoryTotal.discount += item.discountAmount;
      categoryTotal.revenue += item.revenue;
      categoryTotal.profit += item.profit;
    });

    // Add category summary row
    formattedResult.push({
      type: "category",
      productCode: "",
      name: `Category: ${category.categoryName}`,
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      totalQty: categoryTotal.totalQty,
      supplyPrice: categoryTotal.supplyPrice,
      totalPrice: categoryTotal.totalPrice,
      modifier: categoryTotal.modifier,
      discount: categoryTotal.discount,
      revenue: categoryTotal.revenue,
      profit: categoryTotal.profit,
    });

    // Add detail rows for this category
    category.items.forEach((item) => {
      formattedResult.push({
        type: "detail",
        productCode: item.barcode,
        name: item.variantName,
        orderDetailId: item.orderDetailId,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        totalQty: item.qty,
        supplyPrice: item.cost,
        totalPrice: item.totalAmount,
        modifier: item.modifierAmount,
        discount: item.discountAmount,
        revenue: item.revenue,
        profit: item.profit,
        orderedAt: groupBy === "time" ? item.orderedAt : undefined,
      });
    });
  });

  return NextResponse.json(
    { success: true, result: formattedResult, error: "" },
    { status: 200 },
  );
});
