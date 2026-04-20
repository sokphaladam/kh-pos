import { LoaderFactory } from "@/dataloader/loader-factory";
import {
  table_product_variant,
  table_variant_composite,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { z } from "zod";

const inputProductOptionValueSchema = z.object({
  id: z.string().nonempty("ID is required"),
  value: z.string().nonempty("Value is required"),
});

const inputVariantCompositeSchema = z.object({
  id: z.string().optional(),
  variantId: z.string().nonempty("Variant ID is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

const inputProductVariantSchema = z
  .object({
    id: z.string().nonempty(),
    name: z.string().nonempty(),
    barcode: z.string().optional().nullable(),
    price: z.number().optional().nullable(),
    available: z.boolean(),
    isDefault: z.boolean(),
    optionValues: z
      .array(inputProductOptionValueSchema)
      .min(1, "optionValues must have at least one item"),
    lowStockQty: z.number().optional().nullable(),
    idealStockQty: z.number().optional().nullable(),
    purchasedCost: z.number().min(0),
    isComposite: z.boolean().optional().default(false),
    compositeVariants: z
      .array(inputVariantCompositeSchema)
      .optional()
      .default([]),
    visible: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      if (data.isComposite) {
        return data.compositeVariants && data.compositeVariants.length > 0;
      }
      return true;
    },
    {
      message:
        "compositeVariants must have at least one item when isComposite is true",
      path: ["compositeVariants"],
    }
  );

export const inputProductVariantsSchema = z.array(inputProductVariantSchema);

export type ProductVariant = z.infer<typeof inputProductVariantSchema>;
type CompositeVariant = z.infer<typeof inputVariantCompositeSchema>;

export class ProductVariantService {
  constructor(
    protected trx: Knex,
    protected user: UserInfo,
    protected productId: string
  ) {}

  async getProductVariants() {
    const variantLoader = LoaderFactory.productVariantLoader(
      this.trx,
      this.user.currentWarehouseId!
    );
    return await variantLoader.load(this.productId);
  }

  async createProductVariant(variant: ProductVariant) {
    const now = Formatter.getNowDateTime();

    await this.insertProductVariant(variant, now);
    await this.insertProductVariantOptionValues(variant);
  }

  async triggerVariant(productId: string) {
    await this.trx
      .table("product_variant")
      .where("product_id", productId)
      .whereNull("barcode")
      .update({
        barcode: this.trx.ref("sku"),
      });
  }

  async updateProductVariants(variants: ProductVariant[]) {
    await this.trx.transaction(async (trx) => {
      const existingVariantIds = variants.map((v) => v.id);
      const toDeleteVariants = await trx
        .table("product_variant")
        .where("product_id", this.productId)
        .whereNotIn("id", existingVariantIds);

      for (const variant of toDeleteVariants) {
        await ProductVariantService.deleteProductVariant(variant.id, trx);
      }

      for (const variant of variants) {
        await ProductVariantService.updateProductVariant(
          variant,
          this.productId,
          trx,
          this.user
        );
      }
    });
  }

  static async updateProductVariant(
    variant: ProductVariant,
    productId: string,
    trx: Knex,
    user: UserInfo
  ) {
    const now = Formatter.getNowDateTime();
    const existingVariant = await trx
      .table("product_variant")
      .where("id", variant.id)
      .first();

    if (existingVariant) {
      await trx
        .table<table_product_variant>("product_variant")
        .where("id", variant.id)
        .update({
          name: variant.name,
          price: String(variant.price),
          available: Number(variant.available),
          barcode: variant.barcode,
          updated_at: now,
          low_stock_qty: variant.lowStockQty,
          ideal_stock_qty: variant.idealStockQty,
          purchased_cost: String(variant.purchasedCost),
          is_composite: variant.isComposite ? 1 : 0,
          visible: variant.visible ? 1 : 0,
        });

      // Update composite variants if it is a composite variant
      if (variant.isComposite) {
        await updateCompositeVariants(
          variant.compositeVariants,
          variant.id,
          trx,
          user
        );
      }
    } else {
      await new ProductVariantService(
        trx,
        user,
        productId
      ).createProductVariant(variant);
    }
  }

  static async deleteProductVariant(variantId: string, trx: Knex) {
    const now = Formatter.getNowDateTime();
    await trx.table("product_variant").where("id", variantId).update({
      deleted_at: now,
    });
  }

  private async insertProductVariant(variant: ProductVariant, now: string) {
    await this.trx.transaction(async (trx) => {
      // variants
      await trx.table<table_product_variant>("product_variant").insert({
        id: variant.id,
        product_id: this.productId,
        name: variant.name,
        available: Number(variant.available),
        price: String(variant.price),
        barcode: variant.barcode,
        created_at: now,
        low_stock_qty: variant.lowStockQty,
        ideal_stock_qty: variant.idealStockQty,
        purchased_cost: String(variant.purchasedCost),
        is_composite: variant.isComposite ? 1 : 0,
        visible: variant.visible ? 1 : 0,
      });

      // composite variants
      if (variant.isComposite) {
        await trx.table<table_variant_composite>("variant_composite").insert(
          variant.compositeVariants.map((composite) => ({
            id: generateId(),
            variant_composite_id: variant.id,
            variant_component_id: composite.variantId,
            qty: composite.quantity,
            created_at: now,
            created_by: this.user.id,
          }))
        );
      }
    });
  }

  private async insertProductVariantOptionValues(variant: ProductVariant) {
    await this.trx.table("product_variant_options").insert(
      variant.optionValues.map((value) => ({
        product_variant_id: variant.id,
        option_value_id: value.id,
      }))
    );
  }
}

async function updateCompositeVariants(
  data: CompositeVariant[],
  compositeId: string,
  knex: Knex,
  user: UserInfo
) {
  const now = Formatter.getNowDateTime();
  await knex.transaction(async (trx) => {
    // If data is empty, mark all existing composite variants as deleted
    if (data.length === 0) {
      await trx
        .table<table_variant_composite>("variant_composite")
        .update({
          deleted_at: now,
          deleted_by: user.id,
        })
        .where({ variant_composite_id: compositeId });
      return; // Exit early since there's no data to process further
    }
    const oldCompositeVariants = data.filter((v) => v.id);

    // mark variants that are not in the data as deleted
    if (oldCompositeVariants.length > 0) {
      await trx
        .table<table_variant_composite>("variant_composite")
        .update({
          deleted_at: now,
          deleted_by: user.id,
        })
        .where({ variant_composite_id: compositeId })
        .whereNotIn(
          "id",
          oldCompositeVariants.map((v) => v.id!)
        );
    }

    // update old composite variants
    for (const variant of oldCompositeVariants) {
      await trx
        .table<table_variant_composite>("variant_composite")
        .where("id", variant.id!)
        .update({
          variant_component_id: variant.variantId,
          qty: variant.quantity,
          updated_at: now,
          updated_by: user.id,
        });
    }

    // insert new composite variants
    const newCompositeVariants = data.filter((v) => !v.id);

    if (newCompositeVariants.length > 0) {
      await trx.table<table_variant_composite>("variant_composite").insert(
        newCompositeVariants.map((variant) => ({
          id: generateId(),
          variant_composite_id: compositeId,
          variant_component_id: variant.variantId,
          qty: variant.quantity,
          created_at: now,
          created_by: user.id,
        }))
      );
    }
  });
}
