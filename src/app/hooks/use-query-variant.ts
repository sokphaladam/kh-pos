import { ProductOption } from "../api/product/[id]/option/types";
import { useGenericMutation } from "./use-generic";

export function useGenericGenerateVariant(id: string) {
  return useGenericMutation<ProductOption[]>(
    "POST",
    `/api/product/${id}/generate-variant`
  );
}
