import { z } from "zod";

export const formSupplierProductPriceSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  productVariantId: z.string().min(1, "Product Variant is required"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  effectDate: z.string().optional(),
  scheduledPrice: z.number().min(0).optional(),
  scheduledAt: z.string().optional(),
  productTitle: z.string().optional(),
  productImage: z.string().optional(),
  productPrice: z.number().optional(),
  productSku: z.string().optional(),
  productStock: z.number().optional(),
  productBarcode: z.string().optional(),
});

export type formSupplierProductPriceType = z.infer<
  typeof formSupplierProductPriceSchema
>;
