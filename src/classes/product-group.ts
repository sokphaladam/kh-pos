import { BasicProductType } from "@/dataloader/basic-product-loader";
import { LoaderFactory } from "@/dataloader/loader-factory";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { Warehouse } from "@/dataloader/warehouse-loader";
import { Formatter } from "@/lib/formatter";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { z } from "zod";

export interface ProductGroupResult {
  groupId: string;
  groupName: string;
  description?: string;
  createdBy: UserInfo | null;
  createdAt: string;
  updatedBy: UserInfo | null;
  updatedAt: string;
  deletedBy: UserInfo | null;
  deletedAt: string | null;
  warehouses: {
    groupId: string;
    warehouseId: string;
    warehouse: Warehouse | null;
  }[];
  products: {
    groupId: string;
    productId: string;
    productVariantId: string;
    product: BasicProductType | null;
    variant: ProductVariantType | null;
  }[];
}

export interface GroupProduct {
  productId: string;
  productVariantId: string;
}

export const ProductGroupInputSchema = z.object({
  groupId: z.string().optional(),
  groupName: z.string().min(1),
  description: z.string().optional(),
});

export type ProductGroupInputType = z.infer<typeof ProductGroupInputSchema>;

export class ProductGroupService {
  constructor(protected knex: Knex) {}

  async createProductGroup(input: ProductGroupInputType, user: UserInfo) {
    const groupId = input.groupId;
    await this.knex.table("product_groups").insert({
      group_id: groupId,
      group_name: input.groupName,
      description: input.description,
      created_by: user.id,
      created_at: Formatter.getNowDateTime(),
      updated_by: user.id,
      updated_at: Formatter.getNowDateTime(),
    });

    return groupId;
  }

  async updateProductGroup(
    groupId: string,
    input: ProductGroupInputType,
    user: UserInfo,
  ) {
    await this.knex
      .table("product_groups")
      .where({ group_id: groupId })
      .update({
        group_name: input.groupName,
        description: input.description,
        updated_by: user.id,
        updated_at: Formatter.getNowDateTime(),
      });

    return groupId;
  }

  async deleteProductGroup(groupId: string, user: UserInfo) {
    await this.knex
      .table("product_groups")
      .where({ group_id: groupId })
      .update({
        deleted_by: user.id,
        deleted_at: Formatter.getNowDateTime(),
      });
    return groupId;
  }

  async assignProductsToGroup(groupId: string, groupProducts: GroupProduct[]) {
    const insertData = groupProducts.map((gp) => {
      return {
        group_id: groupId,
        product_id: gp.productId,
        product_variant_id: gp.productVariantId,
      };
    });

    if (insertData.length === 0) {
      return false;
    }

    await this.knex.table("group_products").insert(insertData);

    return true;
  }

  async removeProductsFromGroup(
    groupId: string,
    groupProducts: GroupProduct[],
  ) {
    if (groupProducts.length === 0) {
      return false;
    }

    await this.knex
      .table("group_products")
      .where({ group_id: groupId })
      .whereIn(
        "product_variant_id",
        groupProducts.map((gp) => gp.productVariantId),
      )
      .delete();

    return true;
  }

  async assignWarehouseToGroup(groupId: string, warehouseIds: string[]) {
    const insertData = warehouseIds.map((warehouseId) => {
      return {
        group_id: groupId,
        warehouse_id: warehouseId,
      };
    });

    if (insertData.length === 0) {
      return false;
    }

    await this.knex.table("warehouse_groups").insert(insertData);

    return true;
  }

  async removeWarehouseFromGroup(groupId: string, warehouseIds: string[]) {
    if (warehouseIds.length === 0) {
      return false;
    }

    await this.knex
      .table("warehouse_groups")
      .where({ group_id: groupId })
      .whereIn("warehouse_id", warehouseIds)
      .delete();

    return true;
  }

  async getProductGroupList({
    offset,
    limit,
    warehouseIds,
  }: {
    offset: number;
    limit: number;
    warehouseIds?: string[];
  }) {
    const query = this.knex.table("product_groups").where({ deleted_at: null });

    if (warehouseIds && warehouseIds.length > 0) {
      query
        .join(
          "warehouse_groups",
          "product_groups.group_id",
          "warehouse_groups.group_id",
        )
        .whereIn("warehouse_groups.warehouse_id", warehouseIds);
    }

    const total = await query.clone().count("* as count").first();

    const rows = await query
      .select("product_groups.*")
      .offset(offset)
      .limit(limit)
      .orderBy("created_at", "desc");

    const userLoader = LoaderFactory.userLoader(this.knex);
    const warehouseLoader = LoaderFactory.warehouseGroupByGroupIdLoader(
      this.knex,
    );
    const groupProductLoader = LoaderFactory.groupProductByGroupIdLoader(
      this.knex,
    );

    const result = await Promise.all(
      rows.map(async (row) => {
        return {
          groupId: row.group_id,
          groupName: row.group_name,
          description: row.description,
          createdBy: row.created_by
            ? await userLoader.load(row.created_by)
            : null,
          createdAt: Formatter.dateTime(row.created_at),
          updatedBy: row.updated_by
            ? await userLoader.load(row.updated_by)
            : null,
          updatedAt: Formatter.dateTime(row.updated_at),
          deletedBy: row.deleted_by
            ? await userLoader.load(row.deleted_by)
            : null,
          deletedAt: row.deleted_at ? Formatter.dateTime(row.deleted_at) : null,
          warehouses: row.group_id
            ? await warehouseLoader.load(row.group_id)
            : null,
          products: row.group_id
            ? await groupProductLoader.load(row.group_id)
            : null,
        };
      }),
    );

    return {
      total: total ? total.count : 0,
      result: result as ProductGroupResult[],
    };
  }
}
