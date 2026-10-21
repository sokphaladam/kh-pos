import { ResponseType } from "@/lib/types";
import type { CountSheetItem } from "@/classes/stock-count";
import type { CreateStockCountBody } from "../api/stock-count/create-stock-count";
import type {
  StockCountListInput,
  StockCountListResult,
} from "../api/stock-count/get-stock-counts";
import type { StockCountDetail } from "../api/stock-count/[id]/route";
import { useGenericMutation, useGenericSWR } from "./use-generic";

function query(params: Record<string, unknown>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  return search.toString();
}

export function useQueryStockCounts(filter: StockCountListInput) {
  return useGenericSWR<ResponseType<StockCountListResult>>(
    `/api/stock-count?${query(filter)}`,
  );
}

export function useQueryCountSheet(
  slotId: string | undefined,
  date: string,
  expected: boolean,
) {
  return useGenericSWR<ResponseType<CountSheetItem[]>>(
    slotId
      ? `/api/stock-count/sheet?${query({ slotId, date, expected: expected ? "1" : "0" })}`
      : null,
  );
}

export function useQueryStockCount(id: string) {
  return useGenericSWR<ResponseType<StockCountDetail>>(
    `/api/stock-count/${id}`,
  );
}

export function useCreateStockCount() {
  return useGenericMutation<CreateStockCountBody, ResponseType<string>>(
    "POST",
    "/api/stock-count",
  );
}
