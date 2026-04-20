import { LoaderFactory } from "@/dataloader/loader-factory";
import {
  ProductModifierType,
  ProductVariantType,
} from "@/dataloader/product-variant-loader";
import { table_product } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { ProductCategory } from "@/repository/product-category-repository";
import { ProductImage } from "@/repository/product-image-repository";
import { Knex } from "knex";
import { z } from "zod";
import { ProductVariantConversionType } from "./product-variant-conversion";

export interface ProductFilterProps {
  id?: string;
  limit?: number;
  offset?: number;
  searchTitle?: string;
  supplierId?: string;
  barcode?: string;
  categoryId?: string;
}

export interface ProductV2 {
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
  supplierId?: string | null;
  productImages: ProductImage[];
  productCategories: ProductCategory[];
  productVariants: ProductVariantType[];
  modifiers?: ProductModifierType[] | null;
  productConversions?: ProductVariantConversionType[];
}

export type BasicProduct = Omit<
  ProductV2,
  "productImages" | "productCategories" | "productVariants"
>;

export const inputProductBasicSchema = z.object({
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
  supplierId: z.string().optional().nullable(),
});

export type ProductInput = z.infer<typeof inputProductBasicSchema>;

export class ProductServiceV2 {
  constructor(
    protected trx: Knex,
    protected user: UserInfo,
  ) {}

  async mainProductList({
    id,
    limit,
    offset,
    searchTitle,
    supplierId,
    barcode,
    categoryId,
  }: ProductFilterProps) {
    const isMain = this.user.warehouse?.isMain || false;
    const query = this.trx
      .table("product")
      .select("product.*")
      .where("product.deleted_at", null);
    if (id) {
      query.where("id", id);
    }
    if (searchTitle) {
      query.where("title", "like", `%${searchTitle}%`);
    }
    if (supplierId) {
      query.where("supplier_id", supplierId);
    }
    if (categoryId) {
      query
        .innerJoin(
          "product_categories",
          "product_categories.product_id",
          "product.id",
        )
        .where({
          "product_categories.category_id": categoryId,
        });
    }

    if (barcode) {
      query.innerJoin(
        "product_variant",
        "product.id",
        "product_variant.product_id",
      );
      query.where("product_variant.barcode", barcode);
    }

    if (!isMain && !!this.user?.warehouse?.useMainBranchVisibility) {
      query
        .join("group_products", "group_products.product_id", "product.id")
        .join(
          "product_groups",
          "product_groups.group_id",
          "group_products.group_id",
        )
        .join(
          "warehouse_groups",
          "warehouse_groups.group_id",
          "group_products.group_id",
        )
        .where({
          "warehouse_groups.warehouse_id": this.user.currentWarehouseId!,
          "product_groups.deleted_at": null,
        });
    }

    query.orderBy("created_at", "desc");

    const { total } = await query
      .clone()
      .count("* as total")
      .first<{ total: number }>();

    const productList: table_product[] = await query
      .limit(limit || 30)
      .offset(offset || 0);

    const imageLoader = LoaderFactory.productImageLoader(this.trx);
    const categoryLoader = LoaderFactory.categoryByProductLoader(this.trx);
    const variantLoader = LoaderFactory.productVariantLoader(
      this.trx,
      this.user.currentWarehouseId!,
    );
    const modifierByProductLoader = LoaderFactory.modifierByProductLoader(
      this.trx,
    );

    const productConversionLoader =
      LoaderFactory.productVariantConversionLoader(
        this.trx,
        this.user.currentWarehouseId!,
      );

    const data: ProductV2[] = await Promise.all(
      productList.map(async (p) => ({
        id: p.id!,
        title: p.title,
        description: p.description,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        deletedAt: p.deleted_at,
        productImages: p.id ? await imageLoader.load(p.id) : [],
        productCategories: p.id ? await categoryLoader.load(p.id) : [],
        productVariants: p.id ? await variantLoader.load(p.id) : [],
        weight: p.weight,
        length: p.length,
        width: p.width,
        height: p.height,
        isComposite: p.is_composite === 1,
        useProduction: p.use_production === 1,
        trackStock: p.track_stock === 1,
        isForSale: p.is_for_sale === 1,
        modifiers: p.id
          ? ((await modifierByProductLoader.load(p.id)).filter(
              (m) => m !== null,
            ) as ProductModifierType[])
          : [],
        productConversions: p.id
          ? await productConversionLoader.load(p.id)
          : [],
      })),
    );
    return {
      data,
      total,
    };
  }

