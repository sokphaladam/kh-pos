import { ResponseType } from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "./use-generic";
import { InventoryTransaction } from "@/dataloader/inventory-transaction-loader";
import { TransferInput } from "../api/inventory/transfer/route";

export function useQueryInventoryTransaction(
  offset: number,
  limit: number,
  status?: string
) {
  const params = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
  });

  if (status) {
    params.append("status", status);
  }

  return useGenericSWR<
    ResponseType<{ total: number; data: InventoryTransaction[] }>
  >(`/api/inventory-transactions?${params.toString()}`);
}

export function useMutationTransferInventory() {
  return useGenericMutation<TransferInput, ResponseType<boolean>>(
    "POST",
    `/api/inventory/transfer`
  );
}
