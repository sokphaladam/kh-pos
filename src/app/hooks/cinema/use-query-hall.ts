import { ResponseType } from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "../use-generic";
import { SchemaHallInputType } from "@/app/api/cinema/hall/hall-create";
import { SchemaUpdateHallInputType } from "@/app/api/cinema/hall/hall-update";
import { CinemaHall } from "@/classes/cinema/hall";

export function useMutationCreateHall() {
  return useGenericMutation<SchemaHallInputType, ResponseType<boolean>>(
    "POST",
    "/api/cinema/hall"
  );
}

export function useMutationUpdateHall() {
  return useGenericMutation<SchemaUpdateHallInputType, ResponseType<boolean>>(
    "PUT",
    "/api/cinema/hall"
  );
}

export function useMutationDeleteHall() {
  return useGenericMutation<{ id: string }, ResponseType<boolean>>(
    "DELETE",
    "/api/cinema/hall"
  );
}

export function useQueryHallList(
  limit: number,
  offset: number,
  status?: string[]
) {
  const params = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
  });

  if (status && status.length > 0) {
    params.append("status", status.join(","));
  }

  return useGenericSWR<ResponseType<{ data: CinemaHall[]; total: number }>>(
    `/api/cinema/hall?${params.toString()}`
  );
}
