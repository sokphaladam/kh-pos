import { LoaderFactory } from "@/dataloader/loader-factory";
import {
  table_product_option,
  table_product_option_value,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { z } from "zod";

// Validation schemas for product options and values
const inputProductOptionValueSchema = z.object({
  id: z.string().nonempty("ID is required"),
  value: z.string().nonempty("Value is required"),
});

const inputProductOptionSchema = z.object({
  id: z.string().nonempty("ID is required"),
  name: z.string().nonempty("Name is required"),
  values: z
    .array(inputProductOptionValueSchema)
    .min(1, "At least one value is required"),
});

export const inputProductOptionsSchema = z
  .array(inputProductOptionSchema)
  .min(1, "At least one option is required")
  .max(3, "Maximum 3 options are allowed");

export type ProductOptionInput = z.infer<typeof inputProductOptionSchema>;
export type ProductOptionsInput = z.infer<typeof inputProductOptionsSchema>;

export interface ProductOption {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  values: ProductOptionValue[];
}

export interface ProductOptionValue {
  id: string;
  value: string;
  createdAt?: string;
  updatedAt?: string;
}

export class ProductOptionService {
  constructor(
    protected trx: Knex,
    protected user: UserInfo,
    protected productId: string
  ) {}

  async getProductOption(): Promise<ProductOption[]> {
    const productOptions: table_product_option[] = await this.trx
      .table("product_option")
      .where("product_id", this.productId);

    const productOptionValueLoader = LoaderFactory.productOptionValueLoader(
      this.trx
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
      })
    );
  }

  // Create product options and their values
  async createProductOptions(options: ProductOptionsInput) {
    await this.trx.transaction(async (trx) => {
      for (const option of options) {
        await this.createSingleProductOption(trx, option);
      }
    });
  }

  // Update product options and their values
  async updateProductOptions(options: ProductOptionsInput) {
    await this.trx.transaction(async (trx) => {
      for (const option of options) {
        await updateProductOptionWithValues(option, trx);
      }
    });
  }

  // Helper to create a single product option and its values
  private async createSingleProductOption(
    trx: Knex,
    option: ProductOptionInput
  ) {
    await insertProductOption(trx, this.productId, {
      id: option.id,
      name: option.name,
    });
    await insertProductOptionValues(trx, option.id, option.values);
  }
}

// Insert a product option into the database
async function insertProductOption(
  trx: Knex,
  productId: string,
  option: { id: string; name: string }
) {
  const now = Formatter.getNowDateTime();
  await trx.table("product_option").insert({
    id: option.id,
    product_id: productId,
    name: option.name,
    created_at: now,
  });
}

// Insert multiple product option values into the database
async function insertProductOptionValues(
  trx: Knex,
  optionId: string,
  values: { id: string; value: string }[]
) {
  const now = Formatter.getNowDateTime();
  await trx.table<table_product_option_value>("product_option_value").insert(
    values.map((value) => ({
      id: value.id,
      product_option_id: optionId,
      value: value.value,
      created_at: now,
    }))
  );
}

// Update a product option and its values
async function updateProductOptionWithValues(
  option: ProductOptionInput,
  trx: Knex
) {
  const now = Formatter.getNowDateTime();

  // Update product option
  await trx.table("product_option").where("id", option.id).update({
    name: option.name,
    updated_at: now,
  });

  // Find and delete removed values
  const existingValues = await trx
    .table("product_option_value")
    .where("product_option_id", option.id)
    .whereNotIn(
      "product_option_value.id",
      option.values.map((v) => v.id)
    );

  for (const value of existingValues) {
    await trx.table("product_option_value").where("id", value.id).delete();
    // Log user activity if needed
  }

  // Insert or update values
  for (const value of option.values) {
    await trx
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
