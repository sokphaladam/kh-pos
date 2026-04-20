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
  return useGenericSWR<ResponseType<unknown>>(
    `/api/report/warehouse/sale?${params.toString()}`,
  );
}
