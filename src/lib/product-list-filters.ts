// Status filters of the admin product list, shared by the API route
// (validation), ProductServiceV2 (query) and the client filter bar.

export const PRODUCT_SALE_STATUS_FILTERS = ["for_sale", "not_for_sale"] as const;
export const PRODUCT_TYPE_FILTERS = [
  "standard",
  "composite",
  "made_to_order",
  "pre_produced",
] as const;
export const PRODUCT_STOCK_STATUS_FILTERS = [
  "low",
  "out",
  "not_tracked",
] as const;

export type ProductSaleStatusFilter =
  (typeof PRODUCT_SALE_STATUS_FILTERS)[number];
export type ProductTypeFilter = (typeof PRODUCT_TYPE_FILTERS)[number];
export type ProductStockStatusFilter =
  (typeof PRODUCT_STOCK_STATUS_FILTERS)[number];
