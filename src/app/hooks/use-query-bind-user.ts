import { ResponseType } from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "./use-generic";
import { BindUserProps } from "@/classes/bind-user";

export interface BindUserListItem {
  userId: string;
  group: number;
  isMain: boolean;
  warehouseId: string | null;
}

export function useQueryBindUserGroup(userId: string) {
  return useGenericSWR<ResponseType<number>>(
    `/api/user/bind-user/group?userId=${userId}`,
  );
}

export function useQueryBindUserList(userId: string) {
  return useGenericSWR<ResponseType<unknown[]>>(
    `/api/user/bind-user?userId=${userId}`,
  );
}

export function useMutationCreateBindUser() {
  return useGenericMutation<BindUserProps, ResponseType<unknown>>(
    "POST",
    "/api/user/bind-user",
  );
}