  async groupProductByCategory() {
    const query = this.trx
      .table("product")
      .select("*")
      .where("deleted_at", null);

    query.orderBy("created_at", "desc");

    const productList: table_product[] = await query;
    const imageLoader = LoaderFactory.productImageLoader(this.trx);
    const categoryLoader = LoaderFactory.categoryByProductLoader(this.trx);
    const variantLoader = LoaderFactory.productVariantLoader(
      this.trx,
      this.user.currentWarehouseId!,
    );

    const data: ProductV2[] = await Promise.all(
      productList.map(async (p) => ({
        id: p.id!,
        title: p.title,
        description: p.description,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        deletedAt: p.deleted_at,
        productImages: p.id ? await imageLoader.load(p.id) : [],
        productCategories: p.id ? await categoryLoader.load(p.id) : [],
        productVariants: p.id ? await variantLoader.load(p.id) : [],
        weight: p.weight,
        length: p.length,
        width: p.width,
        height: p.height,
        isComposite: p.is_composite === 1,
        useProduction: p.use_production === 1,
        trackStock: p.track_stock === 1,
        isForSale: p.is_for_sale === 1,
      })),
    );

    const grouped: Record<string, ProductV2[]> = {
      All: [],
    };

    data.forEach((p) => {
      p.productCategories.forEach((c) => {
        if (!grouped[c.title]) {
          grouped[c.title] = [];
        }
        grouped["All"].push(p);
        grouped[c.title].push(p);
      });
    });

    return grouped;
  }

  async createProduct(input: ProductInput, id?: string) {
    const now = Formatter.getNowDateTime();
    const productId = id ? id : generateId();
    await this.trx.table<table_product>("product").insert({
      id: productId,
      title: input.title,
      description: input.description,
      created_at: now,
      weight: input.weight,
      length: input.length,
      width: input.width,
      height: input.height,
      is_composite: input.isComposite ? 1 : 0,
      use_production: input.useProduction ? 1 : 0,
      track_stock: input.trackStock ? 1 : 0,
      is_for_sale: input.isForSale ? 1 : 0,
      supplier_id: input.supplierId ?? null,
      created_by: this.user.id,
    });
    return productId;
  }

  async updateProduct(input: ProductInput, id: string) {
    const now = Formatter.getNowDateTime();

    await this.trx
      .table<table_product>("product")
      .where("id", id)
      .update({
        title: input.title,
        description: input.description,
        updated_at: now,
        weight: input.weight,
        length: input.length,
        width: input.width,
        height: input.height,
        is_composite: input.isComposite ? 1 : 0,
        use_production: input.useProduction ? 1 : 0,
        track_stock: input.trackStock ? 1 : 0,
        is_for_sale: input.isForSale ? 1 : 0,
        supplier_id: input.supplierId || null,
        updated_by: this.user.id,
      });
    return true;
  }

  async deleteProduct(id: string) {
    const now = Formatter.getNowDateTime();
    await this.trx.table<table_product>("product").where("id", id).update({
      deleted_at: now,
      deleted_by: this.user.id,
    });
    return true;
  }
  async getBasicProductById(id: string): Promise<BasicProduct | null> {
    const product = await this.trx
      .table<table_product>("product")
      .where("id", id)
      .where("deleted_at", null)
      .first();
    if (!product) {
      return null;
    }

    return {
      id: product.id!,
      title: product.title,
      description: product.description,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      deletedAt: product.deleted_at,
      weight: product.weight,
      length: product.length,
      width: product.width,
      height: product.height,
      isComposite: product.is_composite === 1,
      useProduction: product.use_production === 1,
      trackStock: product.track_stock === 1,
      isForSale: product.is_for_sale === 1,
      supplierId: product.supplier_id,
    };
  }
}
