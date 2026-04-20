import { Supplier, SupplierInput } from "@/lib/server-functions/supplier";
import {
  useGenericSWR,
  useGenericMutation,
  useLazyGenericSWR,
} from "./use-generic";

export const useQuerySupplierList = (
  limit: number,
  offset: number,
  search?: string
) => {
  const params = new URLSearchParams();
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());
  if (search && search.trim() !== "") {
    params.append("s", search);
  }

  const { data, error, isLoading, mutate } = useGenericSWR<{
    result: { data: Supplier[]; total: number };
  }>(`/api/supplier?${params.toString()}`);

  return {
    supplier: data?.result?.data,
    total: data?.result?.total || 0,
    error,
    isLoading,
    mutate,
  };
};

export function useCreateSupplier() {
  return useGenericMutation<SupplierInput, Supplier>("POST", "/api/supplier");
}

export function useUpdateSupplier() {
  return useGenericMutation<Supplier, Supplier>("PUT", `/api/supplier`);
}

export function useDeleteSupplier() {
  return useGenericMutation<{ id: string }>("DELETE", `/api/supplier`);
}

export function useQuerySearchSupplier(
  limit: number,
  offset: number,
  search?: string
) {
  const params = new URLSearchParams();
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());
  if (search && search.trim() !== "") {
    params.append("s", search);
  }
  return useLazyGenericSWR<{
    result: { data: Supplier[]; total: number };
  }>(`/api/supplier?${params.toString()}`);
}

export function useQuerySupplierById(id: string) {
  const {
    data: supplier,
    error,
    isLoading,
    mutate,
  } = useGenericSWR<Supplier>(`/api/supplier/${id}`);

  return { supplier, error, isLoading, mutate };
}
