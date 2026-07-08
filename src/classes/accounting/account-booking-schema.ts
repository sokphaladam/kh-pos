import type { ChartOfAccount } from "@/app/api/accounting/chart-of-account/route";
import type { UserInfo } from "@/lib/server-functions/get-auth-from-token";
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
