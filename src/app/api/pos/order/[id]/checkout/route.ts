import withAuthApi from "@/lib/server-functions/with-auth-api";
import { z } from "zod";
import { ResponseType } from "@/lib/types";
import { OrderService } from "@/classes/order";
import { FullfillService } from "@/classes/fullfill";
import { paymentSchema, PaymentService } from "@/classes/payment";
import { NextResponse } from "next/server";
import { Formatter } from "@/lib/formatter";

const CheckoutDataSchema = z.object({
  payments: z.array(paymentSchema),
  slotId: z.string(),
});

const idSchema = z.object({
  id: z.string(),
});

export type CheckoutDataType = z.infer<typeof CheckoutDataSchema>;

export const POST = withAuthApi<
  { id: string },
  CheckoutDataType,
  ResponseType<string>
>(async ({ db, body, params, userAuth }) => {
  const user = userAuth.admin!;
  const data = CheckoutDataSchema.parse(body);
  const { id } = idSchema.parse(params);

  const orderId = await db.transaction(async (trx) => {
    const orderService = new OrderService(trx);

    const { order, items } = await orderService.checkout(id, user);

    // update reservation status to comfirmed

    for (const item of items) {
      await trx
        .table("seat_reservation")
        .where({
          order_detail_id: item.order_detail_id,
          reservation_status: "pending",
        })
        .update({
          reservation_status: "confirmed",
          confirmed_at: Formatter.getNowDateTime(),
          confirmed_by: user.id,
        });
    }

    const fulfilmentService = new FullfillService(trx);
    await fulfilmentService.fullfill({
      items: items.map((item) => {
        return {
          orderItemId: item.order_detail_id,
          qty: item.qty,
          slotId: data.slotId,
        };
      }),
      createdBy: user,
    });

    const paymentService = new PaymentService(trx);

    for (const payment of data.payments) {
      await paymentService.createPayment({
        orderId: order.order_id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        currency: payment.currency,
        createdBy: user.id,
        exchangeRate: payment.exchangeRate,
        amountUsd: payment.amountUsd,
        used: payment.used,
      });
    }
    await orderService.orderPrintTime(order.order_id);
    return order.order_id;
  });

  return NextResponse.json(
    {
      success: true,
      result: orderId,
    },
    { status: 200 },
  );
});
