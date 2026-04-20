import { ResponseType } from "@/lib/types";
import { useGenericSWR } from "../use-generic";
import { StockReportRow } from "@/app/api/report/stock/stock-list";

export function useQueryReportStock(filter: {
  startDate: string;
  endDate: string;
  warehouseId: string;
  categoryIds?: string[];
  productId?: string;
}) {
  const params = new URLSearchParams();

  if (filter.startDate) {
    params.set("startDate", filter.startDate);
  }

  if (filter.endDate) {
    params.set("endDate", filter.endDate + " 23:59:59");
  }

  if (filter.warehouseId) {
    params.set("warehouseId", filter.warehouseId);
  }

  if (filter.categoryIds && filter.categoryIds.length > 0) {
    params.set("categoryIds", filter.categoryIds.join(","));
  }

  if (filter.productId) {
    params.set("productId", filter.productId);
  }

  return useGenericSWR<ResponseType<StockReportRow[]>>(
    `/api/report/stock?${params.toString()}`
  );
}
