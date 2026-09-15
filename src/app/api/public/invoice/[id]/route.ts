import { Order, OrderDetail, OrderService } from "@/classes/order";
import { Payment } from "@/classes/payment";
import { table_customer_order, table_setting } from "@/generated/tables";
import { table_warehouse } from "@/generated/tables/table_warehouse";
import { Formatter } from "@/lib/formatter";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import withDatabaseApi from "@/lib/server-functions/with-database-api";
import { ResponseType } from "@/lib/types";
import moment from "moment-timezone";
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
  // Raw timestamps (with seconds) for the invoice header.
  timeIn: string | null;
  timeOut: string | null;
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

  const settings = await db<table_setting>("setting")
    .where({ warehouse: null })
    .orWhere("warehouse", warehouseId)
    .select();

  const editableDaySetting = settings.find(
    (s) => s.option === "EDITABLE_ORDER_DAY",
  );
  const editableDays = editableDaySetting
    ? parseInt(editableDaySetting.value || "1", 10)
    : 0;
  const earliestVisibleDate = Formatter.addDateToNow(-editableDays, "day");

  const queryOrderRow = db<table_customer_order>("customer_order")
    .where("order_id", params.id)
    .where("warehouse_id", warehouseId)
    .where((qb) =>
      qb
        .whereNull("paid_at")
        .orWhereRaw(
          "DATE(paid_at) >= ?",
          moment(earliestVisibleDate).format("YYYY-MM-DD"),
        ),
    )
    .first();

  const orderRow = await queryOrderRow;

  if (!orderRow) {
    return NextResponse.json(
      { success: false, message: "We couldn't find this invoice." },
      { status: 404 },
    );
  }

  const orderService = new OrderService(db);
  const detail = await orderService.getOrderDetail(params.id, {
    currentWarehouseId: warehouseId,
  } as unknown as UserInfo);

  // getOrderDetail hydrates full staff UserInfo (session token, username,
  // phone). Never expose that on a public endpoint – keep only the display name.
  const publicUser = (u: { fullname?: string | null } | null | undefined) =>
    u ? { fullname: u.fullname ?? "" } : null;

  detail.orderInfo.createdBy = publicUser(detail.orderInfo.createdBy) as never;
  detail.orderInfo.transferBy = publicUser(
    detail.orderInfo.transferBy,
  ) as never;
  detail.payments = detail.payments.map((p) => ({
    ...p,
    createdBy: publicUser(p.createdBy) as never,
    updatedBy: publicUser(p.updatedBy) as never,
    deletedBy: publicUser(p.deletedBy) as never,
  }));

  const warehouse = await db<table_warehouse>("warehouse")
    .where("id", warehouseId)
    .where("is_deleted", 0)
    .first();

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
        timeIn: orderRow?.created_at ?? null,
        timeOut: orderRow?.paid_at ?? null,
      },
    },
    { status: 200 },
  );
});
