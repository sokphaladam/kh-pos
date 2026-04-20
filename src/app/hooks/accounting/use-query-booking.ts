import { ResponseType } from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "../use-generic";
import {
  AccountBooking,
  TypeSchemaAccountBooking,
} from "@/classes/accounting/account-booking";

export function useQueryBooking({
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
  const params = new URLSearchParams();
  params.append("limit", String(limit));
  params.append("offset", String(offset));
  if (startDate && endDate) {
    params.append("startDate", startDate);
    params.append("endDate", endDate);
  }

  if (accountType) {
    params.append("accountType", accountType);
  }

  return useGenericSWR<
    ResponseType<{
      data: AccountBooking[];
      summary: {
        total_amount: number;
        total_revenue: number;
        total_expense: number;
        total_count: number;
      };
    }>
  >(`/api/accounting/booking?${params.toString()}`);
}

export function useMutationCreateBooking() {
  return useGenericMutation<TypeSchemaAccountBooking, ResponseType<unknown>>(
    "POST",
    "/api/accounting/booking",
  );
}

export function useMutationDeleteBooking() {
  return useGenericMutation<{ id: string }, ResponseType<unknown>>(
    "DELETE",
    "/api/accounting/booking",
  );
}
