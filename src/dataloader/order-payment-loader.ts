import { Payment } from "@/classes/payment";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";

export function getOrderPaymentLoader(db: Knex): DataLoader<string, Payment[]> {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows = await db
      .table("order_payment")
      .whereNull("deleted_at")
      .whereIn("order_id", keys);

    const paymentMap: Record<string, Payment[]> = {};
    const userLoader = LoaderFactory.userLoader(db);
    const paymentMethodLoader = LoaderFactory.paymentMethodLoader(db);

    const payments: Payment[] = await Promise.all(
      rows.map(async (payment) => {
        const [method, createdBy, updatedBy, deletedBy] = await Promise.all([
          payment.payment_method
            ? paymentMethodLoader.load(payment.payment_method)
            : null,
          payment.created_by ? userLoader.load(payment.created_by) : null,
          payment.updated_by ? userLoader.load(payment.updated_by) : null,
          payment.deleted_by ? userLoader.load(payment.deleted_by) : null,
        ]);
        return {
          paymentId: payment.payment_id,
          orderId: payment.order_id,
          // A payment whose method row is missing/renamed still shows on the
          // receipt with its raw method id instead of vanishing.
          paymentMethod: method?.method ?? payment.payment_method ?? "",
          currency: payment.currency,
          amount: payment.amount,
          exchangeRate: payment.exchange_rate,
          amountUsd: payment.amount_usd,
          createdAt: payment.created_at,
          createdBy,
          updatedAt: payment.updated_at,
          updatedBy,
          deletedAt: payment.deleted_at,
          deletedBy,
        };
      })
    );

    payments.forEach((payment) => {
      if (!paymentMap[payment.orderId]) {
        paymentMap[payment.orderId] = [];
      }
      paymentMap[payment.orderId].push(payment);
    });

    return keys.map((key) => paymentMap[key] || []);
  });
}
