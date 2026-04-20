import { z } from "zod";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";

export const SchemaChartOfAccount = z.object({
  id: z.string().optional(),
  account_name: z.string().min(1, "Account name is required"),
  account_type: z.enum(["revenue", "expense"], {
    errorMap: () => ({ message: "Account type is required" }),
  }),
});

export type TypeSchemaChartOfAccount = z.infer<typeof SchemaChartOfAccount>;

export interface ChartOfAccount {
  id: string;
  accountName: string;
  accountType: "revenue" | "expense";
  createdAt: string;
  createdBy: UserInfo | null;
  updatedAt?: string;
  updatedBy?: UserInfo | null;
  deletedAt?: string;
  deletedBy?: UserInfo | null;
}
