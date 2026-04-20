import { useGenericMutation } from "../use-generic";

export function useQueryCinemaShowtimeSendEmail() {
  return useGenericMutation<
    { date: string },
    { success: boolean; result: unknown }
  >("POST", "/api/reports/cinema-showtime/send-email");
}
