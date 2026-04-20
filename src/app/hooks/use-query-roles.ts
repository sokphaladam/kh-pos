import {
  CreateRoleInput,
  Role,
  UpdateRoleInput,
} from "@/lib/server-functions/get-role-list";
import { useGenericMutation, useGenericSWR } from "./use-generic";

interface UpdateRoleResponse {
  message: string;
  success: boolean;
  result?: {
    message: string;
  };
}

export function useQueryRoles() {
  return useGenericSWR<Role[]>(`/api/user/role`);
}

export function useUpdateUserRole() {
  return useGenericMutation<UpdateRoleInput, UpdateRoleResponse>(
    "PUT",
    "/api/user/role"
  );
}

export function useCreateRoleMutation() {
  return useGenericMutation<CreateRoleInput, UpdateRoleResponse>(
    "POST",
    "/api/user/role"
  );
}
