import { Printer } from "@/classes/print-server";
import { ResponseType } from "@/lib/types";
import { useGenericMutation, useGenericSWR } from "./use-generic";

export function useQueryPrinters() {
  const { data, error, isLoading, mutate } =
    useGenericSWR<ResponseType<Printer[]>>("/api/printer");

  return {
    printers: data?.result || [],
    error,
    isLoading,
    mutate,
  };
}

export function useMutationPrinter() {
  return useGenericMutation<{html: string}, ResponseType<unknown>>('POST',"/api/printer");
}