import { ProductFilterProps, ProductV2 } from "@/classes/product-v2";
import { StockCountingProps } from "@/classes/stock-counting";
import { InventoryTransaction } from "@/dataloader/inventory-transaction-loader";
import { Slot } from "@/dataloader/slot-loader";
import { requestDatabase } from "@/lib/api";
import { ResponseType } from "@/lib/types";
import { InputStockInSchema } from "../api/inventory/stock-in/route";
import { InputStockOutWithLotSchema } from "../api/inventory/stock-out/route";
import { ProductDetail } from "../api/product-v2/[id]/get-product-detail";
import { ProductInput } from "../api/product-v2/create-product";
import {
  ProductSearchFilter,
  ProductSearchResult,
} from "../api/product/search-product/types";
import {
  useGenericMutation,
  useGenericSWR,
  useLazyGenericSWR,
} from "./use-generic";

export function useLazyQuerySearchProduct(filter: ProductSearchFilter) {
  const params = new URLSearchParams(
    filter as unknown as Record<string, string>,
  ).toString();

  return useLazyGenericSWR<{ result: ProductSearchResult[] }>(
    `/api/product/search-product?${params}`,
  );
}

export function useLazyQuerySearchProductList(filter: ProductFilterProps) {
  const params = new URLSearchParams({
    limit: String(filter.limit),
    offset: String(filter.offset),
    ...(filter.id ? { id: filter.id } : {}),
    ...(filter.searchTitle ? { searchTitle: filter.searchTitle } : {}),
  });

  return useLazyGenericSWR<ResponseType<{ data: ProductV2[]; total: number }>>(
    `/api/product-v2?${params}`,
  );
}

export function useProductList(filter: ProductFilterProps) {
  const params = new URLSearchParams({
    limit: String(filter.limit),
    offset: String(filter.offset),
    ...(filter.id ? { id: filter.id } : {}),
    ...(filter.searchTitle ? { searchTitle: filter.searchTitle } : {}),
    ...(filter.supplierId ? { supplierId: filter.supplierId } : {}),
    ...(filter.barcode ? { barcode: filter.barcode } : {}),
    ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
  });

  return useGenericSWR<ResponseType<{ data: ProductV2[]; total: number }>>(
    `/api/product-v2?${params.toString()}`,
  );
}

export function useLazyPublicProductList(filter: ProductSearchFilter) {
  const params = new URLSearchParams(
    filter as unknown as Record<string, string>,
  ).toString();

  return useLazyGenericSWR<{ result: ProductSearchResult[] }>(
    `/api/product-v2/menu?${params}`,
  );
}

export function useProduct(id: string) {
  return useGenericSWR<ResponseType<ProductDetail>>(`/api/product-v2/${id}`);
}

export function useCreateProduct() {
  return useGenericMutation<ProductInput>("POST", "/api/product-v2");
}

export function useUpdateProduct() {
  return useGenericMutation<ProductInput>("PUT", "/api/product-v2");
}

export function useDeleteProduct() {
  return useGenericMutation<{ id: string }, ResponseType<boolean>>(
    "DELETE",
    `/api/product-v2`,
  );
}

export function requestSearchProduct(
  barcode?: string,
  by: "BARCODE" | "SKU" | "TITLE" = "BARCODE",
) {
  let search = `barcode=${barcode}`;

  if (by === "SKU") {
    search = `sku=${barcode}`;
  }

  if (by === "TITLE") {
    search = `title=${barcode}`;
  }

  return requestDatabase(`/api/product/search-product?${search}`, "GET");
}

export function useQueryInventorySlotByVariant(variantId: string) {
  return useGenericSWR<ResponseType<(Slot | null)[]>>(
    `/api/inventory/get-slot-by-variant?id=${variantId}`,
  );
}

export function requestInventoryStockDetailCount(
  variantId: string,
  slotId: string,
) {
  const param = new URLSearchParams({
    variant_id: variantId,
    slot_id: slotId,
  });
  return requestDatabase(
    `/api/inventory/get-stock-detail-for-counting?${param.toString()}`,
  );
}

export function useCreateInventoryCountStock() {
  return useGenericMutation<StockCountingProps, ResponseType<boolean>>(
    "POST",
    "/api/inventory/count-stock",
  );
}

export function useCreateInventoryStockIn() {
  return useGenericMutation<
    InputStockInSchema,
    ResponseType<{ transactionId: string; lotId: string }>
  >("POST", "/api/inventory/stock-in");
}

export function useCreateInventoryStockOutWithLot() {
  return useGenericMutation<InputStockOutWithLotSchema, ResponseType<string[]>>(
    "POST",
    "/api/inventory/stock-out",
  );
}

export function useQueryProductVariantTransaction(variantId: string) {
  const param = new URLSearchParams({
    variant_id: variantId,
  });
  return useGenericSWR<ResponseType<InventoryTransaction[]>>(
    `/api/product-v2/variant-transaction?${param.toString()}`,
  );
}

export function useQueryGroupProductByCategory() {
  return useGenericSWR<ResponseType<Record<string, ProductV2[]>>>(
    `/api/product-v2/group-product-by-category`,
  );
}
