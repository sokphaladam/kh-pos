import {
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  ProductVariantByWarehouse,
} from "@/app/api/product/[id]/option/types";
import {
  ProductSearchFilter,
  ProductSearchResult,
} from "@/app/api/product/search-product/types";
import { LoaderFactory } from "@/dataloader/loader-factory";
import { ProductModifierType } from "@/dataloader/product-variant-loader";
import {
  table_product_categories,
  table_product_option,
  table_product_option_value,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { ProductInput } from "@/lib/types/product-type";
import { Knex } from "knex";

export class ProductService {
  private trx: Knex.Transaction;
  private user?: UserInfo;
  constructor(trx: Knex.Transaction, user?: UserInfo) {
    this.trx = trx;
    if (user) {
      this.user = user;
    }
  }

  async searchProduct(
    filter: ProductSearchFilter | undefined,
  ): Promise<ProductSearchResult[]> {
    const isMain = this.user?.warehouse?.isMain || false;
    const searchQuery = this.trx("product")
      .innerJoin("product_variant", "product.id", "product_variant.product_id")
      .leftJoin("inventory", "product_variant.id", "inventory.variant_id")
      .leftJoin("warehouse_slot", "inventory.slot_id", "warehouse_slot.id")
      .leftJoin(
        "product_categories",
        "product_categories.product_id",
        "product.id",
      )
      .groupBy("product_variant.id");

    searchQuery.offset(filter?.offset ?? 0);
    searchQuery.limit(filter?.limit ?? 100);

    if (filter?.warehouse && isMain) {
      searchQuery.where(function () {
        this.where("warehouse_slot.warehouse_id", filter.warehouse).orWhere(
          "warehouse_slot.warehouse_id",
          null,
        );
      });
    }

    if (filter?.barcode) {
      searchQuery.where("product_variant.barcode", filter.barcode);
    }

    if (filter?.search) {
      searchQuery.whereRaw(
        "MATCH(product.title) AGAINST (? IN NATURAL LANGUAGE MODE)",
        [filter.search],
      );
    }
    if (filter?.sku) {
      searchQuery.where("product_variant.sku", filter.sku);
    }

    if (filter?.replenishment !== undefined && filter?.replenishment === true) {
      searchQuery.where("warehouse_slot.for_replenishment", 1);
    }

    if (filter?.compositeOnly !== undefined && filter?.compositeOnly === true) {
      searchQuery.where("product_variant.is_composite", true);
    }

    if (filter?.categoryKeys) {
      searchQuery.whereIn(
        "product_categories.category_id",
        Array.isArray(filter.categoryKeys)
          ? filter.categoryKeys
          : [filter.categoryKeys],
      );
    }

    if (filter?.supplierId) {
      searchQuery.where("product.supplier_id", filter.supplierId);
    }

    const query = searchQuery
      .select("product_variant.*")
      .select("product.title")
      .select("inventory.slot_id")
      .select("product_categories.category_id");

    const setting = await this.trx
      .table("setting")
      .where(
        filter?.warehouse
          ? {
              option: "PRODUCT_MENU",
              warehouse: filter?.warehouse,
            }
          : {
              option: "PRODUCT_MENU",
            },
      )
      .first();

    if (
      setting &&
      setting.value &&
      filter?.includeProductNotForSale === false
    ) {
      const settingValue = JSON.parse(setting.value);

      if (settingValue.onlyForSale) {
        query.where("product.is_for_sale", true);
      }

      if (settingValue.onlyInStock) {
        query.where("inventory.qty", ">", 0);
      }
    }

    query.where({ "product_variant.visible": true });

    query
      .where({
        "product.deleted_at": null,
      })
      .where("product_variant.deleted_at", null);

    let warehouse = this.user?.warehouse;

    if (!warehouse) {
      warehouse = await LoaderFactory.warehouseLoader(this.trx).load(
        filter?.warehouse || "",
      );
    }

    if (!isMain && !!warehouse?.useMainBranchVisibility) {
      const warehouseId = this.user?.currentWarehouseId || filter?.warehouse;
      searchQuery
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
          "warehouse_groups.warehouse_id": warehouseId,
          "product_groups.deleted_at": null,
        });
    }

    const result = await query.clone();

    const productImageLoader = LoaderFactory.productImageLoader(this.trx);
    const variantLoader = LoaderFactory.productVariantLoader(
      this.trx,
      this.user?.currentWarehouseId || "",
    );
    const modifierByProductLoader = LoaderFactory.modifierByProductLoader(
      this.trx,
    );
    const categoryLoader = LoaderFactory.productCategoryLoader(this.trx);

    return await Promise.all(
      result.map(async (r) => {
        const variants = r.product_id
          ? (await variantLoader.load(r.product_id)).map((x) => x)
          : [];
        const modifiers: ProductModifierType[] = r.product_id
          ? await modifierByProductLoader.load(r.product_id)
          : [];
        const category = r.category_id
          ? await categoryLoader.load(r.category_id)
          : null;
        return {
          productId: r.product_id,
          variantId: r.id,
          warehouseId: r.warehouse_id,
          productTitle: `${r.title} (${r.name})`,
          price: r.price,
          stock: variants.reduce((a, b) => a + Number(b.stock), 0),
          sku: r.sku,
          barcode: r.barcode,
          purchasedCost: r.purchased_cost,
          incomingStock: 0,
          images: r.product_id
            ? await productImageLoader.load(r.product_id)
            : [],
          variants,
          modifiers,
          category,
        };
      }),
    );
  }

  async createProduct(input: ProductInput) {
    const now = Formatter.getNowDateTime();
    await this.trx.table("product").insert({
      id: input.id,
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
    });
  }

  async getProductOption(productId: string) {
    const productOptions: table_product_option[] = await this.trx
      .table("product_option")
      .where("product_id", productId);

    const productOptionValueLoader = LoaderFactory.productOptionValueLoader(
      this.trx,
    );
    return await Promise.all(
      productOptions.map(async (option) => {
        return {
          id: option.id!,
          name: option.name,
          createdAt: option.created_at,
          updatedAt: option.updated_at,
          values: await productOptionValueLoader.load(option.id!),
        };
      }),
    );
  }

  async getProductVariant(productId: string): Promise<ProductVariant[]> {
    const productVariants = await this.trx
      .table("product_variant")
      .where("product_id", productId)
      .whereNull("deleted_at");
    return await Promise.all(
      productVariants.map(async (variant) => {
        const optionValues = await this.trx
          .table("product_variant_options")
          .where("product_variant_id", variant.id)
          .join(
            "product_option_value",
            "product_variant_options.option_value_id",
            "product_option_value.id",
          );

        return {
          id: variant.id!,
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          available: variant.available === 1,
          barcode: variant.barcode,
          isDefault: variant.is_default === 1,
          purchasedCost: variant.purchasedCost,
          visible: variant.visible === 1,
          optionValues: optionValues.map((v) => {
            return {
              id: v.id!,
              value: v.value,
            };
          }),
        };
      }),
    );
  }

  async getProductVariantByWarehouse(
    productId: string,
  ): Promise<ProductVariantByWarehouse[]> {
    const productVariantByWarehouse = await this.trx
      .table("product_variant_by_warehouse")
      .where("product_id", productId)
      .whereNull("deleted_at");

    return productVariantByWarehouse.map((v) => {
      return {
        id: v.id!,
        variantId: v.variant_id,
        warehouseId: v.warehouse_id,
        stock: v.stock,
        price: v.price,
        lowStock: v.low_stock,
        idealStock: v.ideal_stock,
        enabled: v.enabled === 1,
      };
    });
  }

  async createProductOption(productId: string, option: ProductOption) {
    const now = Formatter.getNowDateTime();

    // Create product option
    await this.trx.table("product_option").insert({
      id: option.id,
      product_id: productId,
      name: option.name,
      created_at: now,
    });

    // Create product option values
    await this.trx.table("product_option_value").insert(
      option.values.map((value) => {
        return {
          id: value.id,
          product_option_id: option.id,
          value: value.value,
          created_at: now,
        };
      }),
    );
  }

  async updateProductOption(option: ProductOption) {
    const now = Formatter.getNowDateTime();
    // Update product option
    await this.trx.table("product_option").where("id", option.id).update({
      name: option.name,
      updated_at: now,
    });

    // find deleted values
    const toDeleteValues: table_product_option_value[] = await this.trx
      .table("product_option_value")
      .where("product_option_id", option.id)
      .whereNotIn(
        "product_option_value.id",
        option.values.filter((v) => v.id).map((v) => v.id!),
      );
    for (const value of toDeleteValues) {
      // delete from product_option_value
      await this.trx
        .table("product_option_value")
        .where("id", value.id)
        .delete();
      // log user activity
    }

    for (const value of option.values) {
      await this.trx
        .table("product_option_value")
        .insert({
          id: value.id,
          product_option_id: option.id,
          value: value.value,
        })
        .onConflict("id")
        .merge({
          value: value.value,
          product_option_id: option.id,
        });
    }
  }

  async createProductVariant(
    productId: string,
    variant: ProductVariant,
    optionValues: ProductOptionValue[],
  ) {
    const now = Formatter.getNowDateTime();
    // handle product variant

    // Create product variant
    await this.trx.table("product_variant").insert({
      id: variant.id,
      product_id: productId,
      sku: variant.sku,
      name: variant.name,
      available: variant.available,
      is_default: variant.isDefault,
      price: variant.price,
      barcode: variant.barcode,
      created_at: now,
    });

    // Create product variant option values
    await this.trx.table("product_variant_options").insert(
      optionValues.map((value) => {
        return {
          product_variant_id: variant.id,
          option_value_id: value.id,
        };
      }),
    );
  }

  async updateProductVariant(variant: ProductVariant, productId: string) {
    const now = Formatter.getNowDateTime();
    const existingVariant = await this.trx
      .table("product_variant")
      .where("id", variant.id)
      .first();
    if (existingVariant) {
      await this.trx.table("product_variant").where("id", variant.id).update({
        name: variant.name,
        sku: variant.sku,
        price: variant.price,
        available: variant.available,
        barcode: variant.barcode,
        updated_at: now,
      });
    } else {
      this.createProductVariant(productId, variant, variant.optionValues);
    }
  }

  async deleteProductVariant(variantId: string) {
    const now = Formatter.getNowDateTime();
    // Delete product variant
    await this.trx.table("product_variant").where("id", variantId).update({
      deleted_at: now,
    });
  }

  async createProductVariantByWarehouse(
    productId: string,
    variantByWarehouse: ProductVariantByWarehouse,
  ) {
    const now = Formatter.getNowDateTime();
    // handle product variant by warehouse
    await this.trx.table("product_variant_by_warehouse").insert({
      id: variantByWarehouse.id,
      product_id: productId,
      variant_id: variantByWarehouse.variantId,
      warehouse_id: variantByWarehouse.warehouseId,
      stock: variantByWarehouse.stock,
      price: variantByWarehouse.price,
      low_stock: variantByWarehouse.lowStock,
      ideal_stock: variantByWarehouse.idealStock,
      created_at: now,
      enabled: variantByWarehouse.enabled,
    });
  }

  async updateProductVariantByWarehouse(
    productId: string,
    variantByWarehouse: ProductVariantByWarehouse,
  ) {
    const now = Formatter.getNowDateTime();
    const existingVariantByWarehouse = await this.trx
      .table("product_variant_by_warehouse")
      .where("id", variantByWarehouse.id)
      .first();
    if (!existingVariantByWarehouse) {
      await this.createProductVariantByWarehouse(productId, variantByWarehouse);
    } else {
      await this.trx
        .table("product_variant_by_warehouse")
        .where({
          id: variantByWarehouse.id,
        })
        .update({
          stock: variantByWarehouse.stock,
          price: variantByWarehouse.price,
          low_stock: variantByWarehouse.lowStock,
          ideal_stock: variantByWarehouse.idealStock,
          updated_at: now,
          enabled: variantByWarehouse.enabled,
        });
    }
  }

  async deleteProductVariantByWarehouse(variantByWarehouseId: string) {
    const now = Formatter.getNowDateTime();
    // Delete product variant by warehouse
    await this.trx
      .table("product_variant_by_warehouse")
      .where("id", variantByWarehouseId)
      .update({
        deleted_at: now,
      });
  }

  async getProductCategories(productId: string) {
    const categories: table_product_categories[] = await this.trx
      .table("product_categories")
      .where("product_id", productId);
    const categoryLoader = LoaderFactory.productCategoryLoader(this.trx);
    return await Promise.all(
      categories.map(async (category) => {
        return {
          id: category.id!,
          productId: category.product_id,
          categoryId: category.category_id,
          category: await categoryLoader.load(category.category_id),
        };
      }),
    );
  }
}
