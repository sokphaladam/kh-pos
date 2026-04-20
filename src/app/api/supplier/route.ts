import {
  createSupplier,
  deleteSupplier,
  getSupplierList,
  Supplier,
  SupplierInput,
  updateSupplier,
} from "@/lib/server-functions/supplier";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const getSupplierQuerySchema = z.object({
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
});

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ data: Supplier[]; total: number }>
>(async ({ db, searchParams }) => {
  try {
    const validatedParams = getSupplierQuerySchema.parse(searchParams);

    const { suppliers, total } = await getSupplierList({
      db,
      limit: validatedParams.limit,
      offset: validatedParams.offset,
      search: validatedParams.s,
    });

    return NextResponse.json(
      {
        success: true,
        result: {
          data: suppliers,
          total,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        },
        { status: 400 }
      );
    }
    throw error;
  }
});

const supplierShema = z.object({
  id: z.string().optional(),
  name: z.string(),
  contactName: z.string(),
  contactPhone: z.string(),
  contactEmail: z.string(),
  address: z.string(),
  note: z.string().optional(),
  isConsignment: z.boolean().optional(),
});

export const POST = withAuthApi<unknown, SupplierInput, Supplier>(
  async ({ db, body, logger }) => {
    const input = supplierShema.parse(body);

    const r = await createSupplier({ db, input });

    logger.serverLog("supplier:create", {
      action: "create",
      table_name: "supplier",
      key: r.id,
      content: input,
    });

    const supplier: Supplier = {
      id: r.id,
      name: r.name,
      contactName: r.contact_name,
      contactPhone: r.contact_phone,
      contactEmail: r.contact_email,
      address: r.address,
      note: r.note,
      createdAt: r.created_at,
    };

    return NextResponse.json(supplier, {
      status: 200,
    });
  }
);

export const PUT = withAuthApi<
  unknown,
  SupplierInput,
  Supplier | { error: string }
>(async ({ db, body, logger }) => {
  const input = supplierShema.partial().parse(body);

  if (!input.id) {
    return NextResponse.json({ error: "Missing supplier ID" }, { status: 400 });
  }

  const r = await updateSupplier({ db, input });
  logger.serverLog("supplier:update", {
    action: "update",
    table_name: "supplier",
    key: input.id,
    content: r,
  });

  const supplier: Supplier = {
    id: input.id,
    name: r.name ?? "",
    contactName: r.contact_name ?? "",
    contactPhone: r.contact_phone ?? "",
    contactEmail: r.contact_email ?? "",
    address: r.address ?? "",
    note: r.note,
    updatedAt: r.updated_at ?? "",
  };

  return NextResponse.json(supplier, {
    status: 200,
  });
});

export const DELETE = withAuthApi<
  unknown,
  { id: string },
  ResponseType<{ id: string }>
>(async ({ db, logger, body }) => {
  const id = String(body?.id || "");

  if (!id) {
    return NextResponse.json(
      { error: "Missing supplier ID", success: false },
      { status: 400 }
    );
  }

  await deleteSupplier({ db, id });
  logger.serverLog("supplier:delete", {
    action: "delete",
    table_name: "supplier",
    key: id,
  });

  return NextResponse.json(
    { id, success: true },
    {
      status: 200,
    }
  );
});
