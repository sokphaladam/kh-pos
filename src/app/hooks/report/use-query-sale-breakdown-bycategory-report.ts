import { ResponseType } from "@/lib/types";
import { useGenericSWR } from "../use-generic";
import { SaleByCategoryReportRow } from "@/app/api/report/sale-by-category/sale-by-category";

export function useQueryReportSaleBreakdownByCategory(filter: {
  startDate: string;
  endDate: string;
  warehouseId: string;
  groupBy: "product" | "time";
  userIds?: string[];
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
  if (filter.groupBy) {
    params.set("groupBy", filter.groupBy);
  }

  if (filter.userIds && filter.userIds.length > 0) {
    params.set("userIds", filter.userIds.join(","));
  }

  if (filter.categoryIds && filter.categoryIds.length > 0) {
    params.set("categoryIds", filter.categoryIds.join(","));
  }

  if (filter.productId) {
    params.set("productId", filter.productId);
  }

  return useGenericSWR<ResponseType<SaleByCategoryReportRow[]>>(
    `/api/report/sale-by-category?${params.toString()}`
  );
}
