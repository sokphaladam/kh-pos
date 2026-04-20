import { ResponseType } from "@/lib/types";
import { SchemaCustomerType } from "../api/auth/customer/customer-create";
import {
  useGenericMutation,
  useGenericSWR,
  useLazyGenericSWR,
} from "./use-generic";
import { Customer } from "@/classes/customer";

export function useLazyQueryCustomer(
  limit: number,
  offset: number,
  phone?: string,
  type?: "general" | "delivery",
) {
  const params = new URLSearchParams();
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());
  if (phone) {
    params.append("phone", phone);
  }
  if (type) {
    params.append("type", type);
  }

  return useLazyGenericSWR<ResponseType<{ data: Customer[]; total: number }>>(
    `/api/auth/customer?${params.toString()}`,
  );
}

export function useQueryCustomerList(
  limit: number,
  offset: number,
  phone?: string,
  type?: "general" | "delivery",
) {
  const params = new URLSearchParams();
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());
  if (phone) {
    params.append("phone", phone);
  }
  if (type) {
    params.append("type", type);
  }
  return useGenericSWR<ResponseType<{ data: Customer[]; total: number }>>(
    `/api/auth/customer?${params.toString()}`,
  );
}

export function useQueryCustomerId(id: string) {
  return useGenericSWR<ResponseType<{ data: Customer }>>(
    `/api/auth/customer/${id}`,
  );
}

export function useMutationCreateCustomer() {
  return useGenericMutation<SchemaCustomerType, ResponseType<unknown>>(
    "POST",
    "/api/auth/customer",
  );
}

export function useMutationUpdateCustomerIdInCustomerOrder(orderId: string) {
  return useGenericMutation<
    {
      customerId: string;
      code: string;
      type: "dine_in" | "take_away" | "food_delivery";
    },
    ResponseType<unknown>
  >("PUT", `/api/pos/order/${orderId}/customer`);
}

export function useMutationUpdateCustomerId(id: string) {
  return useGenericMutation<SchemaCustomerType, ResponseType<unknown>>(
    "PUT",
    `/api/auth/customer/${id}`,
  );
}

export function useMutationDeleteCustomerId(id: string) {
  return useGenericMutation<unknown, ResponseType<unknown>>(
    "DELETE",
    `/api/auth/customer/${id}`,
  );
}
