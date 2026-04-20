import { ResponseType } from "@/lib/types";
import { useGenericSWR } from "./use-generic";
import { ProductExpiryReport } from "@/classes/reports/product-expiry";

export function useQueryExpiryReport() {
  return useGenericSWR<ResponseType<ProductExpiryReport>>(
    `/api/reports/expiry`
  );
}
