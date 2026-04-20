import {
  ComposeVariantProps,
  CompositionDraft,
} from "@/classes/composite-variant";
import { requestDatabase } from "@/lib/api";
import { ResponseType } from "@/lib/types";
import { useGenericMutation } from "./use-generic";

export function requestCompose(variantId: string, qty: number) {
  const params = new URLSearchParams({
    variantId,
    qty: qty.toString(),
  });
  return requestDatabase<ResponseType<CompositionDraft[]>>(
    `/api/composition/draft?${params.toString()}`
  );
}

export function useMutationCompose() {
  return useGenericMutation<ComposeVariantProps, ResponseType<boolean>>(
    "POST",
    `/api/composition`
  );
}
