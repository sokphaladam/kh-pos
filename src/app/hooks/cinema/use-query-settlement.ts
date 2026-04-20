import { ResponseType } from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "../use-generic";
import { ProducerSettlement } from "@/classes/cinema/settlement";
import { Showtime } from "@/classes/cinema/showtime";

export function useQuerySettlementList({
  limit,
  offset,
  startDate,
  endDate,
  isSettled,
}: {
  limit: number;
  offset: number;
  startDate?: string;
  endDate?: string;
  isSettled?: boolean;
}) {
  const params = new URLSearchParams();
  params.append("limit", String(limit));
  params.append("offset", String(offset));
  if (startDate && endDate) {
    params.append("startDate", startDate);
    params.append("endDate", endDate);
  }

  if (isSettled !== undefined) {
    params.append("isSettled", String(isSettled));
  }

  return useGenericSWR<
    ResponseType<{ data: ProducerSettlement[]; total: number }>
  >(`/api/cinema/settlement?${params.toString()}`);
}

export function useMutationGenerateSettlement() {
  return useGenericMutation<
    { startDate: string; endDate: string },
    ResponseType<unknown>
  >("POST", "/api/cinema/settlement");
}

export function useMutationSetSettlement() {
  return useGenericMutation<
    {
      settlementId: string;
      proofLink: string;
    },
    ResponseType<unknown>
  >("PUT", "/api/cinema/settlement");
}

export function useQuerySettlementById(id: string) {
  return useGenericSWR<
    ResponseType<ProducerSettlement & { showtimes: Showtime[] }>
  >(`/api/cinema/settlement/${id}`);
}
