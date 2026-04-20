import { LoaderFactory } from "@/dataloader/loader-factory";
import {
  table_order_payment,
  table_order_return,
  table_shift,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { Knex } from "knex";

export class ShiftService {
  constructor(protected db: Knex) {}

  async getOpenedShiftByUser(userId: string) {
    const shifts: table_shift = await this.db("shift")
      .where("opened_by", userId)
      .where("status", "OPEN")
      .whereNull("closed_at")
      .first();
    return ShiftService.map(shifts, this.db);
  }

  async openShift(
    userId: string,
    openedCashUsd: number,
    openedCashKhr: number,
    exchangeRate: number
  ) {
    const shiftId = generateId();
    const shift = {
      shift_id: shiftId,
      opened_at: Formatter.getNowDateTime(),
      status: "OPEN" as table_shift["status"],
      opened_cash_usd: openedCashUsd.toString(),
      opened_cash_khr: openedCashKhr.toString(),
      opened_by: userId,
      exchange_rate: exchangeRate.toString(),
    };
    await this.db<table_shift>("shift").insert(shift);
    return shiftId;
  }

  async closeShift(
    userId: string,
    shiftId: string,
    actualCashUsd: number,
    actualCashKhr: number
  ) {
    const existingShift = await new ShiftService(this.db).getShiftDetail(
      shiftId
    );
    if (!existingShift) {
      throw new Error("Invalid provided shift");
    }

    if (existingShift.status === "CLOSE") {
      throw new Error("Cannot close the closed shift");
    }

    const shiftReceipt = await this.getShiftReceipt(
      shiftId,
      actualCashUsd,
      actualCashKhr
    );
    const shift = {
      closed_at: Formatter.getNowDateTime(),
      status: "CLOSE" as table_shift["status"],
      closed_cash_usd: shiftReceipt?.closedCashUsd.toString(), // subtracting close expected with returned amount
      closed_cash_khr: shiftReceipt?.closedCashKhr.toString(),
      updated_at: Formatter.getNowDateTime(),
      closed_by: userId,
      actual_cash_usd: actualCashUsd.toString(),
      actual_cash_khr: actualCashKhr.toString(),
      receipt: JSON.stringify(shiftReceipt),
    };
    await this.db<table_shift>("shift")
      .where("shift_id", shiftId)
      .where("opened_by", userId)
      .update(shift);
    return true;
  }

  static async map(row: table_shift, tx: Knex) {
    const userLoader = LoaderFactory.userLoader(tx);
    return {
      shiftId: row.shift_id,
      openedAt: Formatter.dateTime(row.opened_at),
      closedAt: row.closed_at ? Formatter.dateTime(row.closed_at) : null,
      openedCashUsd: row.opened_cash_usd,
      closedCashUsd: row.closed_cash_usd,
      openedCashKhr: row.opened_cash_khr,
      closedCashKhr: row.closed_cash_khr,
      openedBy: row.opened_by ? await userLoader.load(row.opened_by) : null,
      status: row.status,
      updatedAt: row.updated_at ? Formatter.dateTime(row.updated_at) : null,
      exchangeRate: row.exchange_rate,
    };
  }

  async getShiftDetail(shiftId: string) {
    const shift = await this.db<table_shift>("shift")
      .where("shift_id", shiftId)
      .first();
    if (!shift) return null;

    return await ShiftService.map(shift, this.db);
  }

  async getShiftReceipt(
    shiftId: string,
    actualCashUsd: number,
    actualCashKhr: number
  ) {
    const shift = await this.getShiftDetail(shiftId);
    if (!shift) return null;

    const summary = await this.getSaleSummaryByShift(shiftId);
    const openedCashUsd = Number(shift.openedCashUsd || 0);
    const openedCashKhr = Number(shift.openedCashKhr || 0);

    let saleCashUsd = 0;
    let saleCashKhr = 0;
    Object.keys(summary.amountByMethod).forEach((key) => {
      const amount = summary.amountByMethod[key];
      saleCashUsd += Number(amount.usd);
      saleCashKhr += Number(amount.khr);
    });
    const closedCashUsd =
      Number(shift.openedCashUsd || 0) + saleCashUsd - summary.amountReturned;
    const closedCashKhr = Number(shift.openedCashKhr || 0) + saleCashKhr;

    return {
      shiftId: shift.shiftId,
      employee: shift.openedBy?.fullname,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt,

      // sales summary
      orders: summary.totalOrder,
      sales: summary.totalAmount,
      payments: summary.totalPayments,

      // cash summary
      exchangeRate: shift.exchangeRate,
      openedCashUsd,
      openedCashKhr,
      closedCashUsd,
      closedCashKhr,
      actualCashUsd,
      actualCashKhr,
      cashDiffUsd: actualCashUsd - closedCashUsd,
      cashDiffKhr: actualCashKhr - closedCashKhr,

      // breakdown the cash summary by payment method
      amountByMethod: summary.amountByMethod,

      // return amount
      amountReturned: summary.amountReturned,
      returns: summary.returns,
      totalCustomer: summary.totalCustomer,
      avgCustomer: summary.avgCustomer,
    };
  }

  private async getSaleSummaryByShift(shiftId: string) {
    const payments: (table_order_payment & { method: string })[] = await this.db
      .table("order_payment")
      .innerJoin(
        "payment_method",
        "order_payment.payment_method",
        "payment_method.method_id"
      )
      .whereNull("order_payment.deleted_at")
      .andWhere({ shift_id: shiftId })
      .select("order_payment.*", "payment_method.method");

    const returns: table_order_return[] = await this.db
      .table("order_return")
      .where("shift_id", shiftId);

    const orders = await this.db.table("customer_order").whereIn(
      "order_id",
      payments.map((p) => p.order_id)
    );
    const settings = await this.db.table("setting").select("option", "value");

    const currencySetting = settings.find((f) => f.option === "CURRENCY");
    const currentCurrency = currencySetting
      ? (currencySetting.value as "USD" | "KHR")
      : "USD";

    const totalPayments = payments.length;
    const amountReturned = returns.reduce(
      (a, b) => a + Number(b.refund_amount || 0),
      0
    );
    const amountByMethod: Record<
      string,
      { usd: number; khr: number; qty: number }
    > = {};
    for (const payment of payments) {
      if (!amountByMethod[payment.method!]) {
        amountByMethod[payment.method!] = {
          usd:
            payment.currency === "USD" ? Number(payment.amount_used || 0) : 0,
          khr:
            payment.currency === "KHR"
              ? Number(
                  currentCurrency === "KHR"
                    ? Number(payment.amount_used) /
                        Number(payment.exchange_rate)
                    : Number(payment.amount_used) *
                        Number(payment.exchange_rate)
                )
              : 0,
          qty: 1,
        };
      } else {
        amountByMethod[payment.method!].usd +=
          payment.currency === "USD" ? Number(payment.amount_used || 0) : 0;
        amountByMethod[payment.method!].khr +=
          payment.currency === "KHR"
            ? Number(
                currentCurrency === "KHR"
                  ? Number(payment.amount_used) / Number(payment.exchange_rate)
                  : Number(payment.amount_used) * Number(payment.exchange_rate)
              )
            : 0;
        amountByMethod[payment.method!].qty += 1;
      }
    }

    const orderSummary = await this.db("customer_order")
      .whereIn(
        "order_id",
        payments.map((payment) => payment.order_id)
      )
      .countDistinct("order_id as total_order")
      .sum("total_amount as total_amount")
      .first();

    const totalOrderPerOrder = orders.map((x) => {
      return Number(x.total_amount) / Number(x.customer || 1);
    });

    return {
      totalOrder: Number(orderSummary?.total_order || 0),
      totalAmount: Number(orderSummary?.total_amount || 0),
      totalPayments,
      amountByMethod,
      amountReturned,
      returns: returns.reduce((a, b) => a + Number(b.quantity), 0),
      totalCustomer: Number(
        orders.reduce((a, b) => a + Number(b.customer || 0), 0)
      ),
      avgCustomer:
        Number(totalOrderPerOrder.reduce((a, b) => a + b, 0)) /
        (totalOrderPerOrder.length || 1),
    };
  }
}
