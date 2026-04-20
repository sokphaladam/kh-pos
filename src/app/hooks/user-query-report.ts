import { ResponseType } from "@/lib/types";
import { useGenericSWR } from "./use-generic";

export function useQueryReportSale(filter: {
  startDate: string;
  endDate: string;
  warehouseId: string;
}) {
  const params = new URLSearchParams();

  if (filter.startDate) {
    params.set("startDate", filter.startDate);
  }

  if (filter.endDate) {
    params.set("endDate", filter.endDate);
  }

  if (filter.warehouseId) {
    params.set("warehouseId", filter.warehouseId);
  }

  return useGenericSWR<ResponseType<unknown>>(
    `/api/report/sale?${params.toString()}`
  );
}

export function useQueryReportMetrics(filter: {
  startDate: string;
  endDate: string;
}) {
  const params = new URLSearchParams();

  if (filter.startDate) {
    params.set("startDate", filter.startDate);
  }

  if (filter.endDate) {
    params.set("endDate", filter.endDate);
  }

  return useGenericSWR<ResponseType<unknown>>(
    `/api/report/metrics?${params.toString()}`
  );
}

export function useQueryVoidedOrderReport(filter: {
  startDate: string;
  endDate: string;
}) {
  const params = new URLSearchParams();

  if (filter.startDate) {
    params.set("startDate", filter.startDate);
  }

  if (filter.endDate) {
    params.set("endDate", filter.endDate);
  }
  return useGenericSWR<ResponseType<unknown>>(
    `/api/report/order/void?${params.toString()}`
  );
}

export function useQueryHotHourReport(filter: {
  startDate: string;
  endDate: string;
}) {
  const params = new URLSearchParams();

  if (filter.startDate) {
    params.set("startDate", filter.startDate);
  }

  if (filter.endDate) {
    params.set("endDate", filter.endDate);
  }

  return useGenericSWR<ResponseType<unknown[]>>(
    `/api/report/hot-hour?${params.toString()}`
  );
}

export function useQueryGuestNumberOrderReport(filter: {
  startDate: string;
  endDate: string;
}) {
  const params = new URLSearchParams();

  if (filter.startDate) {
    params.set("startDate", filter.startDate);
  }

  if (filter.endDate) {
    params.set("endDate", filter.endDate);
  }

  return useGenericSWR<ResponseType<unknown[]>>(
    `/api/report/order/guest?${params.toString()}`
  );
}
