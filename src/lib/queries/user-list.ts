import useSWR from "swr";
import { requestDatabase } from "../api";

export const useQueryUserList = (limit: number, offset: number) => {
  const {
    data: users,
    error,
    isLoading,
    mutate,
  } = useSWR(`/api/user?limit=${limit}&offset=${offset}`, (url) =>
    requestDatabase(url, "GET")
  );

  return { users, error, isLoading, mutate };
};
