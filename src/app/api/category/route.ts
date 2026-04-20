import {
  Category,
  CategoryInput,
  createCategory,
  deleteCategory,
  getCategoryList,
  updateCategory,
} from "@/lib/server-functions/category/create-category";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const categoryShema = z.object({
  id: z.string().optional(),
  title: z.string(),
  imageUrl: z.string().nullable(),
  description: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === null ? undefined : val)),
  parentId: z.string().nullable(),
  printerId: z.string().nullable(),
  sortOrder: z.number().optional(),
  excludeFeeDelivery: z.boolean().optional(),
  markExtraFee: z.number().optional(),
});

const getCategoryQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .default("30")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, {
      message: "Limit must be between 1 and 100",
    }),
  offset: z
    .string()
    .optional()
    .default("0")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 0, {
      message: "Offset must be 0 or greater",
    }),
  s: z.string().optional().default(""),
  id: z.string().optional(),
  onlyBindedToPrinter: z.string().optional(),
  warehouse: z.string().optional(),
});

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ data: Category[]; total: number }>
>(async ({ db, searchParams, userAuth }) => {
  try {
    const validatedParams = getCategoryQuerySchema.parse(searchParams);
    const { categories, total } = await getCategoryList({
      db,
      limit: validatedParams.limit,
      offset: validatedParams.offset,
      search: validatedParams.s,
      id: validatedParams.id,
      onlyBindedToPrinter: validatedParams.onlyBindedToPrinter === "true",
      user: userAuth.admin!,
      warehouseId: validatedParams.warehouse,
    });

    return NextResponse.json(
      {
        success: true,
        result: {
          data: categories,
          total,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        },
        { status: 400 },
      );
    }
    throw error;
  }
});

export const POST = withAuthApi<unknown, CategoryInput, ResponseType<Category>>(
  async ({ db, body, logger, userAuth }) => {
    const categoryInput = categoryShema.parse(body);

    const result = await createCategory({
      db,
      input: categoryInput,
      user: userAuth.admin!,
    });

    logger.serverLog("category:create", {
      action: "create",
      table_name: "product_category",
      key: categoryInput.id!,
      content: result,
    });

    if (result) {
      return NextResponse.json(
        {
          success: true,
          result: result,
        },
        {
          status: 200,
        },
      );
    }

    return NextResponse.json(
      { error: "Failed to create category", success: false },
      { status: 500 },
    );
  },
);

export const PUT = withAuthApi<unknown, Category, ResponseType<Category>>(
  async ({ db, body, logger, userAuth }) => {
    const categoryInput = categoryShema.parse(body);

    const result = await updateCategory({
      db,
      input: categoryInput,
      user: userAuth.admin!,
    });

    logger.serverLog("category:update", {
      action: "delete",
      table_name: "product_category",
      key: categoryInput.id!,
      content: categoryInput,
    });

    if (result) {
      return NextResponse.json(
        {
          success: true,
          result: result,
        },
        {
          status: 200,
        },
      );
    }

    return NextResponse.json(
      { error: "Failed to update category", success: false },
      { status: 500 },
    );
  },
);

export const DELETE = withAuthApi<
  unknown,
  { id: string },
  ResponseType<{ id: string }>
>(async ({ db, body, logger }) => {
  const id = String(body?.id || "");

  if (!id) {
    return NextResponse.json(
      { error: "Missing category ID", success: false },
      { status: 400 },
    );
  }

  await deleteCategory({ db, id });

  logger.serverLog("category:delete", {
    action: "delete",
    table_name: "product_category",
    key: id,
  });

  return NextResponse.json({ id, success: true }, { status: 200 });
});
