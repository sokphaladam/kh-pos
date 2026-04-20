import { ResponseType } from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "./use-generic";
import { ShiftType } from "../api/shift/route";
import { requestDatabase } from "@/lib/api";

export function useOpenShift() {
  return useGenericMutation<unknown, ResponseType<string>>(
    "POST",
    "/api/shift/open"
  );
}

export function useCloseShift() {
  return useGenericMutation<unknown, ResponseType<boolean>>(
    "POST",
    "/api/shift/close"
  );
}

export function useQueryShift(
  openedBy?: string,
  limit: number = 30,
  offset: number = 0,
  id?: string
) {
  const params = new URLSearchParams();
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());
  if (openedBy) {
    params.append("openedBy", openedBy);
  }
  if (id) {
    params.append("id", id);
  }

  return useGenericSWR<ResponseType<{ total: number; data: ShiftType[] }>>(
    `/api/shift?${params.toString()}`
  );
}

export function requestShiftReceipt(id: string) {
  const params = new URLSearchParams({
    id,
  });
  return requestDatabase<
    ResponseType<{
      closedCashKhr: number;
      closedCashUsd: number;
      amountReturned: number;
    }>
  >(`/api/shift/close/receipt?${params.toString()}`);
}
