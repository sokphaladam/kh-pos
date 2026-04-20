import {
  OrderModifierInput,
  RemoveOrderModifier,
} from "@/classes/order-modifier";
import { requestDatabase } from "@/lib/api";
import { ResponseType } from "@/lib/types";
import { useGenericMutation } from "./use-generic";

export function useMutationAddOrderModifier(orderId: string) {
  return useGenericMutation<OrderModifierInput, ResponseType<boolean>>(
    "POST",
    `/api/pos/order/${orderId}/modifier`
  );
}

export function useMutationCustomOrderModifier(orderId: string) {
  return useGenericMutation<OrderModifierInput, ResponseType<boolean>>(
    "PUT",
    `/api/pos/order/${orderId}/modifier`
  );
}

export function useMutationDeleteOrderModifier(orderId: string) {
  return useGenericMutation<RemoveOrderModifier, ResponseType<boolean>>(
    "DELETE",
    `/api/pos/order/${orderId}/modifier`
  );
}

export function requestAddOrderModifier(
  orderId: string,
  body: OrderModifierInput
) {
  const callBy = window.location.pathname === "/menu" ? "CUSTOMER" : "ADMIN";
  return requestDatabase<ResponseType<boolean>>(
    `/api/pos/order/${orderId}/modifier`,
    "POST",
    body,
    callBy
  );
}
