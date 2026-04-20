import { table_product } from "@/generated/tables";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";
import { ProductImage } from "@/repository/product-image-repository";
import { ProductModifierType } from "./product-variant-loader";
import { ProductCategory } from "@/repository/product-category-repository";

export interface BasicProductType {
  id: string;
  title: string | null;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  isComposite?: boolean;
  useProduction?: boolean;
  trackStock?: boolean;
  isForSale?: boolean;
  images: ProductImage[];
  modifiers: ProductModifierType[];
  category?: ProductCategory | null;
}

export function createBasicProductLoader(db: Knex) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_product[] = await db<table_product>("product").whereIn(
      "id",
      keys,
    );

    const productImageLoader = LoaderFactory.productImageLoader(db);
    const modifierByProductLoader = LoaderFactory.modifierByProductLoader(db);
    const categoryLoader = LoaderFactory.categoryByProductLoader(db);

    return await Promise.all(
      keys.map(async (key) => {
        const row = rows.find((row) => row.id === key);
        if (!row) {
          return null;
        }

        const modifiers: ProductModifierType[] = row.id
          ? await modifierByProductLoader.load(row.id)
          : [];

        const category = row.id ? await categoryLoader.load(row.id) : null;

        return {
          id: row.id,
          title: row.title,
          description: row.description,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          deletedAt: row.deleted_at,
          weight: row.weight,
          length: row.length,
          width: row.width,
          height: row.height,
          isComposite: row.is_composite,
          useProduction: row.use_production,
          trackStock: row.track_stock === 1,
          isForSale: row.is_for_sale === 1,
          images: await productImageLoader.load(row.id!),
          modifiers,
          category: category ? category.at(0) : null,
        } as BasicProductType;
      }),
    );
  });
}
