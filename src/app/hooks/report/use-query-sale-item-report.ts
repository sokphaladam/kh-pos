import { ResponseType } from "@/lib/types";
import { useGenericSWR } from "../use-generic";

export function useQuerySaleItemReport(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) {
    params.append("startDate", startDate);
  }
  if (endDate) {
    params.append("endDate", endDate);
  }

  return useGenericSWR<
    ResponseType<
      {
        description: string;
        qty: number;
        discount_amount: number;
        total_amount: number;
      }[]
    >
  >(`/api/report/sale/receipt?${params.toString()}`);
}
