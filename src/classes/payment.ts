import { LoaderFactory } from "@/dataloader/loader-factory";
import { table_order_payment } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { Knex } from "knex";
import { ShiftService } from "./shift";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { z } from "zod";

export const paymentSchema = z.object({
  amount: z.number(),
  paymentMethod: z.string(),
  currency: z.enum(["USD", "KHR"]),
  amountUsd: z.number(),
  exchangeRate: z.number(),
  used: z.number(),
});

export interface CreatePaymentOption {
  orderId: string;
  amount: number;
  paymentMethod: string;
  currency: table_order_payment["currency"];
  createdBy: string;
  amountUsd: number;
  exchangeRate: number;
  used: number;
}

interface UpdatePaymentOption extends CreatePaymentOption {
  paymentId: string;
}

export interface Payment {
  paymentId: string;
  orderId: string;
  paymentMethod: string;
  currency: string;
  amount: string;
  exchangeRate: string;
  amountUsd: string;
  createdAt: string;
  createdBy: UserInfo | null;
  updatedAt: string | null;
  updatedBy: UserInfo | null;
  deletedAt: string | null;
  deletedBy: UserInfo | null;
}

export class PaymentService {
  constructor(protected db: Knex) {}

  async createPayment({
    orderId,
    amount,
    paymentMethod,
    currency,
    createdBy,
    exchangeRate,
    amountUsd,
    used,
  }: CreatePaymentOption) {
    const paymentId = generateId();
    const shift = await new ShiftService(this.db).getOpenedShiftByUser(
      createdBy
    );

    const payment = {
      payment_id: paymentId,
      payment_method: paymentMethod,
      currency,
      amount: amount.toString(),
      created_at: Formatter.getNowDateTime(),
      created_by: createdBy,
      order_id: orderId,
      exchange_rate: exchangeRate.toString(),
      amount_usd: amountUsd.toString(),
      shift_id: shift?.shiftId,
      amount_used: used.toString(),
    };
    await this.db<table_order_payment>("order_payment").insert(payment);

    return payment;
  }

  async updatePayment({
    paymentId,
    amount,
    paymentMethod,
    currency,
    createdBy: updatedBy,
    exchangeRate,
    amountUsd,
  }: UpdatePaymentOption & { paymentId: string }) {
    const payment = {
      payment_method: paymentMethod,
      currency,
      amount: amount.toString(),
      updated_at: Formatter.getNowDateTime(),
      updated_by: updatedBy,
      exchange_rate: exchangeRate.toString(),
      amount_usd: amountUsd.toString(),
    };
    await this.db<table_order_payment>("order_payment")
      .where("payment_id", paymentId)
      .update(payment);

    return payment;
  }

  async deletePayment(paymentId: string, deletedBy: string) {
    await this.db<table_order_payment>("order_payment")
      .where("payment_id", paymentId)
      .update({
        deleted_at: Formatter.getNowDateTime(),
        deleted_by: deletedBy,
      });
  }

  async getPayment(orderId: string): Promise<Payment[]> {
    const payments = await this.db<table_order_payment>("order_payment")
      .innerJoin(
        "payment_method",
        "order_payment.payment_method",
        "payment_method.method_id"
      )
      .select("order_payment.*", "payment_method.method")
      .whereNull("order_payment.deleted_at")
      .where("order_id", orderId);

    const userLoader = LoaderFactory.userLoader(this.db);

    return await Promise.all(
      payments.map(async (payment) => {
        return {
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
        };
      })
    );
  }
}
