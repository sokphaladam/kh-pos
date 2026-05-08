import { ProductWarehouseVisibility } from "@/classes/product-warehouse-visibility";
import { useGenericMutation } from "./use-generic";
import { ResponseType } from "@/lib/types";

export function useMutationSetProductWarehouseVisibility() {
  return useGenericMutation<
    { input: ProductWarehouseVisibility[] },
    ResponseType<unknown>
  >(`POST`, "/api/product-v2/warehouse-visibilty");
}

export function useMutationRemoveProductWarehouseVisibility() {
  return useGenericMutation<
    {
      input: {
        warehouseId: string;
        productId: string;
        productVariantId: string;
      }[];
    },
    ResponseType<unknown>
  >(`DELETE`, "/api/product-v2/warehouse-visibilty");
}

export function useMutationSetForSaleProductWarehouseVisibility() {
  return useGenericMutation<
    { productId: string; isForSale: boolean },
    ResponseType<unknown>
  >(`PUT`, "/api/product-v2/warehouse-visibilty/product");
}

export function useMutationSetVisibilityProductWarehouseVisibility() {
  return useGenericMutation<
    { productVariantId: string; isVisible: boolean },
    ResponseType<unknown>
  >(`PUT`, "/api/product-v2/warehouse-visibilty/product-variant");
}
