import { ResponseType } from "@/lib/types";
import type {
  StockVarianceInput,
  StockVarianceResult,
} from "../api/report/stock-variance/route";
import { useGenericSWR } from "./use-generic";

export function useQueryStockVariance({ from, to }: StockVarianceInput) {
  const params = new URLSearchParams({ from, to });
  return useGenericSWR<ResponseType<StockVarianceResult>>(
    `/api/report/stock-variance?${params.toString()}`,
  );
}
