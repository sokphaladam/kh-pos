import type {
  PromotionSetInput,
  PromotionSetResponse,
} from "@/classes/promotion-set";
import type { PromotionSetChoiceSlot } from "@/app/api/promotion-set/types";
import type { PromotionSetDefinition } from "@/lib/promotion-set";
import { requestDatabase } from "@/lib/api";
import { ResponseType } from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "./use-generic";

export function useQueryPromotionSets(limit: number, offset: number) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return useGenericSWR<
    ResponseType<{ data: PromotionSetResponse[]; total: number }>
  >(`/api/promotion-set?${params.toString()}`);
}

/** Promotion sets running now for a branch (fed to the POS cart engine). */
export function useQueryActivePromotionSets(warehouseId?: string) {
  return useGenericSWR<ResponseType<PromotionSetDefinition[]>>(
    warehouseId
      ? `/api/promotion-set/active?warehouseId=${encodeURIComponent(warehouseId)}`
      : null,
  );
}

export function useCreatePromotionSet() {
  return useGenericMutation<PromotionSetInput, ResponseType<PromotionSetInput>>(
    "POST",
    "/api/promotion-set",
  );
}

export function useUpdatePromotionSet() {
  return useGenericMutation<PromotionSetInput, ResponseType<PromotionSetInput>>(
    "PUT",
    "/api/promotion-set",
  );
}

export function useDeletePromotionSet() {
  return useGenericMutation<{ id: string }, ResponseType<{ message: string }>>(
    "DELETE",
    "/api/promotion-set",
  );
}

/** Menu choices for each slot of a promotion set (restaurant POS picker). */
export async function requestPromotionSetChoices(id: string) {
  return requestDatabase<ResponseType<PromotionSetChoiceSlot[]>>(
    `/api/promotion-set/${encodeURIComponent(id)}/choices`,
    "GET",
  );
}
