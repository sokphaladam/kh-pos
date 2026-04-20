import { z } from "zod";
import { useGenericMutation } from "./use-generic";
import { convertProductVariantStockSchema } from "@/classes/product-variant-conversion";
import { ResponseType } from "@/lib/types";

export function useConvertVariantUnit() {
  return useGenericMutation<
    z.infer<typeof convertProductVariantStockSchema>,
    ResponseType<boolean>
  >("POST", "/api/unit-conversion");
}
