import {
  CustomerInfo,
  UserInfo,
} from "@/lib/server-functions/get-auth-from-token";
import {
  LoginResponseType,
  MeResponseType,
  ResponseType,
  UserInput,
} from "@/lib/types";
import { CreateWarehouseV2Input } from "../api/warehouse-v2/route";
import { useGenericMutation, useGenericSWR } from "./use-generic";
import { WalkinLoginInput } from "@/classes/authentication/customer-auth";

export function useCreateUser() {
  return useGenericMutation<UserInput, UserInfo>("POST", "/api/user");
}

export function useLogin() {
  return useGenericMutation<
    { username: string; password: string },
    LoginResponseType
  >("POST", "/api/auth/login");
}

export function useMe() {
  return useGenericSWR<MeResponseType>("/api/user/me");
}

export function useUpdateUser() {
  return useGenericMutation<UserInput>("PUT", "/api/user");
}

export function useDeleteUser() {
  return useGenericMutation<{ id: string }, ResponseType<{ message: string }>>(
    "DELETE",
    "/api/user"
  );
}

export function useUserList(limit: number, offset: number) {
  return useGenericSWR<ResponseType<{ data: UserInfo[]; total: number }>>(
    `/api/user?limit=${limit}&offset=${offset}`
  );
}

export function useProduct(id: string) {
  return useGenericSWR(`/api/product/${id}`);
}

export function useDeleteUserRoles() {
  return useGenericMutation<
    { id: string[] },
    ResponseType<{ message: string }>
  >("DELETE", "/api/user/role");
}

export function useQueryHasUser() {
  return useGenericSWR<ResponseType<boolean>>("/api/user/has-user");
}

export function useMutationFirstUser() {
  return useGenericMutation<CreateWarehouseV2Input, ResponseType<string>>(
    "POST",
    "/api/user/first-user"
  );
}

export function useMutationChangePassword() {
  return useGenericMutation<
    { oldPassword: string; newPassword: string },
    ResponseType<unknown>
  >("POST", "/api/user/change-password");
}

export function useMutationResetPassword() {
  return useGenericMutation<
    { newPassword: string; userId: string },
    ResponseType<unknown>
  >("POST", "/api/user/reset-password");
}

export function useMutationCustomerWalkInLogin() {
  return useGenericMutation<WalkinLoginInput, { token: string }>(
    "POST",
    "/api/auth/customer/walk-in-login"
  );
}

export function useQueryCustomer() {
  return useGenericSWR<{ user: CustomerInfo } | { error: string }>(
    "/api/auth/customer/walk-in-login"
  );
}
