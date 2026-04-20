import { ResponseType } from "@/lib/types";
import { useGenericMutation } from "../use-generic";
import { TicketOrderSchemaType } from "@/classes/cinema/ticket-order";

export function useMutationManualTicketOrder() {
  return useGenericMutation<TicketOrderSchemaType, ResponseType<boolean>>(
    "POST",
    "/api/cinema/ticket-order/manual",
  );
}
