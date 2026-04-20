import {
  PurchaseOrderService,
  SupplierPurchaseOrder,
  SupplierPurchaseOrderInput,
} from "@/classes/purchase-order-service";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { purchaseOrderSchema, purchaseOrderFilterSchema } from "./type";

export const POST = withAuthApi<
  unknown,
  SupplierPurchaseOrderInput,
  ResponseType<SupplierPurchaseOrder>
>(async ({ db, body, userAuth }) => {
  const user = userAuth.admin!;
  if (!body?.warehouseId) {
    return NextResponse.json(
      { success: false, error: "Warehouse not found" },
      { status: 404 }
    );
  }

  if (!body?.supplierId) {
    return NextResponse.json(
      { success: false, error: "Supplier not found" },
      { status: 404 }
    );
  }

  const input = purchaseOrderSchema.parse(body);

  if (!input.items || input.items.length === 0) {
    return NextResponse.json({
      success: false,
      error: "Purchase Order items are required",
    });
  }

  const result = await db.transaction(async (trx) => {
    const purchaseOrderService = new PurchaseOrderService(trx, user!);
    return await purchaseOrderService.createPurchaseOrder(input);
  });

  return NextResponse.json({ success: true, result }, { status: 200 });
});

export const GET = withAuthApi<
  unknown,
  unknown,
  ResponseType<SupplierPurchaseOrder[]>
>(async ({ db, searchParams, userAuth }) => {
  const params = purchaseOrderFilterSchema.parse(searchParams);
  const result = await db.transaction(async (trx) => {
    const purchaseOrderService = new PurchaseOrderService(trx, userAuth.admin!);
    return await purchaseOrderService.getAllPurchaseOrders(params);
  });

  return NextResponse.json({ success: true, result }, { status: 200 });
});

export const PUT = withAuthApi<
  unknown,
  SupplierPurchaseOrderInput,
  ResponseType<SupplierPurchaseOrderInput | undefined>
>(async ({ db, body, userAuth }) => {
  const input = purchaseOrderSchema.parse(body);

  if (!input.items || input.items.length === 0) {
    return NextResponse.json({
      success: false,
      error: "Purchase Order items are required",
    });
  }

  const result = await db.transaction(async (trx) => {
    const purchaseOrderService = new PurchaseOrderService(trx, userAuth.admin!);
    return await purchaseOrderService.updatePurchaseOrder(input);
  });

  return NextResponse.json(
    { success: result ? true : false, result },
    { status: 200 }
  );
});

export const DELETE = withAuthApi<
  unknown,
  { id: string },
  ResponseType<boolean>
>(async ({ db, body, userAuth }) => {
  const id = body?.id;

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Purchase Order ID is required" },
      { status: 400 }
    );
  }

  const result = await db.transaction(async (trx) => {
    const purchaseOrderService = new PurchaseOrderService(trx, userAuth.admin!);
    return await purchaseOrderService.deletePurchaseOrder(id);
  });

  return NextResponse.json({ success: true, result }, { status: 200 });
});
