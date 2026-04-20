import { ResponseType } from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "./use-generic";
import { BacklogOrder } from "@/classes/back-log";

export function useQueryBacklog(offset: number, limit: number){
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  })

  return useGenericSWR<ResponseType<{ data: BacklogOrder[]; total: number }>>(`/api/back-log-order?${params.toString()}`)
}

export function useMutationBacklogResolve(){
  return useGenericMutation<{ backlogId: string },
  ResponseType<boolean>>('POST',`/api/back-log-order/resolve`)
}