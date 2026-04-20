import { OrderService } from "@/classes/order";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderList } from "./get-order-list";

const inputSchema = z.object({
  warehouseId: z.string(),
  slotId: z.string(),
  customerId: z.string(),
  invoiceNo: z.number(),
  tableNumber: z.string().optional(),
  items: z.array(
    z.object({
      id: z.string(),
      variantId: z.string(),
      qty: z.number(),
      price: z.string(),
      reservation: z
        .array(
          z.object({
            showtimeId: z.string(),
            seatId: z.string(),
            price: z.number(),
            code: z.string().optional(),
          })
        )
        .optional(),
    })
  ),
  customer: z.number().optional(),
});

export const POST = withAuthApi<unknown, unknown>(
  async ({ db, body, userAuth }) => {
    const input = inputSchema.parse(body);

    const tr = await db.transaction(async (trx) => {
      const orderService = new OrderService(trx);

      const { order } = await orderService.create({
        ...input,
        createdBy: userAuth.admin! || {
          ...userAuth.customer!,
          currentWarehouseId: userAuth.customer?.warehouseId,
        },
        status: "DRAFT",
      });

      return order.order_id;
    });

    return NextResponse.json({ success: true, result: tr }, { status: 200 });
  },
  ["ADMIN", "CUSTOMER"]
);

export const GET = getOrderList;
