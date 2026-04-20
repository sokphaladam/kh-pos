import { ResponseType } from "@/lib/types";
import { useGenericSWR } from "../use-generic";
import { EndOfDayReportResponse } from "@/app/api/report/end-of-day/end-of-day-report";

export function useQueryEndOfDayReport(filter: {
  startDate: string;
  endDate: string;
  warehouseId?: string;
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
  return useGenericSWR<ResponseType<EndOfDayReportResponse>>(
    "/api/report/end-of-day?" + params.toString(),
  );
}
