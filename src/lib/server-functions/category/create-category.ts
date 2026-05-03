import { Printer, PrintServer } from "@/classes/print-server";
import { table_product_category } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { Knex } from "knex";
import { v4 } from "uuid";
import { UserInfo } from "../get-auth-from-token";

export interface CategoryInput {
  title: string;
  description?: string;
  imageUrl: string | null;
  parentId: string | null;
  createdAt?: string;
  updatedAt?: string;
  printerId?: string | null;
  sortOrder?: number;
  excludeFeeDelivery?: boolean;
  markExtraFee?: number;
}

export interface Category extends CategoryInput {
  id: string;
  printer?: Printer;
  productCount?: number;
  forSaleCount?: number;
}

export async function createCategory({
  db,
  input,
  user,
}: {
  db: Knex;
  input: CategoryInput;
  user: UserInfo;
}) {
  const now = Formatter.getNowDateTime();
  const categoryId = input.title === "movies" ? "movies-category-id" : v4();

  const exists: table_product_category = await db
    .table<table_product_category>("product_category")
    .where({ id: categoryId })
    .first();

  if (!!exists && !!exists.delete_date) {
    await db
      .table<table_product_category>("product_category")
      .where({ id: categoryId })
      .update({ delete_date: null });

    return {
      id: categoryId,
      ...input,
    };
  }

  await db.table<table_product_category>("product_category").insert({
    id: categoryId,
    title: input.title,
    description: input.description ?? "",
    parent_id: input.parentId,
    created_at: now,
    updated_at: now,
    image_url: input.imageUrl,
    sort_order: input.sortOrder || 0,
    exclude_fee_delivery: input.excludeFeeDelivery ? 1 : 0,
    mark_extra_fee: String(input.markExtraFee ?? 0),
  });

  if (input.printerId) {
    await db.table("warehouse_category_printer").insert({
      warehouse_id: user.currentWarehouseId,
      category_id: categoryId,
      printer_id: input.printerId ?? null,
    });
  }

  return {
    id: categoryId,
    ...input,
  };
}

export async function updateCategory({
  db,
  input,
  user,
}: {
  db: Knex;
  input: Partial<Category>;
  user: UserInfo;
}) {
  const now = Formatter.getNowDateTime();

  const updatedFields = {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && {
      description: input.description ?? "",
    }),
    ...(input.parentId !== undefined && { parent_id: input.parentId }),
    ...(input.imageUrl !== undefined && { image_url: input.imageUrl }),
    updated_at: now,
    sort_order: input.sortOrder ?? 0,
    exclude_fee_delivery: (input.excludeFeeDelivery ?? false) ? 1 : 0,
    mark_extra_fee: String(input.markExtraFee ?? 0),
  };

  await db
    .table<table_product_category>("product_category")
    .where({ id: input.id })
    .update(updatedFields);

  if (input.printerId) {
    const existing = await db
      .table("warehouse_category_printer")
      .where({ warehouse_id: user.currentWarehouseId, category_id: input.id })
      .first();
    if (existing) {
      await db
        .table("warehouse_category_printer")
        .where({ warehouse_id: user.currentWarehouseId, category_id: input.id })
        .update({
          printer_id: input.printerId ?? null,
        });
    } else {
      await db.table("warehouse_category_printer").insert({
        warehouse_id: user.currentWarehouseId,
        category_id: input.id,
        printer_id: input.printerId ?? null,
      });
    }
  } else {
    // If printerId is null, remove any existing binding
    await db
      .table("warehouse_category_printer")
      .where({ warehouse_id: user.currentWarehouseId, category_id: input.id })
      .delete();
  }

  return input as Category;
}

