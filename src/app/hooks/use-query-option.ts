import { ResponseType } from "@/lib/types";
import { ProductOptionAndVariant } from "../api/product/[id]/option/types";
import { useGenericMutation, useGenericSWR } from "./use-generic";

export function useQueryOption(id: string) {
  return useGenericSWR<ResponseType<ProductOptionAndVariant>>(
    `/api/product/${id}/option`
  );
}

export function useCreateOption(id: string) {
  return useGenericMutation<
    ProductOptionAndVariant,
    ResponseType<ProductOptionAndVariant>
  >("POST", `/api/product/${id}/option`);
}

export function useUpdateOption(id: string) {
  return useGenericMutation<
    ProductOptionAndVariant,
    ResponseType<ProductOptionAndVariant>
  >("PUT", `/api/product/${id}/option`);
}
