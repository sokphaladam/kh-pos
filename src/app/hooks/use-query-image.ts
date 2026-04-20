import { ResponseType } from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "./use-generic";
import { ProductImage } from "@/repository/product-image-repository";

export function useQueryImage(id: string) {
  return useGenericSWR<ResponseType<ProductImage[]>>(
    `/api/product/${id}/image`
  );
}

export function useCreateImage(id: string) {
  return useGenericMutation<ProductImage[], ResponseType<ProductImage[]>>(
    "POST",
    `/api/product/${id}/image`
  );
}

export function useUpdateImage(id: string) {
  return useGenericMutation<ProductImage[], ResponseType<ProductImage[]>>(
    "PUT",
    `/api/product/${id}/image`
  );
}
