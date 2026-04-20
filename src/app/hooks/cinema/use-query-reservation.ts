import { schemaCinemaReservationInput } from "@/app/api/cinema/reservation/reservation-create";
import { useGenericMutation, useGenericSWR } from "../use-generic";
import { ResponseType } from "@/lib/types";
import { SeatReservation } from "@/classes/cinema/reservation";
import { requestDatabase } from "@/lib/api";

export function useMutationReservation() {
  return useGenericMutation<
    schemaCinemaReservationInput,
    ResponseType<unknown>
  >("POST", "/api/cinema/reservation");
}

export function useMutationSendReservationSocket() {
  return useGenericMutation<{ ids: string[] }, ResponseType<boolean>>(
    "POST",
    "/api/cinema/reservation/socket",
  );
}

export function useMutationUpdateStatusReservation(code: string) {
  return useGenericMutation<
    {
      status: "pending" | "confirmed" | "admitted" | "cancelled" | "expired";
      code: string;
    },
    ResponseType<boolean>
  >("PUT", `/api/cinema/reservation/${code}`);
}

export function useQueryReservationList(filter: {
  limit: number;
  offset: number;
  date?: string;
  status?: string[];
  showtimeId?: string;
}) {
  const params = new URLSearchParams();
  params.append("limit", filter.limit.toString());
  params.append("offset", filter.offset.toString());
  if (filter.date) {
    params.append("date", filter.date);
  }
  if (filter.status && filter.status.length > 0) {
    params.append("status", filter.status.join(","));
  }
  if (filter.showtimeId) {
    params.append("showtimeId", filter.showtimeId);
  }

  return useGenericSWR<
    ResponseType<{ data: SeatReservation[]; total: number }>
  >(`/api/cinema/reservation?${params.toString()}`);
}

export function requestReservationByCode(filter: {
  code?: string;
  customerPhone?: string;
}) {
  const params = new URLSearchParams();
  if (filter.code) {
    params.append("code", filter.code);
  }
  if (filter.customerPhone) {
    params.append("customerPhone", filter.customerPhone);
  }
  return requestDatabase<ResponseType<SeatReservation[] | null>>(
    `/api/cinema/reservation/code?${params.toString()}`,
  );
}
