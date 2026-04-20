import { ResponseType } from "@/lib/types";
import {
  useGenericMutation,
  useGenericSWR,
  useLazyGenericSWR,
} from "./use-generic";
import {
  Replenishment,
  ReplenishmentCreateType,
  ReplenishmentDetail,
  ReplenishmentFilterType,
  ReplenishmentSuggestionByWarehouse,
  ReplenishmentSuggestionProduct,
} from "@/classes/replenishment";
import { ReceivedReplenishedItem } from "@/classes/receive-replenishment";
import {
  FindProductInSlotResult,
  FindProductProps,
} from "@/classes/find-product-in-slot";
import { UpdatePickingList } from "../api/replenishment/[id]/stock-picking-list/route";
import { requestDatabase } from "@/lib/api";

type ReplenishmentTypeResponse = ResponseType<{
  replenishmentInfo: Replenishment;
  replenishmentDetails: ReplenishmentDetail[];
  replenishmentPickingList?: FindProductInSlotResult[];
}>;

export function useQueryReplenishmentList(filter: ReplenishmentFilterType) {
  const params = new URLSearchParams(
    filter as unknown as Record<string, string>,
  ).toString();
  const { data, ...rest } = useGenericSWR<
    ResponseType<{
      data: Replenishment[];
    }>
  >(`/api/replenishment?${params}`);

  return { data: data?.result?.data ?? [], ...rest };
}

export function useQueryReplenishmentDetail(id: string) {
  const { data, ...rest } = useGenericSWR<ReplenishmentTypeResponse>(
    `/api/replenishment/${id}`,
  );
  return { data: data?.result, ...rest };
}

export function useLazyQueryReplenishmentDetail(id?: string) {
  return useLazyGenericSWR<ReplenishmentTypeResponse>(
    `/api/replenishment/${id}`,
  );
}

export function useCreateReplenishment() {
  return useGenericMutation<ReplenishmentCreateType, ResponseType<string>>(
    "POST",
    "/api/replenishment",
  );
}

export function useUpdateReplenishment() {
  return useGenericMutation<
    ReplenishmentCreateType & { id: string },
    ResponseType<boolean>
  >("PUT", "/api/replenishment");
}

export function useMutationRecieveReplenishment() {
  return useGenericMutation<
    {
      replenishmentId: string;
      receivedItems: ReceivedReplenishedItem[];
    },
    ResponseType<boolean>
  >("POST", "/api/replenishment/receive");
}

export function useMutationDeleteReplenishment() {
  return useGenericMutation<{ id: string }, ResponseType<boolean>>(
    "DELETE",
    "/api/replenishment",
  );
}

export function useQueryReplenishmentSuggestion(
  fromwarehouseId: string,
  toWarehouseId: string,
) {
  return useGenericSWR<ResponseType<ReplenishmentSuggestionProduct[]>>(
    `/api/replenishment/suggest?fromWarehouseId=${fromwarehouseId}&toWarehouseId=${toWarehouseId}`,
  );
}

export function useQueryReplenishmentPickingList(
  replenishmentId: string,
  items?: FindProductProps[],
  forReplenishment?: number,
  needConversion?: number,
) {
  const params = new URLSearchParams();
  if (items) {
    params.append("items", JSON.stringify(items));
  }
  if (forReplenishment !== undefined) {
    params.append("forReplenishment", String(forReplenishment));
  }
  if (needConversion !== undefined) {
    params.append("needConversion", String(needConversion));
  }
  return useLazyGenericSWR<ResponseType<FindProductInSlotResult[]>>(
    `/api/replenishment/${replenishmentId}/stock-picking-list?${params.toString()}`,
  );
}

export function requestReplenishmentPickingList(
  replenishmentId: string,
  items?: FindProductProps[],
  forReplenishment?: number,
  needConversion?: number,
) {
  const params = new URLSearchParams();
  if (items) {
    params.append("items", JSON.stringify(items));
  }
  if (forReplenishment !== undefined) {
    params.append("forReplenishment", String(forReplenishment));
  }
  if (needConversion !== undefined) {
    params.append("needConversion", String(needConversion));
  }
  return requestDatabase(
    `/api/replenishment/${replenishmentId}/stock-picking-list?${params.toString()}`,
    "GET",
  );
}

export function useMutationUpdateReplenishmentPickingList(
  replenishedId: string,
) {
  return useGenericMutation<UpdatePickingList, ResponseType<boolean>>(
    "PUT",
    `/api/replenishment/${replenishedId}/stock-picking-list`,
  );
}

export function requestUpdateReplenishmentPickingList(
  replenishedId: string,
  body: UpdatePickingList,
) {
  return requestDatabase<ResponseType<boolean>>(
    `/api/replenishment/${replenishedId}/stock-picking-list`,
    "PUT",
    body,
  );
}

export function useMutationApproveReplenishment(replenishedId: string) {
  return useGenericMutation<unknown, ResponseType<boolean>>(
    "PUT",
    `/api/replenishment/${replenishedId}/approve`,
  );
}

export function useQueryReplenishmentSuggestionByWarehouse(
  fromwarehouseId: string,
) {
  const { data, ...rest } = useGenericSWR<
    ResponseType<ReplenishmentSuggestionByWarehouse[]>
  >(`/api/replenishment/suggest?fromWarehouseId=${fromwarehouseId}`);

  return { data: data?.result ?? [], ...rest };
}

export function useMutationVerifyReplenishmentPickingList(
  replenishedId: string,
) {
  return useGenericMutation<{ lotId: string }, ResponseType<boolean>>(
    "POST",
    `/api/replenishment/${replenishedId}/stock-picking-list`,
  );
}
