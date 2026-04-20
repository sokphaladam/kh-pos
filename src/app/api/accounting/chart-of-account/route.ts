import { createChartOfAccount } from "./chart-of-account-create";
import { updateChartOfAccount } from "./chart-of-account-update";
import { listChartOfAccounts } from "./chart-of-account-list";
import { deleteChartOfAccount } from "./chart-of-account-delete";

export type { TypeSchemaChartOfAccount, ChartOfAccount } from "./schema";

export const POST = createChartOfAccount;
export const PUT = updateChartOfAccount;
export const GET = listChartOfAccounts;
export const DELETE = deleteChartOfAccount;
