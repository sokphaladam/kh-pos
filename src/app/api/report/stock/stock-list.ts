import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const filterSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  warehouseId: z.string().optional(),
  categoryIds: z.string().optional(),
  productId: z.string().optional(),
});

type filterSchemaType = z.infer<typeof filterSchema>;

export type StockReportRow = {
  type: "total" | "warehouse" | "category" | "detail";
  product_code: string;
  name: string;
  qty: number;
  cost: number;
  price: number;
};

type GroupedResult = Record<
  string,
  {
    warehouse_name: string;
    qty: number;
    cost: number;
    price: number;
    category: Record<
      string,
      {
        name: string;
        qty: number;
        cost: number;
        price: number;
        items: Record<
          string,
          {
            barcode: string;
            name: string;
            qty: number;
            cost: number;
            price: number;
          }
        >;
      }
    >;
  }
>;

export const getStockList = withAuthApi<
  unknown,
  unknown,
  ResponseType<StockReportRow[]>,
  filterSchemaType
>(async ({ searchParams, db }) => {
  // Validate the filter parameters
  const filter = filterSchema.parse(searchParams);

  const query = db
    .table("inventory")
    .innerJoin("product_variant", "inventory.variant_id", "product_variant.id")
    .innerJoin("product", "product_variant.product_id", "product.id")
    .innerJoin("warehouse_slot", "warehouse_slot.id", "inventory.slot_id")
    .innerJoin(
      "product_categories",
      "product.id",
      "product_categories.product_id"
    )
    .innerJoin("warehouse", "warehouse_slot.warehouse_id", "warehouse.id")
    .innerJoin(
      "product_category",
      "product_categories.category_id",
      "product_category.id"
    );

  if (filter.warehouseId) {
    query.whereIn("warehouse_slot.warehouse_id", filter.warehouseId.split(","));
  }

  if (filter.categoryIds) {
    query.whereIn(
      "product_categories.category_id",
      filter.categoryIds.split(",")
    );
  }

  if (filter.productId) {
    query.where("product.id", filter.productId);
  }

  const result = await query
    .select(
      "product_variant.barcode",
      db.raw(
        "CONCAT(product.title, ' - ', product_variant.name) as variant_name"
      ),
      "inventory.qty",
      "product_variant.purchased_cost",
      "product_variant.price",
      "warehouse.name as warehouse_name",
      "product_category.title as category_name"
    )
    .orderBy("product_category.sort_order", "asc");

  const groupResult: GroupedResult = result.reduce((acc, item) => {
    const {
      warehouse_name,
      category_name,
      variant_name,
      qty,
      purchased_cost,
      price,
    } = item;

    const itemCost = Number(purchased_cost) * qty;
    const itemPrice = Number(price) * qty;

    // 1. Warehouse
    if (!acc[warehouse_name]) {
      acc[warehouse_name] = {
        warehouse_name,
        qty: 0,
        cost: 0,
        price: 0,
        category: {},
      };
    }

    const warehouse = acc[warehouse_name];
    warehouse.qty += qty;
    warehouse.cost += itemCost;
    warehouse.price += itemPrice;

    // 2. Category
    if (!warehouse.category[category_name]) {
      warehouse.category[category_name] = {
        name: category_name,
        qty: 0,
        cost: 0,
        price: 0,
        items: {},
      };
    }

    const category = warehouse.category[category_name];
    category.qty += qty;
    category.cost += itemCost;
    category.price += itemPrice;

    // 3. Item
    if (!category.items[variant_name]) {
      category.items[variant_name] = {
        barcode: item.barcode,
        name: variant_name,
        qty: 0,
        cost: Number(purchased_cost),
        price: Number(price),
      };
    }

    const product = category.items[variant_name];
    product.qty += qty;

    return acc;
  }, {});

  // TODO: Implement stock list logic using filters
  const formattedResult: StockReportRow[] = [];

  const total = {
    qty: 0,
    cost: 0,
    price: 0,
  };

  result.forEach((item) => {
    total.qty += Number(item.qty);
    total.cost += Number(item.purchased_cost) * Number(item.qty);
    total.price += Number(item.price) * Number(item.qty);
  });

  formattedResult.push({
    type: "total",
    product_code: "",
    name: "",
    qty: total.qty,
    cost: total.cost,
    price: total.price,
  });

  Object.values(groupResult).forEach((warehouse) => {
    formattedResult.push({
      type: "warehouse",
      product_code: "",
      name: `Branch: ${warehouse.warehouse_name}`,
      qty: warehouse.qty,
      cost: warehouse.cost,
      price: warehouse.price,
    });

    Object.values(warehouse.category).forEach((category) => {
      formattedResult.push({
        type: "category",
        product_code: "",
        name: `Category: ${category.name}`,
        qty: category.qty,
        cost: category.cost,
        price: category.price,
      });

      Object.values(category.items).forEach((product) => {
        formattedResult.push({
          type: "detail",
          product_code: product.barcode,
          name: product.name,
          qty: product.qty,
          cost: product.cost,
          price: product.price,
        });
      });
    });
  });

  return NextResponse.json(
    { success: true, result: formattedResult, error: "" },
    { status: 200 }
  );
});
