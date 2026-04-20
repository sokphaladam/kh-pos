import { ProductImage } from "@/repository/product-image-repository";
import { z } from "zod";

export const inputProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  weight: z.number().optional(),
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  isComposite: z.boolean().optional(),
  useProduction: z.boolean().optional(),
  trackStock: z.boolean().optional(),
  isForSale: z.boolean().optional(),
});

export interface ProductInput {
  id: string;
  title: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  isComposite?: boolean;
  useProduction?: boolean;
  trackStock?: boolean;
  isForSale?: boolean;
}

export interface Product extends ProductInput {
  productImages?: ProductImage[];
}
