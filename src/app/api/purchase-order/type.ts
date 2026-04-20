import { z } from "zod";

const orderItemStatus = z.enum([
  "pending",
  "received",
  "cancelled",
  "to_create",
  "to_delete",
]);

export const purchaseOrderFilterSchema = z.object({
  supplierId: z.string().optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  offset: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  status: z
    .enum(["draft", "approved", "completed", "deleted", "closed"])
    .optional(),
  warehouseId: z.string().optional(),
});

export const purchaseOrderSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string(),
  status: z.enum(["draft", "approved", "completed", "deleted", "closed"]),
  warehouseId: z.string(),
  purchasedAt: z.string(),
  expectedAt: z.string().nullable(),
  note: z.string().nullable(),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string().nullable(),
      stock: z.number().nullable(),
      qty: z.number().nullable(),
      status: orderItemStatus.optional(),
      amount: z.number().nullable(),
      receivedQty: z.number().nullable(),
      purchaseCost: z.string().nullable(),
      productVariantId: z.string().nullable(),
    })
  ),
  additionalCosts: z.array(
    z.object({
      id: z.string(),
      name: z.string().nullable(),
      cost: z.string().nullable(),
      status: orderItemStatus.optional(),
    })
  ),
});
