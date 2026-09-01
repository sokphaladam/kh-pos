import { ResponseType } from "@/lib/types";
import { useGenericSWR } from "../use-generic";

export function useQuerySaleByWarehouse(filters: {
  startDate: string;
  endDate: string;
}) {
  const params = new URLSearchParams();
  if (filters.startDate) {
    params.append("startDate", filters.startDate);
  }
  if (filters.endDate) {
    params.append("endDate", filters.endDate);
  }
  // The report endpoint requires both dates; firing before they're set
  // returns a 500 (Zod validation error). Hold the request until we have them.
  const key =
    filters.startDate && filters.endDate
      ? `/api/report/warehouse/sale?${params.toString()}`
      : null;
  return useGenericSWR<ResponseType<unknown>>(key);
}
