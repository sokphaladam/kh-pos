import { ResponseType } from "@/lib/types";
import type {
  WasteListInput,
  WasteListResult,
} from "../api/waste/get-waste";
import type { RecordWasteBody } from "../api/waste/record-waste";
import { useGenericMutation, useGenericSWR } from "./use-generic";

export function useQueryWasteList(filter: WasteListInput) {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return useGenericSWR<ResponseType<WasteListResult>>(
    `/api/waste?${params.toString()}`,
  );
}

export function useRecordWaste() {
  return useGenericMutation<RecordWasteBody, ResponseType<string>>(
    "POST",
    "/api/waste",
  );
}
