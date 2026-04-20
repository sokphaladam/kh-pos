import {
  SupplierProductPrice,
  SupplierProductPriceService,
} from "@/classes/supplier-product-price";
import { table_supplier_product_prices } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType, SupplierProductPriceInput } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const inputSupplierProductPriceSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string(),
  productVariantId: z.string(),
  price: z.number(),
  effectDate: z.string().optional(),
  scheduledPrice: z.number().optional(),
  scheduledAt: z.string().optional(),
});

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ data: SupplierProductPrice[]; total: number }>
>(async ({ db, req, userAuth }) => {
  const user = userAuth.admin!;
  try {
    const params = req.nextUrl.searchParams;
    const supplierId = params.get("supplierId") ?? "";
    const productVariantId = params.get("productVariantId") ?? "";
    const search = params.get("search") ?? "";
    const orderByPrice = params.get("orderByPrice") as "asc" | "desc" | null;
    const limit = parseInt(params.get("limit") || "30", 30);
    const offset = parseInt(params.get("offset") || "0", 0);

    const supplierProductPrice = new SupplierProductPriceService(db, user);

    const result = await supplierProductPrice.getSupplierProductPrices(
      supplierId,
      productVariantId,
      orderByPrice ? { price: orderByPrice } : undefined,
      offset,
      limit,
      search
    );

    return NextResponse.json({ result, success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: String(error), success: false },
      {
        status: 500,
      }
    );
  }
});

export const POST = withAuthApi<
  unknown,
  SupplierProductPriceInput,
  ResponseType<{ data: SupplierProductPriceInput[] }>
>(async ({ db, body, userAuth }) => {
  const user = userAuth.admin!;
  try {
    const input: SupplierProductPriceInput[] = z
      .array(inputSupplierProductPriceSchema)
      .parse(body);

    const supplierProductPrice = new SupplierProductPriceService(db, user);

    const create = await supplierProductPrice.createSupplierProductPrices(
      input.map((x) => {
        return {
          productVariantId: x.productVariantId,
          supplierId: x.supplierId,
          effectDate: Formatter.getNowDateTime(),
          price: x.price,
        };
      })
    );

    return NextResponse.json(
      {
        success: create ? true : false,
        result: { data: input },
      },
      {
        status: create ? 200 : 500,
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: String(error), success: false },
      {
        status: 500,
      }
    );
  }
});

export const PUT = withAuthApi<
  unknown,
  SupplierProductPriceInput,
  ResponseType<{ data: SupplierProductPriceInput }>
>(async ({ db, body, userAuth }) => {
  const user = userAuth.admin!;
  try {
    const input: SupplierProductPriceInput =
      inputSupplierProductPriceSchema.parse(body);

    const supplierProductPrice = new SupplierProductPriceService(db, user);

    const update = await supplierProductPrice.updateSupplierProductPrice([
      {
        productVariantId: input.productVariantId,
        supplierId: input.supplierId,
        effectDate: Formatter.getNowDateTime(),
        price: input.price,
        id: input.id ?? "",
        scheduledAt: input.scheduledAt,
        scheduledPrice: input.scheduledPrice,
      },
    ]);

    return NextResponse.json(
      {
        success: update ? true : false,
        result: { data: input },
      },
      {
        status: update ? 200 : 500,
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: String(error), success: false },
      {
        status: 500,
      }
    );
  }
});

export const DELETE = withAuthApi<
  unknown,
  { id: string },
  ResponseType<{ message: string }>
>(async ({ db, body, logger, userAuth }) => {
  const user = userAuth.admin!;
  try {
    const id = String(body?.id || "");
    await db
      .table<table_supplier_product_prices>("supplier_product_prices")
      .where("id", id)
      .update({ deleted_at: Formatter.getNowDateTime() });

    const supplierProductPrice = new SupplierProductPriceService(db, user);

    const remove = await supplierProductPrice.deleteSupplierProductPrice([id]);

    logger.serverLog("supplier_product_prices:delete", {
      action: "delete",
      table_name: "supplier_product_prices",
      key: id,
    });

    return NextResponse.json(
      {
        success: remove ? true : false,
        result: { message: "Delete supplier product price #" + id },
      },
      {
        status: remove ? 200 : 500,
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: String(error), success: false },
      {
        status: 500,
      }
    );
  }
});
