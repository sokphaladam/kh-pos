import { requestDatabase, streamFetcher } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import useSWR, { KeyedMutator } from "swr";
import useSWRImmutable from "swr/immutable";
import useSWRMutation from "swr/mutation";
import useSWRSubscription from "swr/subscription";

export function useGenericMutation<InputType = unknown, OutputType = unknown>(
  type: "POST" | "PUT" | "DELETE",
  key: string,
) {
  return useSWRMutation<OutputType, unknown, string, InputType>(
    key,
    (key, { arg }) => {
      const callBy =
        window.location.pathname === "/menu" ? "CUSTOMER" : "ADMIN";
      return requestDatabase<OutputType>(key, type, arg, callBy);
    },
  );
}

export function useGenericSWR<OutputType = unknown>(
  key: string | null,
  options = {},
) {
  return useSWR<OutputType, unknown>(
    key,
    (key: string) => {
      const callBy =
        window.location.pathname === "/menu" ? "CUSTOMER" : "ADMIN";
      return requestDatabase<OutputType>(key, "GET", undefined, callBy);
    },
    {
      revalidateOnFocus: false,
      ...options,
    },
  );
}

type LazyRequestTuple<R, V> = [
  (v?: V) => Promise<void>,
  {
    data: R | null | undefined;
    error: Error | null;
    isLoading: boolean;
    mutate: KeyedMutator<R | null>;
    isValidating: boolean;
  },
];

export type Variable = Record<string, unknown>;

export const useLazyGenericSWR = <R, V = Variable>(
  key: string,
): LazyRequestTuple<R, V> => {
  const { mutate, ...rest } = useSWRImmutable<R | null>(key, null, {
    fallbackData: null,
    revalidateOnMount: false,
    revalidateOnFocus: false,
  });

  const executeQuery = useCallback(
    async (variables?: V) => {
      mutate(undefined, false);
      try {
        const callBy =
          window.location.pathname === "/menu" ? "CUSTOMER" : "ADMIN";
        const result = await requestDatabase<R>(key, "GET", variables, callBy);
        mutate(result, false);
      } catch (err) {
        mutate(null, false);
        throw err;
      }
    },
    [mutate, key],
  );

  return [executeQuery, { ...rest, mutate }];
};

export function useGenericSubscription({
  method = "GET",
  url,
  body,
  enabled = false,
}: {
  method?: "GET" | "POST" | "DELETE" | "PUT";
  url: string;
  body?: Record<string, unknown>;
  enabled?: boolean;
}) {
  const [logs, setLogs] = useState<string[]>([]);
  // SWR caches based on string keys. We stringify the configuration
  // so changes to data layers dynamically trigger new subscriptions.
  const subscriptionKey = enabled ? JSON.stringify({ url, body }) : null;

  const { data, error } = useSWRSubscription(
    subscriptionKey,
    (key, { next }) => {
      return streamFetcher(method, key, { next });
    },
  );

  useEffect(() => {
    if (data?.message) {
      setLogs((prevLogs) => [...prevLogs, data.message]);
    }
  }, [data?.message]);

  // Reset logs whenever the process is re-started
  useEffect(() => {
    if (!enabled) {
      setLogs([]);
    }
  }, [enabled]);

  return {
    progress: data?.progress ?? 0,
    message:
      data?.message ??
      (error ? "Pipeline disconnected unexpectedly." : "Standing by..."),
    logs,
    status: error ? "failed" : (data?.status ?? "idle"),
    isLoading: enabled && !data && !error,
  };
}
