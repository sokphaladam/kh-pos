import { ResponseType } from "@/lib/types";
import type { ReorderItem } from "@/classes/reorder";
import type { ReorderInput } from "../api/reorder/route";
import type { ApplyReorderLevelsBody } from "../api/reorder/apply/route";
import { useGenericMutation, useGenericSWR } from "./use-generic";

export function useQueryReorder(params: ReorderInput) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value));
  });
  return useGenericSWR<ResponseType<ReorderItem[]>>(
    `/api/reorder?${search.toString()}`,
  );
}

export function useApplyReorderLevels() {
  return useGenericMutation<ApplyReorderLevelsBody, ResponseType<number>>(
    "POST",
    "/api/reorder/apply",
  );
}
