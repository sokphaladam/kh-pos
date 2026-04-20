import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";
import { ChartOfAccount } from "@/app/api/accounting/chart-of-account/route";

export function createChartOfAccountsLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows = await db
      .table("chart_of_account")
      .whereIn("id", keys as string[]);

    const userLoader = LoaderFactory.userLoader(db);

    return keys.map((key) => {
      const row = rows.find((r) => r.id === key);

      if (!row) return null;

      return {
        id: row.id,
        accountName: row.account_name,
        accountType: row.account_type,
        createdAt: row.created_at,
        createdBy: row.created_by ? userLoader.load(row.created_by) : null,
      } as ChartOfAccount;
    });
  });
}
