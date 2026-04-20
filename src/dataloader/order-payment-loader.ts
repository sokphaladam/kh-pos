import { Payment } from "@/classes/payment";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";

export function getOrderPaymentLoader(db: Knex): DataLoader<string, Payment[]> {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows = await db
      .table("order_payment")
      .innerJoin(
        "payment_method",
        "order_payment.payment_method",
        "payment_method.method_id"
      )
      .select("order_payment.*", "payment_method.method")
      .whereNull("order_payment.deleted_at")
      .whereIn("order_id", keys);

    const paymentMap: Record<string, Payment[]> = {};
    const userLoader = LoaderFactory.userLoader(db);

    await Promise.all(
      rows.map(async (payment) => {
        if (!paymentMap[payment.order_id]) {
          paymentMap[payment.order_id] = [];
        }
        paymentMap[payment.order_id].push({
          paymentId: payment.payment_id,
          orderId: payment.order_id,
          paymentMethod: payment.method,
          currency: payment.currency,
          amount: payment.amount,
          exchangeRate: payment.exchange_rate,
          amountUsd: payment.amount_usd,
          createdAt: payment.created_at,
          createdBy: payment.created_by
            ? await userLoader.load(payment.created_by)
            : null,
          updatedAt: payment.updated_at,
          updatedBy: payment.updated_by
            ? await userLoader.load(payment.updated_by)
            : null,
          deletedAt: payment.deleted_at,
          deletedBy: payment.deleted_by
            ? await userLoader.load(payment.deleted_by)
            : null,
        });
      })
    );

    return keys.map((key) => paymentMap[key] || []);
  });
}
