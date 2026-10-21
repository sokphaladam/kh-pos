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
import {
  ProductSaleStatusFilter,
  ProductStockStatusFilter,
  ProductTypeFilter,
} from "@/lib/product-list-filters";
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
  saleStatus?: ProductSaleStatusFilter;
  productType?: ProductTypeFilter;
  stockStatus?: ProductStockStatusFilter;
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
    saleStatus,
    productType,
    stockStatus,
  }: ProductFilterProps) {
    const isMain = this.user.warehouse?.isMain || false;
    const query = this.trx.table("product").where("product.deleted_at", null);
    if (id) {
      query.where("product.id", id);
    }
    // Every word must match the title or one of the product's live variants
    // (name, SKU, barcode), so "coke 330" finds "Coca-Cola" / "330ml" and a
    // scanned barcode finds its product.
    const searchTokens = (searchTitle ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 8)
      .map((t) => `%${t.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    for (const like of searchTokens) {
      query.where((qb) => {
        qb.where("product.title", "like", like).orWhereExists((sub) => {
          sub
            .select(this.trx.raw("1"))
            .from("product_variant as pv_search")
            .whereRaw("pv_search.product_id = product.id")
            .whereNull("pv_search.deleted_at")
            .where((v) => {
              v.where("pv_search.name", "like", like)
                .orWhere("pv_search.barcode", "like", like)
                .orWhereRaw("CAST(pv_search.sku AS CHAR) LIKE ?", [like]);
            });
        });
      });
    }
    if (supplierId) {
      query.where("product.supplier_id", supplierId);
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

    const useMainBranchVisibility =
      !isMain && !!this.user?.warehouse?.useMainBranchVisibility;

    this.applyListFilters(query, {
      saleStatus,
      productType,
      stockStatus,
      useMainBranchVisibility,
    });

    if (useMainBranchVisibility) {
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
        })
        .groupBy("product.id");
    }

    // Count before ordering/grouping: a grouped COUNT(*) returns one row per
    // product, so `.first()` used to give the join size of a single product.
    const { total } = await query
      .clone()
      .clear("group")
      .countDistinct("product.id as total")
      .first<{ total: number }>();

    const term = searchTitle?.trim();
    if (term) {
      // Exact title first, then titles starting with the term, then the rest.
      query.orderByRaw(
        "CASE WHEN product.title = ? THEN 0 WHEN product.title LIKE ? THEN 1 ELSE 2 END",
        [term, `${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`],
      );
    }
    query.orderBy("product.created_at", "desc");

    const productList: table_product[] = await query
      .select("product.*")
      .limit(limit || 30)
      .offset(offset || 0);

    const imageLoader = LoaderFactory.productImageLoader(this.trx);
    const categoryLoader = LoaderFactory.categoryByProductLoader(this.trx);
    const variantLoader = LoaderFactory.productVariantLoader(
      this.trx,
      this.user.currentWarehouseId!,
      this.user,
    );
    const modifierByProductLoader = LoaderFactory.modifierByProductLoader(
      this.trx,
    );

    const productConversionLoader =
      LoaderFactory.productVariantConversionLoader(
        this.trx,
        this.user.currentWarehouseId!,
      );

    const queryProductWarehouseVisibility = this.trx
      .table("product_warehouse_visibility")
      .where({
        warehouse_id: this.user.currentWarehouseId!,
      });

    if (useMainBranchVisibility && productList.length > 0) {
      queryProductWarehouseVisibility.whereIn(
        "product_id",
        productList.map((p) => p.id!),
      );
    }

    const visibilityList = await queryProductWarehouseVisibility.select(
      "product_id",
      "product_variant_id",
      "is_visible",
      "is_for_sale",
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
        isForSale: useMainBranchVisibility
          ? visibilityList.find((v) => v.product_id === p.id)?.is_for_sale === 1
          : p.is_for_sale === 1,
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

  // Status filters of the admin product list. Stock is the current branch's
  // on-hand qty summed over its slots.
  private applyListFilters(
    query: Knex.QueryBuilder,
    {
      saleStatus,
      productType,
      stockStatus,
      useMainBranchVisibility,
    }: Pick<ProductFilterProps, "saleStatus" | "productType" | "stockStatus"> & {
      useMainBranchVisibility: boolean;
    },
  ) {
    const trx = this.trx;
    const warehouseId = this.user.currentWarehouseId!;

    if (saleStatus) {
      const forSale = saleStatus === "for_sale";
      if (useMainBranchVisibility) {
        const branchForSale = trx
          .table("product_warehouse_visibility as pwv")
          .select(trx.raw("1"))
          .whereRaw("pwv.product_id = product.id")
          .where("pwv.warehouse_id", warehouseId)
          .where("pwv.is_for_sale", 1);
        if (forSale) query.whereExists(branchForSale);
        else query.whereNotExists(branchForSale);
      } else {
        query.where("product.is_for_sale", forSale ? 1 : 0);
      }
    }

    const compositeVariant = () =>
      trx
        .table("product_variant as pv_c")
        .select(trx.raw("1"))
        .whereRaw("pv_c.product_id = product.id")
        .whereNull("pv_c.deleted_at")
        .where("pv_c.is_composite", 1);
    const isComposite = (qb: Knex.QueryBuilder) =>
      qb.where("product.is_composite", 1).orWhereExists(compositeVariant());

    if (productType === "standard") {
      query
        .where((qb) =>
          qb.where("product.is_composite", 0).orWhereNull("product.is_composite"),
        )
        .whereNotExists(compositeVariant());
    } else if (productType) {
      query.where(isComposite);
      if (productType === "made_to_order") {
        query.where((qb) =>
          qb
            .where("product.use_production", 0)
            .orWhereNull("product.use_production"),
        );
      } else if (productType === "pre_produced") {
        query.where("product.use_production", 1);
      }
    }

    if (stockStatus === "not_tracked") {
      query.where((qb) =>
        qb.where("product.track_stock", 0).orWhereNull("product.track_stock"),
      );
    } else if (stockStatus) {
      // Made-to-order composites hold no stock of their own, so they are
      // never "low" or "out".
      query
        .where("product.track_stock", 1)
        .whereNot((qb) =>
          isComposite(qb).where((p) =>
            p
              .where("product.use_production", 0)
              .orWhereNull("product.use_production"),
          ),
        );

      const branchStock = (variantColumn: string) =>
        `COALESCE((SELECT SUM(i.qty) FROM inventory i
          INNER JOIN warehouse_slot ws ON ws.id = i.slot_id
          WHERE i.variant_id = ${variantColumn} AND ws.warehouse_id = ?), 0)`;

      if (stockStatus === "out") {
        query.whereNotExists(
          trx
            .table("product_variant as pv_s")
            .select(trx.raw("1"))
            .whereRaw("pv_s.product_id = product.id")
            .whereNull("pv_s.deleted_at")
            .whereRaw(`${branchStock("pv_s.id")} > 0`, [warehouseId]),
        );
      } else {
        query.whereExists(
          trx
            .table("product_variant as pv_l")
            .select(trx.raw("1"))
            .whereRaw("pv_l.product_id = product.id")
            .whereNull("pv_l.deleted_at")
            .where("pv_l.low_stock_qty", ">", 0)
            .whereRaw(`${branchStock("pv_l.id")} < pv_l.low_stock_qty`, [
              warehouseId,
            ]),
        );
      }
    }
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
