import { ResponseType } from "@/lib/types";
import type { StockDashboard } from "@/classes/stock-dashboard";
import { useGenericSWR } from "./use-generic";

export function useQueryStockDashboard(month: string) {
  return useGenericSWR<ResponseType<StockDashboard>>(
    `/api/report/stock-dashboard?month=${encodeURIComponent(month)}`,
  );
}
