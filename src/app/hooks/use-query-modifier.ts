import { ResponseType } from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "./use-generic";
import { inputModifierType } from "../api/modifier/create-modifier";
import { ProductModifierType } from "@/dataloader/product-variant-loader";

export function useQueryModifier(filter: { limit: number; offset: number }) {
  const params = new URLSearchParams({
    limit: String(filter.limit),
    offset: String(filter.offset),
  });
  return useGenericSWR<
    ResponseType<{ total: number; data: ProductModifierType[] }>
  >(`/api/modifier?${params.toString()}`);
}

export function useMutationCreateModifier() {
  return useGenericMutation<
    inputModifierType,
    ResponseType<inputModifierType | null>
  >("POST", `/api/modifier`);
}

export function useMutationEditModifier() {
  return useGenericMutation<
    inputModifierType,
    ResponseType<inputModifierType | null>
  >("PUT", `/api/modifier`);
}

export function useMutationDeleteModifier() {
  return useGenericMutation<{ id: string }, ResponseType<boolean | null>>(
    "DELETE",
    `/api/modifier`
  );
}

export function useMutationAddBindProduct(id: string) {
  return useGenericMutation<{ productId: string }, ResponseType<boolean>>(
    "POST",
    `/api/modifier/${id}`
  );
}

export function useMutationRemoveBindProduct(id: string) {
  return useGenericMutation<{ productId: string }, ResponseType<boolean>>(
    "DELETE",
    `/api/modifier/${id}`
  );
}

export function useQueryModifierBindProduct(id: string) {
  return useGenericSWR<ResponseType<unknown>>(`/api/modifier/${id}`);
}
