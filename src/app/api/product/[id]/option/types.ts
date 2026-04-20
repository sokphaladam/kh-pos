import { z } from "zod";

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price?: number;
  available: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  optionValues: ProductOptionValue[];
  purchasedCost: number;
  visible: boolean;
}

export interface ProductVariantByWarehouse {
  id: string;
  variantId: string;
  warehouseId: string;
  stock?: number;
  price?: number;
  lowStock?: number;
  idealStock?: number;
  createdAt?: string;
  enabled: boolean;
  deletedAt?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  values: ProductOptionValue[];
}

export interface ProductOptionValue {
  id: string;
  value: string;
  createdAt?: string;
  updatedAt?: string;
}

export const productVariantSchema = z
  .array(
    z.object({
      id: z.string().nonempty(),
      name: z.string().nonempty(),
      sku: z.string().nonempty(),
      barcode: z.string().optional().nullable(),
      price: z.number().optional().nullable(),
      available: z.boolean(),
      isDefault: z.boolean(),
      optionValues: z
        .array(
          z.object({
            id: z.string().nonempty(),
            value: z.string(),
          })
        )
        .min(1, "optionValues must have at least one item"),
    })
  )
  .min(1, "variants must have at least one item");

export const productOptionSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    values: z.array(
      z.object({
        id: z.string(),
        value: z.string(),
      })
    ),
  })
);

export const productVariantByWarehouseSchema = z
  .array(
    z.object({
      id: z.string().nonempty(),
      variantId: z.string().nonempty(),
      warehouseId: z.string().nonempty(),
      stock: z.number().optional().nullable(),
      price: z.number().optional().nullable(),
      lowStock: z.number().optional().nullable(),
      idealStock: z.number().optional().nullable(),
      enabled: z.boolean(),
      deletedAt: z.string().optional().nullable(),
    })
  )
  .optional();

export interface ProductOptionAndVariant {
  options: ProductOption[];
  variants: ProductVariant[];
  byWarehouse: ProductVariantByWarehouse[];
}

export const productOptionAndVariantSchema = z.object({
  options: productOptionSchema,
  variants: productVariantSchema,
  byWarehouse: productVariantByWarehouseSchema,
});
