import { SupplierProductPrice } from "@/classes/supplier-product-price";
import { useGenericMutation, useGenericSWR } from "./use-generic";
import { ResponseType, SupplierProductPriceInput } from "@/lib/types";

export function useQuerySupplierProductPrice(
  limit: number,
  offset: number,
  filter?: {
    supplierId?: string;
    productVariantId?: string;
    orderByPrice?: "asc" | "desc";
  },
  search?: string
) {
  const params = new URLSearchParams({
    limit: String(limit || 30),
    offset: String(offset || 0),
  });

  if (filter?.supplierId) {
    params.append("supplierId", filter.supplierId);
  }

  if (filter?.productVariantId) {
    params.append("productVariantId", filter.productVariantId);
  }

  if (filter?.orderByPrice) {
    params.append("orderByPrice", filter.orderByPrice);
  }

  if (search) {
    params.append("search", search);
  }

  return useGenericSWR<
    ResponseType<{ data: SupplierProductPrice[]; total: number }>
  >(`/api/supplier/product-price?${params.toString()}`);
}

export function useCreateSupplierProductPrice() {
  return useGenericMutation<SupplierProductPriceInput[], ResponseType<unknown>>(
    "POST",
    "/api/supplier/product-price"
  );
}

export function useUpdateSupplierProductPrice() {
  return useGenericMutation<SupplierProductPriceInput>(
    "PUT",
    "/api/supplier/product-price"
  );
}

export function useDeleteSupplierProductPrice() {
  return useGenericMutation<{ id: string }, ResponseType<{ message: string }>>(
    "DELETE",
    "/api/supplier/product-price"
  );
}
