import {
  ResponseType,
  WarehouseInput,
  WarehouseResponseType,
} from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "./use-generic";
import {
  CreateWarehouseV2Input,
  UpdateWarehouseV2Input,
} from "../api/warehouse-v2/route";
import { requestDatabase } from "@/lib/api";

export function useWarehouseList(limit: number, offset: number, id?: string[]) {
  const ids = id ? `id=${id?.join(",")}` : "";
  return useGenericSWR<
    ResponseType<{ data: WarehouseResponseType[]; total: number }>
  >(`/api/warehouse?limit=${limit}&offset=${offset}&${ids}`);
}

export function useCreateWarehouse() {
  return useGenericMutation<WarehouseInput>("POST", "/api/warehouse");
}

export function useUpdateWarehouse() {
  return useGenericMutation<WarehouseInput>("PUT", "/api/warehouse");
}

export function useDeleteWarehouse() {
  return useGenericMutation<{ id: string }, ResponseType<{ message: string }>>(
    "DELETE",
    "/api/warehouse-v2"
  );
}

export function useDeleteWarehouseSlot() {
  return useGenericMutation<
    { id: string[] },
    ResponseType<{ message: string }>
  >("DELETE", "/api/warehouse/slot");
}

// warehouse api for franchise model
export function useCreateWarehouseV2() {
  return useGenericMutation<CreateWarehouseV2Input, ResponseType<string>>(
    "POST",
    "/api/warehouse-v2"
  );
}

export function useUpdateWarehouseV2() {
  return useGenericMutation<UpdateWarehouseV2Input, ResponseType<string>>(
    "PUT",
    "/api/warehouse-v2"
  );
}

export function requestWarehouseList(
  limit: number,
  offset: number,
  id?: string[]
) {
  const ids = id ? `id=${id?.join(",")}` : "";
  return requestDatabase(
    `/api/warehouse?limit=${limit}&offset=${offset}&${ids}`,
    "GET",
    {}
  );
}
