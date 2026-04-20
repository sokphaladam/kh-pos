import { Category } from "@/lib/server-functions/category/create-category";
import withDatabaseApi from "@/lib/server-functions/with-database-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const categorySchema = z.object({
  warehouse: z.string().optional(),
  onlyBindedToPrinter: z.string().optional(),
});

export const getCategoryMenu = withDatabaseApi<
  unknown,
  unknown,
  ResponseType<{ data: Category[]; total: number }>
>(async ({ db, searchParams }) => {
  const validatedParams = categorySchema.parse(searchParams);
  const warehouseId = validatedParams.warehouse;
  const query = db
    .table("product_category")
    .innerJoin(
      "product_categories",
      "product_category.id",
      "product_categories.category_id",
    )
    .leftJoin(
      "warehouse_category_printer",
      "product_category.id",
      "warehouse_category_printer.category_id",
    )
    .leftJoin("product", "product.id", "product_categories.product_id")
    .orderBy([
      { column: "sort_order", order: "asc" },
      { column: "title", order: "asc" },
    ])
    .groupBy("product_categories.category_id");

  if (warehouseId && validatedParams.onlyBindedToPrinter === "true") {
    query
      .where("warehouse_category_printer.warehouse_id", warehouseId)
      .whereNotNull("warehouse_category_printer.printer_id");
  }

  const items = await query
    .select(
      db.raw("COUNT(product_categories.id) as product_count"),
      db.raw("SUM(IF(product.is_for_sale = 1, 1 , 0)) as for_sale_count"),
      "product_category.*",
    )
    .distinct()
    .whereNull("delete_date");

  const categories: Category[] = items.map((raw) => {
    return {
      id: raw.id,
      title: raw.title,
      imageUrl: raw.image_url,
      description: raw.description,
      parentId: raw.parent_id,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      printerId: null,
      printer: undefined,
      productCount: Number(raw.product_count) || 0,
      forSaleCount: Number(raw.for_sale_count) || 0,
    };
  });

  const rows =
    validatedParams.onlyBindedToPrinter === "true"
      ? categories.filter((cat) => (cat.forSaleCount || 0) > 0)
      : categories;

  return NextResponse.json(
    {
      success: true,
      result: {
        data: rows,
        total: rows.length,
      },
    },
    { status: 200 },
  );
});
