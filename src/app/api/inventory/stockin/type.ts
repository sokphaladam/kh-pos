import { z } from "zod";

export const inputStockinSchema = z.object({
  variantId: z.string(),
  slotId: z.string(),
  qty: z.number(),
  productLot: z.object({
    lotNumber: z.string().optional(),
    expiredAt: z.string().optional(),
    manufacturedAt: z.string().optional(),
    costPerUnit: z.number().optional(),
  }),
});

export type StockinInput = z.infer<typeof inputStockinSchema>;
