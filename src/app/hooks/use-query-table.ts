import { Order } from "@/classes/order";
import { TransferProp } from "@/classes/transfer-order-table";
import { table_restaurant_tables } from "@/generated/tables";
import { requestDatabase } from "@/lib/api";
import { ResponseType } from "@/lib/types";
import { RestaurantTable } from "../api/table/table-create";
import { RestaurantUpdateTable } from "../api/table/table-update";
import { useGenericMutation, useGenericSWR } from "./use-generic";

export interface table_with_order extends table_restaurant_tables {
  order: Order | null;
}

export function useMutationCreateTable() {
  return useGenericMutation<RestaurantTable, ResponseType<unknown>>(
    "POST",
    "/api/table",
  );
}

export function useMutationUpdateTable() {
  return useGenericMutation<RestaurantUpdateTable, ResponseType<unknown>>(
    "PUT",
    "/api/table",
  );
}

export function useMutationDeleteTable() {
  return useGenericMutation<{ id: string }, ResponseType<unknown>>(
    "DELETE",
    "/api/table",
  );
}

export function useQueryTable(autoRefresh: boolean = true) {
  return useGenericSWR<ResponseType<table_with_order[]>>("/api/table", {
    revalidateOnFocus: true, // Auto-refetch on window focus
    revalidateOnReconnect: true, // Auto-refetch on network reconnect
    dedupingInterval: 2000, // Data is fresh for 2 seconds, then becomes stale
    refreshInterval: autoRefresh ? 30000 : 0, // Auto-refetch every 30 seconds when page is visible
    focusThrottleInterval: 3000, // Throttle focus revalidation to avoid spam
  });
}

export function requestUpdateTableStatus(
  tableId: string,
  status: "available" | "order_taken" | "cleaning",
) {
  const callBy = window.location.pathname === "/menu" ? "CUSTOMER" : "ADMIN";
  return requestDatabase<ResponseType<unknown>>(
    `/api/table/${tableId}`,
    "PUT",
    { status },
    callBy,
  );
}

export function useTransferOrderTable() {
  return useGenericMutation<TransferProp, ResponseType<string>>(
    "POST",
    "/api/transfer-table",
  );
}

export function useMutationUpdateTableLayout() {
  return useGenericMutation<
    { id: string; positionX?: string; positionY?: string }[],
    ResponseType<unknown>
  >("PUT", "/api/table/layout");
}

export function useQueryTableById(id: string) {
  return useGenericSWR<ResponseType<table_with_order>>(`/api/table/${id}`, {
    revalidateOnFocus: true, // Auto-refetch on window focus
    revalidateOnReconnect: true, // Auto-refetch on network reconnect
    dedupingInterval: 2000, // Data is fresh for 2 seconds, then becomes stale
    refreshInterval: 30000, // Auto-refetch every 30 seconds when page is visible
    focusThrottleInterval: 3000, // Throttle focus revalidation to avoid spam
  });
}
