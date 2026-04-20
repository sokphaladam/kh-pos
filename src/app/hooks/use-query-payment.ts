import { ResponseType } from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "./use-generic";
import { table_payment_method } from "@/generated/tables";
import { inputPaymentMethodType } from "../api/payment/method/method-create";

export function useQueryPaymentMethod() {
  return useGenericSWR<ResponseType<table_payment_method[]>>(
    "/api/payment/method"
  );
}

export function useCreatePaymentMethod() {
  return useGenericMutation<
    inputPaymentMethodType,
    ResponseType<inputPaymentMethodType>
  >("POST", "/api/payment/method");
}

export function useUpdatePaymentMethod() {
  return useGenericMutation<
    inputPaymentMethodType,
    ResponseType<inputPaymentMethodType>
  >("PUT", "/api/payment/method");
}

export function useDeletePaymentMethod() {
  return useGenericMutation<{ id: string }, ResponseType<boolean>>(
    "DELETE",
    "/api/payment/method"
  );
}
