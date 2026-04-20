import { Order, OrderDetail, OrderFilter } from "@/classes/order";
import { Payment } from "@/classes/payment";
import { requestDatabase } from "@/lib/api";
import { ResponseType } from "@/lib/types";
import { DiscountInput } from "../api/discount/create-discount";
import { InfoResponse } from "../api/pos/info/route";
import { CheckoutDataType } from "../api/pos/order/[id]/checkout/route";
import { useGenericMutation, useGenericSWR } from "./use-generic";
import { UpdateOrderItemQtyInput } from "../api/pos/order/[id]/update-item-qty/update-order-item-qty";

export function useCreateOrder() {
  return useGenericMutation("POST", `/api/pos/order`);
}

export function useUpdateOrder(orderId: string) {
  return useGenericMutation("PUT", `/api/pos/order/${orderId}`);
}

export function useDeleteOrder(orderId: string) {
  return useGenericMutation<unknown, ResponseType<boolean>>(
    "DELETE",
    `/api/pos/order/${orderId}`,
  );
}

export function useQueryPOSInfo(warehouseId: string) {
  return useGenericSWR<ResponseType<InfoResponse>>(
    `/api/pos/info?warehouse=${warehouseId}`,
    {
      revalidateOnFocus: true, // Auto-refetch on window focus
      revalidateOnReconnect: true, // Auto-refetch on network reconnect
      dedupingInterval: 2000, // Data is fresh for 2 seconds, then becomes stale
      refreshInterval: 30000, // Auto-refetch every 30 seconds when page is visible
      focusThrottleInterval: 3000, // Throttle focus revalidation to avoid spam
    },
  );
}

export function requestAutoInvoiceNumber(n: number) {
  const callBy = window.location.pathname === "/menu" ? "CUSTOMER" : "ADMIN";
  return requestDatabase<ResponseType<number[]>>(
    `/api/pos/auto_invoice_number?n=${n}`,
    "GET",
    undefined,
    callBy,
  );
}

export function useQueryOrder(orderId: string) {
  return useGenericSWR<
    ResponseType<{
      orderInfo: Order;
      orderDetail: OrderDetail[];
      payments: Payment[];
    }>
  >(`/api/pos/order/${orderId}`);
}

export function requestOrderDetail(orderId: string) {
  return requestDatabase<
    ResponseType<{
      orderInfo: Order;
      orderDetail: OrderDetail[];
      payments: Payment[];
    }>
  >(`/api/pos/order/${orderId}`);
}

export function useQueryOrderList(filter: OrderFilter) {
  const params = new URLSearchParams();

  // Add required params
  params.set("limit", String(filter.limit || 30));
  params.set("offset", String(filter.offset || 0));

  // Add optional params only if they exist
  if (filter.orderId) params.set("orderId", filter.orderId);
  if (filter.invoiceNo) params.set("invoiceNo", filter.invoiceNo);
  if (filter.startDate) params.set("startDate", filter.startDate);
  if (filter.endDate) params.set("endDate", filter.endDate);
  if (filter.status) params.set("status", filter.status);
  if (filter.userId) params.set("userId", filter.userId);
  if (filter.shiftId) params.set("shiftId", filter.shiftId);
  if (filter.customerPhone) params.set("customerPhone", filter.customerPhone);
  if (filter.ticketCode) params.set("ticketCode", filter.ticketCode);
  if (filter.checkSharedDraft)
    params.set("checkSharedDraft", filter.checkSharedDraft);

  return useGenericSWR<ResponseType<{ totalRows: number; orders: Order[] }>>(
    `/api/pos/order?${params}`,
  );
}

export function useMutationUpdateOrderItemQty(id: string) {
  return useGenericMutation<UpdateOrderItemQtyInput, ResponseType<unknown>>(
    "PUT",
    `/api/pos/order/${id}/update-item-qty`,
  );
}

export function useMutationDeleteOrderItem(id: string) {
  return useGenericMutation<{ item_id: string }, ResponseType<unknown>>(
    "DELETE",
    `/api/pos/order/${id}/remove-item`,
  );
}

export function useMutationCreateOrderItem(id: string) {
  return useGenericMutation<unknown, ResponseType<unknown>>(
    "POST",
    `/api/pos/order/${id}/add-item`,
  );
}

export function useMutationUpdateDiscountItem(id: string) {
  return useGenericMutation<
    { item_id: string; discount_amount: string; discount: DiscountInput[] },
    ResponseType<unknown>
  >("PUT", `/api/pos/order/${id}/update-discount`);
}

export function useMutationCheckout(id: string) {
  return useGenericMutation<CheckoutDataType, ResponseType<string>>(
    "POST",
    `/api/pos/order/${id}/checkout`,
  );
}

export function useUndoCompletedOrderToDraft(id: string) {
  return useGenericMutation<
    unknown,
    ResponseType<{ orderId: string; tableNumber: string | null }>
  >("PUT", `/api/pos/order/${id}/undo-from-complete-to-draft`);
}

export function useMutationCustomerOrder(id: string) {
  return useGenericMutation<{ customer: number }, ResponseType<unknown>>(
    "POST",
    `/api/pos/order/${id}/customer`,
  );
}

export function requestOrderPrintTime(id: string) {
  return requestDatabase<ResponseType<string>>(
    `/api/pos/order/${id}/print`,
    "POST",
    {},
  );
}
