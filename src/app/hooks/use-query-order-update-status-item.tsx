import { ResponseType } from "@/lib/types";
import { UpdateOrderItemStatusSchemaAPIInput } from "../api/pos/order/[id]/update-item-status/update-order-item-status";
import { useGenericMutation } from "./use-generic";
import { UpdateOrderItemStatusSchemaInput } from "../api/pos/order/[id]/update-item-status/force-update-qty";

export function useMutationForceUpdateQtyByStatus(orderId: string) {
  return useGenericMutation<
    UpdateOrderItemStatusSchemaInput,
    ResponseType<unknown>
  >("PUT", `/api/pos/order/${orderId}/update-item-status`);
}

export function useMutationUpdateOrderItemStatusAPI(orderId: string) {
  return useGenericMutation<
    UpdateOrderItemStatusSchemaAPIInput,
    ResponseType<unknown>
  >("POST", `/api/pos/order/${orderId}/update-item-status`);
}

export function useMutationPrintToKitchen() {
  return useGenericMutation<
    { orderDetailId: string; qty: number },
    ResponseType<unknown>
  >("POST", `/api/print-queue`);
}
