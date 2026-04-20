/* eslint-disable @typescript-eslint/no-explicit-any */
import { DiscountType, ResponseType } from "@/lib/types";
import {
  useGenericMutation,
  useGenericSWR,
  useLazyGenericSWR,
} from "./use-generic";
import { AppliesDiscountInput } from "../api/discount/applies/applies-discount-to-product";
import { DiscountInput } from "../api/discount/create-discount";

export function useCreateDiscount() {
  return useGenericMutation<DiscountInput, ResponseType<DiscountInput>>(
    "POST",
    "/api/discount"
  );
}

export function useUpdateDiscount() {
  return useGenericMutation<DiscountInput, ResponseType<DiscountInput>>(
    "PUT",
    "/api/discount"
  );
}

export function useDeleteDiscount() {
  return useGenericMutation<{ id: string }, ResponseType<{ message: string }>>(
    "DELETE",
    "/api/discount"
  );
}

export function useQueryDiscount(limit: number, offset: number, id?: string) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    ...(id ? { id: id } : {}),
  });
  return useGenericSWR<ResponseType<{ data: DiscountType[]; total: number }>>(
    `/api/discount?${params.toString()}`
  );
}

export function useCreateAppliesDiscountProduct() {
  return useGenericMutation<
    { data: AppliesDiscountInput },
    ResponseType<AppliesDiscountInput>
  >("POST", "/api/discount/applies");
}

export function useQueryAppliesDiscountProduct(filter: {
  productId?: string;
  id?: string;
}) {
  const param = new URLSearchParams({
    ...(filter.productId ? { productId: filter.productId } : {}),
    ...(filter.id ? { id: filter.id } : {}),
  });
  return useGenericSWR<ResponseType<any[]>>(`/api/discount/applies?${param}`);
}

export function useLazyQueryAppliesDiscountProduct(filter: {
  productId?: string;
  id?: string;
}) {
  const param = new URLSearchParams({
    ...(filter.productId ? { productId: filter.productId } : {}),
    ...(filter.id ? { id: filter.id } : {}),
  });

  return useLazyGenericSWR<ResponseType<any[]>>(
    `/api/discount/applies?${param}`
  );
}
