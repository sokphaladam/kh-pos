import {
  GroupProduct,
  ProductGroupInputType,
  ProductGroupResult,
} from "@/classes/product-group";
import { useGenericMutation, useGenericSWR } from "./use-generic";
import { ResponseType } from "@/lib/types";

export function useMutationCreateProductGroup() {
  return useGenericMutation<ProductGroupInputType, ResponseType<unknown>>(
    "POST",
    "/api/product-v2/group",
  );
}

export function useMutationUpdateProductGroup() {
  return useGenericMutation<
    ProductGroupInputType & { groupId: string },
    ResponseType<unknown>
  >("PUT", "/api/product-v2/group");
}

export function useMutationDeleteProductGroup() {
  return useGenericMutation<{ groupId: string }, ResponseType<unknown>>(
    "DELETE",
    "/api/product-v2/group",
  );
}

export function useMutationAssignProductToGroup(groupId: string) {
  return useGenericMutation<GroupProduct[], ResponseType<unknown>>(
    "POST",
    `/api/product-v2/group/${groupId}/products`,
  );
}

export function useMutationUnassignProductFromGroup(groupId: string) {
  return useGenericMutation<GroupProduct[], ResponseType<unknown>>(
    "DELETE",
    `/api/product-v2/group/${groupId}/products`,
  );
}

export function useMutationAssignWarehouseToGroup(groupId: string) {
  return useGenericMutation<{ warehouseIds: string[] }, ResponseType<unknown>>(
    "POST",
    `/api/product-v2/group/${groupId}/warehouse`,
  );
}

export function useMutationUnassignWarehouseFromGroup(groupId: string) {
  return useGenericMutation<{ warehouseIds: string[] }, ResponseType<unknown>>(
    "DELETE",
    `/api/product-v2/group/${groupId}/warehouse`,
  );
}

export function useQueryProductGroupList(filter: {
  offset: number;
  limit: number;
  warehouseIds?: string[];
}) {
  const params = new URLSearchParams();
  params.append("offset", filter.offset.toString());
  params.append("limit", filter.limit.toString());
  if (filter.warehouseIds) {
    params.append("warehouseIds", filter.warehouseIds.join(","));
  }
  return useGenericSWR<
    ResponseType<{
      total: number;
      result: ProductGroupResult[];
    }>
  >(`/api/product-v2/group?${params.toString()}`);
}
