import { ResponseType } from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "./use-generic";
import { inputSettingType } from "../api/setting/setting-update";

export interface Setting {
  id: number;
  option: string | null;
  value: string | null;
  warehouse: string | null;
}

export function useQuerySetting() {
  return useGenericSWR<ResponseType<Setting[]>>("/api/setting");
}

export function useUpdateSetting() {
  return useGenericMutation<inputSettingType, ResponseType<unknown>>(
    "PUT",
    "/api/setting"
  );
}

export function useQueryPublicSetting(warehouseId?: string) {
  return useGenericSWR<ResponseType<Setting[]>>(
    "/api/warehouse/setting" + (warehouseId ? `?warehouse=${warehouseId}` : "")
  );
}
