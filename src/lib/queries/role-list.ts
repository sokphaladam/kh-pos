import useSWR from "swr";
import { requestDatabase } from "../api";

const fetchRoleList = (url: string) => {
  return requestDatabase(url, "GET");
};

export const useQueryRoleList = () => {
  const {
    data: roles,
    error,
    isLoading,
  } = useSWR("/api/user/role", (url) => fetchRoleList(url));

  return { roles, error, isLoading };
};
