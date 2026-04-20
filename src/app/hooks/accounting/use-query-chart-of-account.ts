import {
  ChartOfAccount,
  TypeSchemaChartOfAccount,
} from "@/app/api/accounting/chart-of-account/schema";
import { useGenericMutation, useGenericSWR } from "../use-generic";
import { ResponseType } from "@/lib/types";

export function useQueryChartOfAccount(offset: number, limit: number) {
  const params = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
  });
  return useGenericSWR<ResponseType<{ data: ChartOfAccount[]; total: number }>>(
    `/api/accounting/chart-of-account?${params.toString()}`,
  );
}

export function useMutationCreateChartOfAccount() {
  return useGenericMutation<
    TypeSchemaChartOfAccount,
    ResponseType<ChartOfAccount>
  >("POST", "/api/accounting/chart-of-account");
}

export function useMutationUpdateChartOfAccount() {
  return useGenericMutation<
    TypeSchemaChartOfAccount,
    ResponseType<ChartOfAccount>
  >("PUT", "/api/accounting/chart-of-account");
}

export function useMutationDeleteChartOfAccount() {
  return useGenericMutation<{ id: string }, ResponseType<unknown>>(
    "DELETE",
    "/api/accounting/chart-of-account",
  );
}
