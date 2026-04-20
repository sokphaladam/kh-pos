import {
  PurchaseOrderFilter,
  SupplierPurchaseOrder,
  SupplierPurchaseOrderDetail,
  SupplierPurchaseOrderInput,
} from "@/classes/purchase-order-service";
import {
  useGenericMutation,
  useGenericSWR,
  useLazyGenericSWR,
} from "./use-generic";
import { ResponseType } from "@/lib/types";
import { ReceivedItem } from "@/classes/receive-po";

export function useCreatePurchaseOrder() {
  return useGenericMutation<
    SupplierPurchaseOrderInput,
    ResponseType<SupplierPurchaseOrder>
  >("POST", "/api/purchase-order");
}

export function useQueryPurchaseOrderList(filter: PurchaseOrderFilter) {
  const params = new URLSearchParams(
    filter as unknown as Record<string, string>
  ).toString();
  return useGenericSWR<{ result: SupplierPurchaseOrder[] }>(
    `/api/purchase-order?${params}`
  );
}

export function useQueryPurchaseOrderDetails(id: string) {
  const { data, ...rest } = useGenericSWR<
    ResponseType<SupplierPurchaseOrderDetail>
  >(`/api/purchase-order/detail/${id}`);

  return { ...rest, data: data?.result };
}

export function useLazyQueryPurchaseOrderDetails(id?: string) {
  return useLazyGenericSWR<ResponseType<SupplierPurchaseOrderDetail>>(
    `/api/purchase-order/detail/${id}`
  );
}

export function useUpdatePurchaseOrder() {
  return useGenericMutation<SupplierPurchaseOrderInput, ResponseType<string>>(
    "PUT",
    "/api/purchase-order"
  );
}

export function useDeletePurchaseOrder() {
  return useGenericMutation<{ id: string }, ResponseType<boolean>>(
    "DELETE",
    "/api/purchase-order"
  );
}

export function useReceivePurhcaseOrder() {
  return useGenericMutation<
    {
      purchaseOrderId: string;
      receivedItems: ReceivedItem[];
    },
    ResponseType<ReceivedItem>
  >("POST", "/api/purchase-order/receive");
}
