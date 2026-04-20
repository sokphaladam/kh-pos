import { ChartOfAccount } from "@/app/api/accounting/chart-of-account/route";
import { LoaderFactory } from "@/dataloader/loader-factory";
import { table_account_booking } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { z } from "zod";

export const SchemaAccountBooking = z.object({
  bookingName: z.string().min(1, "Booking name is required"),
  accountId: z.string().min(1, "Account is required"),
  amount: z.number().min(0, "Amount must be greater than or equal to 0"),
});

export type TypeSchemaAccountBooking = z.infer<typeof SchemaAccountBooking>;

export interface AccountBooking {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  createdAt: string;
  createdBy: UserInfo | null;
  account: ChartOfAccount;
}

export class AccountBookingService {
  constructor(
    protected tx: Knex,
    protected user?: UserInfo,
  ) {}

  async getAccountBookingList({
    limit,
    offset,
    startDate,
    endDate,
    accountType,
  }: {
    limit: number;
    offset: number;
    startDate?: string;
    endDate?: string;
    accountType?: "expense" | "revenue";
  }) {
    const query = this.tx
      .table("account_booking")
      .join(
        "chart_of_account",
        "chart_of_account.id",
        "account_booking.account_id",
      )
      .where({
        "account_booking.deleted_at": null,
        "account_booking.warehouse_id": this.user?.currentWarehouseId,
      })
      .orderBy("account_booking.created_at", "desc");

    if (startDate && endDate) {
      query.whereBetween("account_booking.created_at", [startDate, endDate]);
    }

    const total = await query
      .clone()
      .select(
        this.tx.raw("SUM(account_booking.amount) as total_amount"),
        this.tx.raw(
          "SUM(CASE WHEN chart_of_account.account_type = 'revenue' THEN account_booking.amount ELSE 0 END) as total_revenue",
        ),
        this.tx.raw(
          "SUM(CASE WHEN chart_of_account.account_type = 'expense' THEN account_booking.amount ELSE 0 END) as total_expense",
        ),
        this.tx.raw("COUNT(account_booking.id) as total_count"),
      )
      .first();

    if (accountType) {
      query.where("chart_of_account.account_type", accountType);
    }

    const rows: table_account_booking[] = await query
      .clone()
      .limit(limit)
      .offset(offset)
      .select("account_booking.*");
    const userLoader = LoaderFactory.userLoader(this.tx);
    const accountLoader = LoaderFactory.chartOfAccountsLoader(this.tx);

    const result = await Promise.all(
      rows.map(async (row) => {
        return {
          id: row.id,
          accountId: row.account_id,
          amount: Number(row.amount),
          description: row.description,
          createdAt: row.created_at ? Formatter.dateTime(row.created_at) : null,
          createdBy: row.created_by
            ? await userLoader.load(row.created_by)
            : null,
          account: row.account_id
            ? await accountLoader.load(row.account_id)
            : null,
        } as AccountBooking;
      }),
    );

    return {
      summary: total,
      data: result,
    };
  }

  async createAccountBooking(input: TypeSchemaAccountBooking, user: UserInfo) {
    const now = Formatter.getNowDateTime();
    const accountBookingId = generateId();

    const account = await this.tx
      .table("chart_of_account")
      .where("id", input.accountId)
      .first();

    if (!account) {
      return {
        success: false,
        result: "Account not found",
      };
    }

    const amount =
      account.account_type === "expense"
        ? -Math.abs(input.amount)
        : Math.abs(input.amount);

    const rows: table_account_booking[] = [
      {
        id: accountBookingId,
        account_id: input.accountId,
        amount: String(amount || 0),
        description: input.bookingName,
        created_at: now,
        created_by: user.id,
        warehouse_id: user.currentWarehouseId || null,
        deleted_at: null,
        deleted_by: null,
      },
    ];

    await this.tx.table<table_account_booking>("account_booking").insert(rows);

    return {
      success: true,
      result: rows,
    };
  }

  async deleteAccountBooking(id: string, user: UserInfo) {
    const now = Formatter.getNowDateTime();

    await this.tx.table("account_booking").where("id", id).update({
      deleted_at: now,
      deleted_by: user.id,
    });

    return {
      success: true,
      result: "Account booking entry deleted successfully",
    };
  }
}
