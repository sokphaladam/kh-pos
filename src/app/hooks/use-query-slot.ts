import { SlotDetail } from "@/classes/slot";
import {
  useGenericMutation,
  useGenericSWR,
  useLazyGenericSWR,
} from "./use-generic";
import { CreateSlotInput } from "../api/warehouse/slot/create-slot";
import { ResponseType } from "@/lib/types";

export function useQuerySearchSlot({
  keyword,
  warehouseId,
  limit,
  offset,
}: {
  keyword: string;
  warehouseId?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams({
    warehouse_id: warehouseId || "",
    search_name: keyword,
    limit: String(limit || 30),
    offset: String(offset || 0),
  });

  return useLazyGenericSWR<{ result: { data: SlotDetail[]; total: number } }>(
    `/api/warehouse/slot?${params.toString()}`
  );
}

export function useQuerySlotList({
  keyword,
  warehouseId,
  limit,
  offset,
}: {
  keyword: string;
  warehouseId?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams({
    warehouse_id: warehouseId || "",
    search_name: keyword,
    limit: String(limit || 30),
    offset: String(offset || 0),
  });

  return useGenericSWR<{ result: { data: SlotDetail[]; total: number } }>(
    `/api/warehouse/slot?${params.toString()}`
  );
}

export function useCreateSlot() {
  return useGenericMutation<CreateSlotInput, ResponseType<string>>(
    "POST",
    "/api/warehouse/slot"
  );
}

export function useUpdateSlot() {
  return useGenericMutation<CreateSlotInput, ResponseType<boolean>>(
    "PUT",
    "/api/warehouse/slot"
  );
}

export function useDeleteSlot() {
  return useGenericMutation<{ id: string }, ResponseType<boolean>>(
    "DELETE",
    "/api/warehouse/slot"
  );
}
