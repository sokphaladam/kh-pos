import useSWRMutation from "swr/mutation";
import { requestDatabase } from "../api";

async function createUserFetcher(
  url: string,
  {
    arg,
  }: {
    arg: {
      phoneNumber: string;
      username: string;
      password: string;
      role: string;
    };
  }
) {
  return requestDatabase(url, "POST", arg);
}

export function useCreateUser() {
  const mutation = useSWRMutation("/api/user/create", createUserFetcher);

  return mutation;
}
