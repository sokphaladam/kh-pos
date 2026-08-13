import { DiscountByProduct } from "@/dataloader/discount-by-product-loader";
import {
  ProductModifierType,
  ProductVariantType,
} from "@/dataloader/product-variant-loader";
import { ProductCategory } from "@/repository/product-category-repository";
import { ProductImage } from "@/repository/product-image-repository";
import { z } from "zod";

export interface ProductSearchFilter {
  search?: string;
  limit?: number;
  offset?: number;
  warehouse?: string;
  sku?: string;
  barcode?: string;
  replenishment?: boolean;
  categoryKeys?: string[] | string;
  supplierId?: string;
  type?: "all" | "pos";
  includeProductNotForSale?: boolean;
  compositeOnly?: boolean;
}

export interface ProductSearchResult {
  productId: string;
  variantId: string;
  warehouseId: string;
  productTitle: string;
  price?: number;
  stock?: number;
  sku?: string;
  barcode?: string;
  purchasedCost?: number;
  incomingStock?: number;
  images?: ProductImage[];
  variants?: ProductVariantType[];
  modifiers?: ProductModifierType[] | null;
  discounts?: DiscountByProduct[] | null;
  category?: ProductCategory | null;
}

export const productSearchFilterSchema = z.object({
  search: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
  warehouse: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  replenishment: z.string().default("false"),
  categoryKeys: z.string().optional(),
  compositeOnly: z.string().default("false"),
  supplierId: z.string().optional(),
  type: z.enum(["all", "pos"]).default("all"),
  includeProductNotForSale: z.string().default("false"),
});
