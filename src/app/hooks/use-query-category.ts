import {
  Category,
  CategoryInput,
} from "@/lib/server-functions/category/create-category";
import { ResponseType } from "@/lib/types";
import {
  ProductCategoryDetail,
  ProductCategoryUpdate,
} from "../api/product/[id]/category/types";
import {
  useGenericMutation,
  useGenericSWR,
  useLazyGenericSWR,
} from "./use-generic";

export function useQueryCategory(
  limit: number,
  offset: number,
  search?: string,
  id?: string,
  onlyBindedToPrinter?: boolean,
) {
  const params = new URLSearchParams();
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());
  if (search && search.trim() !== "") {
    params.append("s", search);
  }
  if (id) {
    params.append("id", id);
  }
  if (onlyBindedToPrinter) {
    params.append("onlyBindedToPrinter", "true");
  }

  const { data, error, isLoading, mutate } = useGenericSWR<{
    result: { data: Category[]; total: number };
  }>(`/api/category?${params}`);

  return { categories: data?.result, error, isLoading, mutate };
}

export function useCreateCategory() {
  return useGenericMutation<CategoryInput, ResponseType<Category>>(
    "POST",
    "/api/category",
  );
}

export function useUpdateCategory() {
  return useGenericMutation<Category, Category>("PUT", "/api/category");
}

export function useDeleteCategory() {
  return useGenericMutation<{ id: string }, ResponseType<{ message: string }>>(
    "DELETE",
    "/api/category",
  );
}

export function useQuerySearchCategory(
  limit: number,
  offset: number,
  search?: string,
  onlyBindedToPrinter?: boolean,
) {
  const params = new URLSearchParams();
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());
  if (search && search.trim() !== "") {
    params.append("s", search);
  }
  if (onlyBindedToPrinter) {
    params.append("onlyBindedToPrinter", "true");
  }
  return useLazyGenericSWR<{
    result: { data: Category[]; total: number };
  }>(`/api/category?${params.toString()}`);
}

export function useQueryCategoryMenu(
  warehouseId?: string,
  onlyBindedToPrinter = true,
) {
  const params = new URLSearchParams();
  if (onlyBindedToPrinter) {
    params.append("onlyBindedToPrinter", "true");
  }
  if (warehouseId) {
    params.append("warehouse", warehouseId);
  }
  return useLazyGenericSWR<{
    result: { data: Category[]; total: number };
  }>(`/api/category/menu?${params.toString()}`);
}

export function useUpdateProductCategroy(id: string) {
  return useGenericMutation<
    ProductCategoryUpdate[],
    ResponseType<ProductCategoryDetail[]>
  >("PUT", `/api/product/${id}/category`);
}

export function useQueryProductCategory(id: string) {
  return useGenericSWR<ResponseType<ProductCategoryDetail[]>>(
    `/api/product/${id}/category`,
  );
}

export function useQueryCategoryById(id: string) {
  // Since there's no direct API for single category, we'll fetch all categories
  // and filter on client side. This is not optimal but works for the current need.
  const { categories, error, isLoading } = useQueryCategory(
    1,
    0,
    undefined,
    id,
  ); // Fetch more categories

  const category = categories?.data?.find((cat) => cat.id === id) || null;

  return {
    category,
    error,
    isLoading,
  };
}

export function useLazyQuerySearchCateogryList(
  limit: number,
  offset: number,
  search?: string,
) {
  const params = new URLSearchParams();
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());
  if (search && search.trim() !== "") {
    params.append("s", search);
  }
  return useLazyGenericSWR<ResponseType<{ data: Category[]; total: number }>>(
    `/api/category?${params}`,
  );
}

export function useMutationToggleProductCategory() {
  return useGenericMutation<
    { categoryIds: string[]; status: "enable" | "disable" },
    ResponseType<{ affectedProducts: number }>
  >("POST", "/api/category/product-toggle");
}
