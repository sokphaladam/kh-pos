import { ResponseType } from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "./use-generic";
import { OrderReturn, OrderReturnInput } from "@/classes/order-return";
import { FindProductInSlotResult } from "@/classes/find-product-in-slot";

export function useQueryReturn(
  offset: number,
  limit: number,
  status?: "returned" | "stock_in"
) {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });

  if (status) {
    params.append("status", status);
  }

  return useGenericSWR<
    ResponseType<{ totalRows: number; data: OrderReturn[] }>
  >(`/api/pos/return?${params.toString()}`);
}

export function useMutationReturn() {
  return useGenericMutation<OrderReturnInput[], ResponseType<string[]>>(
    "POST",
    `/api/pos/return`
  );
}

export function useMutationReturnStockIn() {
  return useGenericMutation<{ id: string }, ResponseType<boolean>>(
    "POST",
    `/api/pos/return/stock-in`
  );
}

export function useQueryReturnStockIn(id: string) {
  return useGenericSWR<ResponseType<FindProductInSlotResult[]>>(
    `/api/pos/return/stock-in-slot?id=${id}`
  );
}