export async function getCategoryList({
  db,
  limit,
  offset,
  search,
  id,
  onlyBindedToPrinter = false,
  user,
  warehouseId,
}: {
  db: Knex;
  limit: number;
  offset: number;
  search?: string;
  id?: string;
  onlyBindedToPrinter?: boolean;
  user: UserInfo;
  warehouseId?: string;
}) {
  const raws = db
    .table<table_product_category>("product_category")
    .whereNull("product_category.delete_date")
    .orderBy([
      { column: "product_category.sort_order", order: "asc" },
      { column: "product_category.title", order: "asc" },
    ]);

  if (search && search.trim() !== "") {
    raws.where(function () {
      this.where("product_category.title", "LIKE", `%${search}%`).orWhere(
        "product_category.description",
        "LIKE",
        `%${search}%`,
      );
    });
  }
  if (id) {
    raws.where({ id });
  }
  if (onlyBindedToPrinter) {
    raws
      .innerJoin(
        "warehouse_category_printer",
        "warehouse_category_printer.category_id",
        "product_category.id",
      )
      .whereNotNull("warehouse_category_printer.printer_id")
      .groupBy("product_category.id");

    if (warehouseId) {
      raws.where("warehouse_category_printer.warehouse_id", warehouseId);
    } else {
      raws.where(
        "warehouse_category_printer.warehouse_id",
        user.currentWarehouseId,
      );
    }
  }

  const { total } = await raws
    .clone()
    .count("* as total")
    .first<{ total: number }>();

  const query = raws
    .clone()
    .select("product_category.*")
    .limit(limit)
    .offset(offset);

  const items = await query;

  const itemsCount = await db
    .table("product_category")
    .select(
      db.raw("COUNT(product_categories.id) as product_count"),
      db.raw("SUM(IF(product.is_for_sale = 1, 1 , 0)) as for_sale_count"),
      "product_category.id",
    )
    .rightJoin(
      "product_categories",
      "product_categories.category_id",
      "product_category.id",
    )
    .leftJoin("product", "product.id", "product_categories.product_id")
    .groupBy("product_categories.category_id")
    .where({
      "product.deleted_at": null,
    })
    .whereIn(
      "product_category.id",
      items.map((i) => i.id),
    );

  const warehouse_printer = await db
    .table("warehouse_category_printer")
    .select()
    .where({ warehouse_id: user.currentWarehouseId });
  const printers = await new PrintServer(db, user).getAllPrinters();

  const categories: Category[] = items.map((raw) => {
    const printer = warehouse_printer.find((wp) => wp.category_id === raw.id);
    const productCount =
      itemsCount.find((ic) => ic.id === raw.id)?.product_count || 0;
    const forSaleCount =
      itemsCount.find((ic) => ic.id === raw.id)?.for_sale_count || 0;
    return {
      id: raw.id,
      title: raw.title,
      imageUrl: raw.image_url,
      description: raw.description,
      parentId: raw.parent_id,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      printerId: printer ? printer.printer_id : null,
      printer: printer
        ? printers.find((p) => p.id === printer.printer_id) || undefined
        : undefined,
      sortOrder: raw.sort_order,
      excludeFeeDelivery: raw.exclude_fee_delivery === 1,
      markExtraFee: Number(raw.mark_extra_fee),
      productCount: Number(productCount) || 0,
      forSaleCount: Number(forSaleCount) || 0,
    };
  });

  const rows = onlyBindedToPrinter
    ? categories.filter((cat) => (cat.forSaleCount || 0) > 0)
    : categories;

  return { categories: rows, total: onlyBindedToPrinter ? rows.length : total };
}

export async function getCategoryById({
  db,
  id,
  user,
}: {
  db: Knex;
  id: string;
  user: UserInfo;
}) {
  const raw = await db
    .table<table_product_category>("product_category")
    .leftJoin(
      "warehouse_category_printer",
      "warehouse_category_printer.category_id",
      "product_category.id",
    )
    .select(
      "product_category.*",
      "warehouse_category_printer.printer_id as printer",
    )
    .where({
      id,
      "warehouse_category_printer.warehouse_id": user.currentWarehouseId,
    })
    .first();

  const printers = await new PrintServer(db, user).getAllPrinters();

  const category: Category = {
    id: raw?.id,
    title: raw?.title,
    description: raw?.description,
    parentId: raw?.parent_id,
    createdAt: raw?.created_at,
    updatedAt: raw?.updated_at,
    imageUrl: raw?.image_url,
    printerId: raw?.printer,
    printer: printers.find((p) => p.id === raw?.printer) || undefined,
    sortOrder: raw?.sort_order,
  };
  return category;
}

export async function deleteCategory({ db, id }: { db: Knex; id: string }) {
  const now = Formatter.getNowDateTime();
  await db
    .table<table_product_category>("product_category")
    .where({ id })
    .update({ delete_date: now });

  return id;
}
