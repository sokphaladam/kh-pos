import { ProductCategory } from "@/repository/product-category-repository";
import { z } from "zod";

export interface ProductCategoryDetail {
  id: string;
  productId: string;
  categoryId: string;
  category?: ProductCategory | null;
}

export interface ProductCategoryUpdate {
  id?: string;
  categoryId: string;
  action: "update" | "create";
}

const productCategoryInputSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string(),
  action: z.enum(["update", "create", "delete"]),
});

export const productCategoryInputArraySchema = z.array(
  productCategoryInputSchema
);
