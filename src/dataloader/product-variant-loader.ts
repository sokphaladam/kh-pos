import { table_product_variant } from "@/generated/tables";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { BasicProductType } from "./basic-product-loader";
import { CompositeVariant } from "./composite-variant-loader";
import { LoaderFactory } from "./loader-factory";
import { MovieInput } from "@/classes/movie";

export interface ProductModifierItemType {
  id: string;
  modifierId: string;
  name: string;
  price?: number;
  createdAt?: string;
  createdBy?: UserInfo | null;
}

export interface ProductModifierType {
  modifierId: string;
  title: string;
  description: string;
  createdAt?: string;
  createdBy?: UserInfo | null;
  items?: ProductModifierItemType[];
}

export interface ProductVariantType {
  id: string;
  productId: string;
  name: string;
  sku: string | number;
  barcode: string;
  price: number | null;
  purchasePrice: number | null;
  lowStockQty: number | null;
  idealStockQty: number | null;
  stock: number | null;
  createdAt: string;
  updatedAt: string;
  optionValues: {
    id: string;
    value: string;
  }[];
  basicProduct?: BasicProductType | null;
  isComposite?: boolean;
  visible: boolean;
  compositeVariants?: CompositeVariant[];
  slotStock?: {
    slotId: string;
    slotName: string;
    posSlot: boolean;
    stock: number;
  }[];
  movie: MovieInput | null;
}

export function createProductVariantLoader(db: Knex, warehouseId: string) {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_product_variant[] = await db("product_variant")
      .whereIn("product_id", keys)
      .where("deleted_at", null)
      .where("available", 1);

    const variantStockLoader = LoaderFactory.variantStockLoader(
      db,
      warehouseId
    );

    const basicProductLoader = LoaderFactory.basicProductLoader(db);

    const variantValue = await getVariantOptionValue(
      db,
      rows.map((x) => x.id!)
    );

    const productVariantMap: Record<string, ProductVariantType[]> = {};

    const movieLoader = LoaderFactory.movieByVariantIDLoader(db);

    await Promise.all(
      rows.map(async (x) => {
        const variantStock = x.id ? await variantStockLoader.load(x.id) : null;

        const optionValues = variantValue
          .filter((v) => v.product_variant_id === x.id)
          .map(({ id, value }) => ({ id, value }));

        const movie = x.id ? await movieLoader.load(x.id) : null;

        const variant: ProductVariantType = {
          id: x.id ?? "",
          productId: x.product_id ?? "",
          name: x.name ?? "",
          sku: x.sku ? x.sku.toString() : "",
          barcode: x.barcode ?? "",
          price: x.price ? Number(x.price) : null,
          purchasePrice: x.purchased_cost ? Number(x.purchased_cost) : null,
          lowStockQty: x.low_stock_qty ? Number(x.low_stock_qty) : null,
          idealStockQty: x.ideal_stock_qty ? Number(x.ideal_stock_qty) : null,
          stock: variantStock?.stock ?? 0,
          createdAt: x.created_at ?? "",
          updatedAt: x.updated_at ?? "",
          optionValues,
          basicProduct: await basicProductLoader.load(x.product_id),
          isComposite: x.is_composite ? Boolean(x.is_composite) : false,
          visible: x.visible ? Boolean(x.visible) : false,
          compositeVariants: x.is_composite
            ? await LoaderFactory.compositeVariantLoader(db, warehouseId).load(
                x.id ?? ""
              )
            : undefined,
          movie,
        };

        productVariantMap[x.product_id] = productVariantMap[x.product_id] || [];
        productVariantMap[x.product_id].push(variant);
      })
    );

    // Sort variants of each product by sku asc
    Object.keys(productVariantMap).forEach((productId) => {
      productVariantMap[productId].sort((a, b) => {
        const skuA = a.sku?.toString() || "";
        const skuB = b.sku?.toString() || "";
        return skuA.localeCompare(skuB, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });
    });

    return await Promise.all(keys.map((key) => productVariantMap[key] || []));
  });
}

export async function getVariantOptionValue(
  tx: Knex,
  variantIds: string[]
): Promise<{ product_variant_id: string; id: string; value: string }[]> {
  return await tx
    .table("product_variant_options")
    .innerJoin(
      "product_option_value",
      "product_variant_options.option_value_id",
      "product_option_value.id"
    )
    .whereIn("product_variant_id", variantIds)
    .select(
      "product_variant_options.product_variant_id",
      "product_option_value.id",
      "product_option_value.value"
    );
}
