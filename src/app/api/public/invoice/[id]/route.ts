import { Order, OrderDetail, OrderService } from "@/classes/order";
import { Payment } from "@/classes/payment";
import { table_setting } from "@/generated/tables";
import { table_warehouse } from "@/generated/tables/table_warehouse";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import withDatabaseApi from "@/lib/server-functions/with-database-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export type PublicInvoiceResult = {
  orderInfo: Order;
  orderDetail: OrderDetail[];
  payments: Payment[];
  warehouse: {
    name: string;
    address: string | null;
    phone: string | null;
    image: string | null;
  } | null;
  settings: table_setting[];
};

// Public, read-only endpoint. Performs SELECT queries only – it never mutates
// any data. Used by the customer-facing invoice QR page.
export const GET = withDatabaseApi<
  { id: string },
  unknown,
  ResponseType<PublicInvoiceResult>,
  { warehouse?: string }
>(async ({ db, params, searchParams }) => {
  const warehouseId = searchParams?.warehouse;

  if (!params?.id || !warehouseId) {
    return NextResponse.json(
      { success: false, message: "Order ID and warehouse are required" },
      { status: 400 },
    );
  }

  const orderService = new OrderService(db);
  const detail = await orderService.getOrderDetail(params.id, {
    currentWarehouseId: warehouseId,
  } as unknown as UserInfo);

  const warehouse = await db<table_warehouse>("warehouse")
    .where("id", warehouseId)
    .where("is_deleted", 0)
    .first();

  const settings = await db<table_setting>("setting")
    .where({ warehouse: null })
    .orWhere("warehouse", warehouseId)
    .select();

  // The INVOICE_RECEIPT setting is a comma-joined list where index 2 is the
  // logo URL. The customer-facing invoice does not show the logo, so blank it.
  const receiptRow = settings.find((s) => s.option === "INVOICE_RECEIPT");
  if (receiptRow?.value) {
    const parts = receiptRow.value.split(",");
    if (parts.length > 2) {
      parts[2] = "";
      receiptRow.value = parts.join(",");
    }
  }

  return NextResponse.json(
    {
      success: true,
      result: {
        ...detail,
        warehouse: warehouse
          ? {
              name: warehouse.name,
              address: warehouse.address,
              phone: warehouse.phone,
              image: warehouse.image,
            }
          : null,
        settings,
      },
    },
    { status: 200 },
  );
});
