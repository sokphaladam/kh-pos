import { table_product_variant } from "@/generated/tables";
import { computeVariantDiscount } from "@/lib/variant-discount";
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
  discountType?: "AMOUNT" | "PERCENTAGE" | null;
  discountValue?: number | null;
  /** Unit price after the variant menu discount, or null when there is none. */
  discountedPrice?: number | null;
  createdAt: string;
  updatedAt: string;
  optionValues: {
    id: string;
    value: string;
  }[];
  basicProduct?: BasicProductType | null;
  isComposite?: boolean;
  visible: boolean;
  /** Admin-set menu badges; tagged variants sort to the top of their category. */
  isPopular?: boolean;
  isNew?: boolean;
  isMostOrder?: boolean;
  compositeVariants?: CompositeVariant[];
  slotStock?: {
    slotId: string;
    slotName: string;
    posSlot: boolean;
    stock: number;
  }[];
  movie: MovieInput | null;
}

export function createProductVariantLoader(
  db: Knex,
  warehouseId: string,
  user?: UserInfo,
) {
  return new DataLoader(async (keys: readonly string[]) => {
    const query = db("product_variant")
      .whereIn("product_variant.product_id", keys)
      .where("product_variant.deleted_at", null)
      .where("product_variant.available", 1);

    const useMainBranchVisibility =
      user && user?.warehouse?.useMainBranchVisibility;

    const queryProductWarehouseVisibility = db
      .table("product_warehouse_visibility")
      .where({
        warehouse_id: user?.currentWarehouseId || "",
      });

    if (useMainBranchVisibility) {
      // Only variants in a (non-deleted) product group assigned to this branch
      query.whereIn(
        "product_variant.id",
        db
          .table("group_products")
          .select("product_variant_id")
          .whereIn(
            "group_id",
            db
              .table("warehouse_groups")
              .select("group_id")
              .where("warehouse_id", user?.currentWarehouseId || ""),
          )
          .whereIn(
            "group_id",
            db
              .table("product_groups")
              .select("group_id")
              .whereNull("deleted_at"),
          ),
      );
    }

    const rows: table_product_variant[] =
      await query.select("product_variant.*");

    if (useMainBranchVisibility && rows.length > 0) {
      queryProductWarehouseVisibility.whereIn(
        "product_variant_id",
        rows.map((x) => x.id!),
      );
    }

    const visibilityList = await queryProductWarehouseVisibility.select(
      "product_id",
      "product_variant_id",
      "is_visible",
      "is_for_sale",
      "is_popular",
      "is_new",
      "is_most_order",
    );

    const variantStockLoader = LoaderFactory.variantStockLoader(
      db,
      warehouseId,
    );

    const basicProductLoader = LoaderFactory.basicProductLoader(db);
    const compositeVariantLoader = LoaderFactory.compositeVariantLoader(
      db,
      warehouseId,
    );

    const variantValue = await getVariantOptionValue(
      db,
      rows.map((x) => x.id!),
    );

    const productVariantMap: Record<string, ProductVariantType[]> = {};

    const movieLoader = LoaderFactory.movieByVariantIDLoader(db);

    await Promise.all(
      rows.map(async (x) => {
        const [variantStock, movie, basicProduct, compositeVariants] =
          await Promise.all([
            x.id ? variantStockLoader.load(x.id) : null,
            x.id ? movieLoader.load(x.id) : null,
            basicProductLoader.load(x.product_id),
            x.is_composite ? compositeVariantLoader.load(x.id ?? "") : undefined,
          ]);

        const optionValues = variantValue
          .filter((v) => v.product_variant_id === x.id)
          .map(({ id, value }) => ({ id, value }));

        const branchVisibility = useMainBranchVisibility
          ? visibilityList.find((v) => v.product_variant_id === x.id)
          : undefined;

        const unitPrice = x.price ? Number(x.price) : null;
        const discountType = x.discount_type ?? null;
        const discountValue =
          x.discount_value != null ? Number(x.discount_value) : null;
        const variantDiscount =
          unitPrice != null
            ? computeVariantDiscount(unitPrice, discountType, discountValue)
            : null;

        const variant: ProductVariantType = {
          id: x.id ?? "",
          productId: x.product_id ?? "",
          name: x.name ?? "",
          sku: x.sku ? x.sku.toString() : "",
          barcode: x.barcode ?? "",
          price: unitPrice,
          purchasePrice: x.purchased_cost ? Number(x.purchased_cost) : null,
          lowStockQty: x.low_stock_qty ? Number(x.low_stock_qty) : null,
          idealStockQty: x.ideal_stock_qty ? Number(x.ideal_stock_qty) : null,
          stock: variantStock?.stock ?? 0,
          discountType,
          discountValue,
          discountedPrice: variantDiscount?.discountedUnitPrice ?? null,
          createdAt: x.created_at ?? "",
          updatedAt: x.updated_at ?? "",
          optionValues,
          basicProduct,
          isComposite: x.is_composite ? Boolean(x.is_composite) : false,
          visible: useMainBranchVisibility
            ? visibilityList.find((v) => v.product_variant_id === x.id)
                ?.is_visible === 1
            : x.visible
              ? Boolean(x.visible)
              : false,
          compositeVariants,
          movie,
          isPopular: resolveBadge(branchVisibility?.is_popular, x.is_popular),
          isNew: resolveBadge(branchVisibility?.is_new, x.is_new),
          isMostOrder: resolveBadge(
            branchVisibility?.is_most_order,
            x.is_most_order,
          ),
        };

        productVariantMap[x.product_id] = productVariantMap[x.product_id] || [];
        productVariantMap[x.product_id].push(variant);
      }),
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

/**
 * Resolve a menu badge flag: an explicit per-branch override (0 or 1) wins,
 * otherwise fall back to the main warehouse's flag on `product_variant`.
 */
function resolveBadge(
  overrideVal: number | null | undefined,
  mainVal: number | null | undefined,
): boolean {
  return (overrideVal ?? mainVal ?? 0) === 1;
}

export async function getVariantOptionValue(
  tx: Knex,
  variantIds: string[],
): Promise<{ product_variant_id: string; id: string; value: string }[]> {
  if (variantIds.length === 0) return [];

  const variantOptions: {
    product_variant_id: string;
    option_value_id: string;
  }[] = await tx
    .table("product_variant_options")
    .whereIn("product_variant_id", variantIds)
    .select("product_variant_id", "option_value_id");

  const optionValueLoader = LoaderFactory.productOptionValueByIdLoader(tx);
  const optionValues = await Promise.all(
    variantOptions.map((vo) => optionValueLoader.load(vo.option_value_id)),
  );

  // Drop options whose value row is missing, like the previous inner join
  return variantOptions.flatMap((vo, i) => {
    const optionValue = optionValues[i];
    return optionValue
      ? [
          {
            product_variant_id: vo.product_variant_id,
            id: optionValue.id,
            value: optionValue.value as string,
          },
        ]
      : [];
  });
}
