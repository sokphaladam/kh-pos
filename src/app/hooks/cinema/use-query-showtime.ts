import { ResponseType } from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "../use-generic";
import { Showtime } from "@/classes/cinema/showtime";
import { SchemaShowtimeInputType } from "@/app/api/cinema/showtime/shotime-create";
import { SchemaUpdateShowtimeInputType } from "@/app/api/cinema/showtime/showtime-update";

export function useQueryShowtimeList(
  limit: number,
  offset: number,
  status?: string[],
  showDate?: string,
  movieId?: string,
) {
  const params = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
  });

  if (status && status.length > 0) {
    params.append("status", status.join(","));
  }

  if (showDate) {
    params.append("showDate", showDate);
  }

  if (movieId) {
    params.append("movieId", movieId);
  }

  return useGenericSWR<ResponseType<{ data: Showtime[]; total: number }>>(
    `/api/cinema/showtime?${params.toString()}`,
  );
}

export function useMutationCreateShowtime() {
  return useGenericMutation<SchemaShowtimeInputType, ResponseType<boolean>>(
    "POST",
    "/api/cinema/showtime",
  );
}

export function useMutationUpdateShowtime() {
  return useGenericMutation<
    SchemaUpdateShowtimeInputType,
    ResponseType<boolean>
  >("PUT", "/api/cinema/showtime");
}

export function useMutationDeleteShowtime() {
  return useGenericMutation<{ id: string }, ResponseType<boolean>>(
    "DELETE",
    "/api/cinema/showtime",
  );
}

export function useQueryShowtimeReport(filter: {
  startDate: string;
  endDate: string;
  warehouseId?: string;
}) {
  const { startDate, endDate, warehouseId } = filter;
  const params = new URLSearchParams({
    startDate,
    endDate,
  });
  if (warehouseId) {
    params.append("warehouseId", warehouseId);
  }
  return useGenericSWR<ResponseType<unknown>>(
    `/api/report/cinema/showtime?${params.toString()}`,
  );
}
