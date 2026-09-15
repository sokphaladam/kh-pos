import type { PublicInvoiceResult } from "@/app/api/public/invoice/[id]/route";
import { ResponseType } from "@/lib/types";
import { useGenericSWR } from "./use-generic";

export function useQueryPublicInvoice(orderId: string, warehouse: string) {
  const paramas = new URLSearchParams({
    warehouse: warehouse,
  });

  const key =
    orderId && warehouse
      ? `/api/public/invoice/${encodeURIComponent(orderId)}?${paramas.toString()}`
      : null;

  return useGenericSWR<ResponseType<PublicInvoiceResult>>(key);
}
