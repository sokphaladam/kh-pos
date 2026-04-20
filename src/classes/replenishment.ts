import { BasicProductType } from "@/dataloader/basic-product-loader";
import { LoaderFactory } from "@/dataloader/loader-factory";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { Warehouse } from "@/dataloader/warehouse-loader";
import {
  table_inventory,
  table_product_variant,
  table_fulfill_replenishment,
  table_fulfill_replenishment_detail,
  table_replenishment,
  table_replenishment_items,
  table_replenishment_picking_list,
  table_warehouse_slot,
  table_warehouse,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { z } from "zod";
import {
  FindProductInSlotResult,
  FindProductInSlotService,
  FindProductProps,
} from "./find-product-in-slot";
import { SlotMovementService } from "./slot-movement";

const replenishmentDetailInputSchema = z.object({
  variantId: z.string(),
  sentQty: z.number(),
  costPerUnit: z.number(),
});

export const replenishmentInputSchema = z.object({
  fromWarehouseId: z.string(),
  toWarehouseId: z.string(),
  status: z.enum(["draft", "approved"]),
  replenishmentDetails: z.array(replenishmentDetailInputSchema).min(1),
});

const replenishmentDetailUpdateSchema = replenishmentDetailInputSchema.extend({
  id: z.string().optional(),
});

export const replenishmentUpdateSchema = z.object({
  id: z.string(),
  fromWarehouseId: z.string(),
  toWarehouseId: z.string(),
  replenishmentDetails: z.array(replenishmentDetailUpdateSchema).min(1),
});

export const replenishmentDeleteSchema = z.object({
  id: z.string(),
});

export const replenishmentFilterSchema = z.object({
  fromWarehouseId: z.string().optional(),
  toWarehouseId: z.string().optional(),
  status: z
    .enum(["draft", "approved", "receiving", "received", "deleted"])
    .optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

export type ReplenishmentCreateType = z.infer<typeof replenishmentInputSchema>;
export type ReplenishmentUpdateType = z.infer<typeof replenishmentUpdateSchema>;
export type ReplenishmentFilterType = z.infer<typeof replenishmentFilterSchema>;
export type ReplenishmentDeleteType = z.infer<typeof replenishmentDeleteSchema>;

export interface Replenishment {
  id: string;
  autoId: number;
  fromWarehouseId: Warehouse | null;
  toWarehouseId: Warehouse | null;
  status: string;
  createdAt: string | null;
  createdBy: UserInfo | null;
  updatedAt: string | null;
  updatedBy: UserInfo | null;
  totalSentQty: number;
  totalCost: number;
  totalReceivedQty: number;
}
export interface ReplenishmentSuggestionProduct {
  id: string;
  name: string;
  productId: string;
  sku: string;
  barcode: string | null;
  createdAt: string;
  price: number;
  available: boolean;
  isDefault: boolean;
  sourceStock: number;
  purchasedCost: number | null;
  lowStockQty: number | null;
  idealStockQty: number | null;
  stock: number;
  basicProduct: BasicProductType | null;
}

export interface ReplenishmentSuggestionByWarehouse {
  name: string;
  total: number;
  warehouseId: string;
  items: ReplenishmentSuggestionProduct[];
}

export interface UpdateReplenishmentPickingListProps {
  replenishmentId: string;
  pickingList: {
    variantId: string;
    slotId: string;
    qty: number;
    lotId: string;
  }[];
}

export interface ReplenishmentDetail {
  id: string;
  productVariant: ProductVariantType | null;
  sentQty: number;
  cost: number;
  receivedQty: number;
  receivingAt: string | null;
  receivingBy: UserInfo | null;
  receivedAt: string | null;
  receivedBy: UserInfo | null;
}

export class ReplenishmentService {
  constructor(
    protected trx: Knex,
    protected user: UserInfo,
  ) {}

  async getReplenishmentDetail(id: string): Promise<{
    replenishmentInfo: Replenishment;
    replenishmentDetails: ReplenishmentDetail[];
    replenishmentPickingList?: FindProductInSlotResult[];
  }> {
    const row = await this.trx
      .table<table_replenishment>("replenishment as rpm")
      .where("rpm.replenish_id", id)
      .innerJoin(
        "replenishment_items as rpm_items",
        "rpm.replenish_id",
        "rpm_items.replenish_id",
      )
      .select(
        "rpm.*",
        "rpm_items.sent_qty",
        "rpm_items.cost",
        "rpm_items.received_qty",
        this.trx.raw("SUM(cost * sent_qty) as total_cost"),
        this.trx.raw("SUM(sent_qty) as total_sent_qty"),
        this.trx.raw("SUM(received_qty) as total_received_qty"),
      )
      .first();

    if (!row) {
      throw new Error("Replenishment not found");
    }

    const warehouseLoader = LoaderFactory.warehouseLoader(this.trx);
    const userLoader = LoaderFactory.userLoader(this.trx);

    const replenishmentInfo: Replenishment = {
      id: row.replenish_id,
      autoId: row.auto_id,
      fromWarehouseId: row.from_warehouse
        ? await warehouseLoader.load(row.from_warehouse)
        : null,
      toWarehouseId: row.to_warehouse
        ? await warehouseLoader.load(row.to_warehouse)
        : null,
      status: row.status,
      createdAt: row.created_at ? Formatter.dateTime(row.created_at) : null,
      createdBy: row.created_by ? await userLoader.load(row.created_by) : null,
      updatedAt: row.updated_at ? Formatter.dateTime(row.updated_at) : null,
      updatedBy: row.updated_by ? await userLoader.load(row.updated_by) : null,
      totalSentQty: row.total_sent_qty ?? 0,
      totalCost: row.total_cost ?? 0,
      totalReceivedQty: row.total_received_qty ?? 0,
    };

    const replenishmentDetails: table_replenishment_items[] = await this.trx
      .table("replenishment_items")
      .where({ replenish_id: id });

    const productVariantLoader = LoaderFactory.productVariantByIdLoader(
      this.trx,
      this.user.currentWarehouseId!,
    );
    const detailsWithVariants = await Promise.all(
      replenishmentDetails.map(async (detail) => ({
        id: detail.replenish_items_id!,
        productVariant: detail.product_variant_id
          ? await productVariantLoader.load(detail.product_variant_id)
          : null,
        sentQty: detail.sent_qty ?? 0,
        cost: Number(detail.cost) ?? 0,
        receivedQty: detail.received_qty ?? 0,
        receivingAt: detail.receiving_at
          ? Formatter.dateTime(detail.receiving_at)
          : null,
        receivingBy: detail.receiving_by
          ? await userLoader.load(detail.receiving_by)
          : null,
        receivedAt: detail.received_at
          ? Formatter.dateTime(detail.received_at)
          : null,
        receivedBy: detail.received_by
          ? await userLoader.load(detail.received_by)
          : null,
      })),
    );
    const replenishmentPickingList = await this.getReplenishmentPickingList(id);

    return {
      replenishmentInfo,
      replenishmentDetails: detailsWithVariants,
      replenishmentPickingList,
    };
  }

  async getReplenishment(
    filter: ReplenishmentFilterType,
  ): Promise<{ total: number; data: Replenishment[] }> {
    const query = this.trx
      .select("replenishment.*")
      .from<table_replenishment>("replenishment")
      .whereNull("replenishment.deleted_at");

    if (filter.fromWarehouseId) {
      query.andWhere("from_warehouse", filter.fromWarehouseId);
    }

    if (filter.toWarehouseId) {
      query.andWhere("to_warehouse", filter.toWarehouseId);
    }

    if (filter.status) {
      query.andWhere("status", filter.status);
    }

    const { total } = await query.clone().count("* as total").first();

    const queryWithPagination = query
      .leftJoin(
        "replenishment_items",
        "replenishment.replenish_id",
        "replenishment_items.replenish_id",
      )
      .sum("sent_qty as total_sent_qty")
      .select(this.trx.raw("SUM(cost * sent_qty) as total_cost"))
      .sum("received_qty as total_received_qty")
      .groupBy("replenishment.replenish_id")
      .limit(Number(filter.limit) || 10)
      .offset(Number(filter.offset) || 0)
      .orderBy("created_at", "desc");

    const rows = await queryWithPagination;

    const warehouseLoader = LoaderFactory.warehouseLoader(this.trx);
    const userLoader = LoaderFactory.userLoader(this.trx);
    const data = await Promise.all(
      rows.map(async (row) => ({
        id: row.replenish_id,
        autoId: row.auto_id,
        fromWarehouseId: row.from_warehouse
          ? await warehouseLoader.load(row.from_warehouse)
          : null,
        toWarehouseId: row.to_warehouse
          ? await warehouseLoader.load(row.to_warehouse)
          : null,
        status: row.status,
        createdAt: row.created_at ? Formatter.dateTime(row.created_at) : null,
        createdBy: row.created_by
          ? await userLoader.load(row.created_by)
          : null,
        updatedAt: row.updated_at ? Formatter.dateTime(row.updated_at) : null,
        updatedBy: row.updated_by
          ? await userLoader.load(row.updated_by)
          : null,
        totalSentQty: row.total_sent_qty ?? 0,
        totalCost: row.total_cost ?? 0,
        totalReceivedQty: row.total_received_qty ?? 0,
      })),
    );

    return {
      total,
      data,
    };
  }
  async createReplenishment(input: ReplenishmentCreateType) {
    return await this.trx.transaction(async (trx) => {
      const replenishmentId = generateId();
      const now = Formatter.getNowDateTime();

      const variantStock = LoaderFactory.variantStockLoader(
        trx,
        input.fromWarehouseId,
      );

      const items = input.replenishmentDetails;

      await trx<table_replenishment>("replenishment").insert({
        replenish_id: replenishmentId,
        from_warehouse: input.fromWarehouseId,
        to_warehouse: input.toWarehouseId,
        status: "draft",
        created_at: now,
        created_by: this.user.id,
      });

      const replenishmentDetails = await Promise.all(
        items.map(async (item) => {
          const warehouseStock = await variantStock.load(item.variantId);

          if (!warehouseStock) {
            throw new Error(
              `Can not find warehouse ID: ${input.fromWarehouseId}`,
            );
          }

          if (warehouseStock.stock < item.sentQty) {
            throw new Error("Don't have enough stock");
          }

          return {
            replenish_items_id: generateId(),
            replenish_id: replenishmentId,
            product_variant_id: item.variantId,
            sent_qty: item.sentQty,
            cost: item.costPerUnit,
          };
        }),
      );
      await trx("replenishment_items").insert(replenishmentDetails);

      return replenishmentId;
    });
  }

  async updateReplenishment(input: ReplenishmentUpdateType) {
    return await this.trx.transaction(async (trx) => {
      // prevent update non-draft replenishment
      const replenishment = await trx
        .select("status")
        .from<table_replenishment>("replenishment")
        .where("replenish_id", input.id)
        .first();

      if (replenishment.status !== "draft") {
        throw new Error("Cannot update non-draft replenishment");
      }

      const now = Formatter.getNowDateTime();
      const replenishmentId = input.id;
      await trx<table_replenishment>("replenishment")
        .update({
          from_warehouse: input.fromWarehouseId,
          to_warehouse: input.toWarehouseId,
          updated_at: now,
          updated_by: this.user.id,
        })
        .where("replenish_id", replenishmentId);

      // delete non-existing replenishment details
      const oldReplenishmentDetails = input.replenishmentDetails.filter(
        (d) => d.id !== undefined,
      );
      await trx<table_replenishment_items>("replenishment_items")
        .delete()
        .whereNotIn(
          "replenish_items_id",
          oldReplenishmentDetails.map((detail) => detail.id),
        )
        .andWhere("replenish_id", replenishmentId);

      // update existing replenishment details
      for (const detail of oldReplenishmentDetails) {
        await trx<table_replenishment_items>("replenishment_items")
          .update({
            product_variant_id: detail.variantId,
            sent_qty: detail.sentQty,
            cost:
              detail.costPerUnit !== undefined
                ? detail.costPerUnit.toString()
                : undefined,
          })
          .where("replenish_items_id", detail.id);
      }

      // insert new replenishment details
      const newDetails = input.replenishmentDetails.filter(
        (detail) => detail.id === undefined,
      );

      const replenishmentDetails = newDetails.map((detail) => ({
        replenish_items_id: generateId(),
        replenish_id: replenishmentId,
        product_variant_id: detail.variantId,
        sent_qty: detail.sentQty,
        cost: detail.costPerUnit,
      }));

      if (replenishmentDetails.length > 0) {
        await trx("replenishment_items").insert(replenishmentDetails);
      }
      return true;
    });
  }

  async deleteReplenishment({ id }: ReplenishmentDeleteType) {
    const now = Formatter.getNowDateTime();
    const deletedBy = this.user.id;

    return await this.trx.transaction(async (trx) => {
      try {
        const replenishment = await trx
          .select("status")
          .from<table_replenishment>("replenishment")
          .where("replenish_id", id)
          .first();

        if (replenishment.status !== "draft") {
          throw new Error("Cannot delete non-draft replenishment");
        }

        await trx<table_replenishment_items>("replenishment_items")
          .update({
            deleted_at: now,
            deleted_by: deletedBy,
          })
          .where("replenish_id", id);

        await trx<table_replenishment>("replenishment")
          .where("replenish_id", id)
          .update({
            status: "deleted",
            deleted_at: now,
            deleted_by: deletedBy,
          });

        return true;
      } catch {
        return false;
      }
    });
  }

  async getSuggestedReplenishmentPickingList(
    replenishmentId?: string,
    itemToFind?: FindProductProps[],
    forReplenishment: boolean = true,
    needConversion: boolean = false,
  ) {
    const query = this.trx<table_warehouse_slot>("warehouse_slot")
      .where("warehouse_id", this.user.currentWarehouseId)
      .where("is_deleted", false);

    if (!!forReplenishment) {
      query.where("for_replenishment", forReplenishment);
    }

    const replenishmentSlots = await query.clone().select();

    const slotIds = replenishmentSlots
      .map((slot) => slot.id)
      .filter((s) => s !== undefined);

    const findProductService = new FindProductInSlotService(
      this.trx,
      this.user,
      slotIds,
    );

    // if replenishmentId is provided, find product in replenishment picking list
    if (itemToFind !== undefined && itemToFind?.length > 0) {
      const result = await findProductService.findProduct(
        itemToFind,
        needConversion,
      );

      return result;
    }

    const replenishmentDetail = await this.trx<table_replenishment_items>(
      "replenishment_items",
    ).where("replenish_id", replenishmentId);

    const ItemsToFind = replenishmentDetail.map((item) => ({
      variantId: item.product_variant_id!,
      toFindQty: item.sent_qty!,
    }));

    const result = await findProductService.findProduct(ItemsToFind);

    return result;
  }

  async updateReplenishmentPickingList({
    replenishmentId,
    pickingList,
  }: UpdateReplenishmentPickingListProps) {
    return await this.trx.transaction(async (trx) => {
      // delete old replenishment picking list
      await trx
        .table("replenishment_picking_list")
        .where("replenishment_id", replenishmentId)
        .delete();

      const data: table_replenishment_picking_list[] = pickingList.map(
        (item) => ({
          replenishment_id: replenishmentId,
          variant_id: item.variantId,
          slot_id: item.slotId,
          qty: item.qty,
          lot_id: item.lotId,
        }),
      );

      await trx.table("replenishment_picking_list").insert(data);
      return true;
    });
  }

  private async getReplenishmentPickingList(
    replenishmentId: string,
  ): Promise<FindProductInSlotResult[]> {
    const replenishmentPickingList = await this.trx
      .table("replenishment_picking_list")
      .where("replenishment_id", replenishmentId)
      .select("variant_id", "slot_id", "qty", "lot_id", "status");

    const variantLoader = LoaderFactory.productVariantByIdLoader(
      this.trx,
      this.user.currentWarehouseId!,
    );
    const slotLoader = LoaderFactory.slotLoader(this.trx);
    const lotLoader = LoaderFactory.productLotLoader(this.trx);

    return await Promise.all(
      replenishmentPickingList.map(async (item) => {
        return {
          qty: item.qty,
          variant: await variantLoader.load(item.variant_id),
          slot: item.slot_id ? await slotLoader.load(item.slot_id) : null,
          stock: 0,
          lot: item.lot_id ? await lotLoader.load(item.lot_id) : null,
          status: item.status,
        };
      }),
    );
  }
  async suggestion(fromWarehouseId: string) {
    const warehouses = await this.trx<table_warehouse>("warehouse")
      .select(["id", "name"])
      .whereNot("id", fromWarehouseId);

    const suggestionsByWarehouse: ReplenishmentSuggestionByWarehouse[] = [];

    for (const warehouse of warehouses) {
      const toWarehouseId = warehouse.id;

      const variantStock = LoaderFactory.variantStockLoader(
        this.trx,
        toWarehouseId!,
      );
      const productVariantLoader = LoaderFactory.productVariantByIdLoader(
        this.trx,
        toWarehouseId!,
      );

      const raws = await this.trx
        .with(
          "all_available_variants",
          this.trx<table_product_variant>("product_variant")
            .innerJoin("product", "product_variant.product_id", "product.id")
            .where("product_variant.available", 1)
            .where("product.deleted_at", null)
            .whereNull("product_variant.deleted_at")
            .select("product_variant.*"),
        )
        .with(
          "only_stock",
          this.trx<table_inventory>("inventory")
            .select("inventory.variant_id")
            .sum({ stock: "inventory.qty" })
            .join("warehouse_slot", "inventory.slot_id", "warehouse_slot.id")
            .where("warehouse_slot.warehouse_id", toWarehouseId)
            .groupBy("inventory.variant_id"),
        )
        .with(
          "variant_with_stock",
          this.trx
            .select("all_available_variants.*")
            .select(this.trx.raw("COALESCE(only_stock.stock, 0) as stock"))
            .from("all_available_variants")
            .leftJoin(
              "only_stock",
              "all_available_variants.id",
              "only_stock.variant_id",
            ),
        )
        .with(
          "on_going_replenishment_items",
          this.trx<table_replenishment>("replenishment")
            .where({
              from_warehouse: fromWarehouseId,
              to_warehouse: toWarehouseId,
            })
            .andWhere((builder) =>
              builder
                .where("status", "approved")
                .orWhere("status", "recieving"),
            )
            .select("replenishment_items.product_variant_id")
            .innerJoin(
              "replenishment_items",
              "replenishment.replenish_id",
              "replenishment_items.replenish_id",
            ),
        )
        .select("*")
        .from("variant_with_stock")
        .whereRaw("low_stock_qty > stock")
        .whereNotExists(function () {
          this.select("*")
            .from("on_going_replenishment_items")
            .whereRaw(
              "on_going_replenishment_items.product_variant_id = variant_with_stock.id",
            );
        });

      const sourceVariantStock = LoaderFactory.variantStockLoader(
        this.trx,
        fromWarehouseId,
        true,
      );

      const items: ReplenishmentSuggestionProduct[] = await Promise.all(
        raws.map(async (raw) => {
          const destStock = raw.id ? await variantStock.load(raw.id) : null;
          const sourceStock = raw.id
            ? await sourceVariantStock.load(raw.id)
            : null;
          const productVariant = raw.id
            ? await productVariantLoader.load(raw.id)
            : null;

          return {
            id: raw.id,
            name: raw.name,
            productId: raw.product_id,
            sku: raw.sku,
            barcode: raw.barcode,
            createdAt: raw.created_at,
            price: raw.price,
            available: raw.available > 0,
            isDefault: raw.is_default > 0,
            purchasedCost: raw.purchased_cost,
            lowStockQty: raw.low_stock_qty,
            idealStockQty: raw.ideal_stock_qty,
            stock: destStock?.stock ?? 0,
            costPerUnit: 0,
            sourceStock: sourceStock?.stock ?? 0,
            basicProduct: productVariant?.basicProduct ?? null,
          };
        }),
      );

      suggestionsByWarehouse.push({
        name: warehouse.name,
        total: items.length,
        warehouseId: toWarehouseId!,
        items,
      });
    }

    return suggestionsByWarehouse;
  }
  async approveReplenishment(id: string) {
    const now = Formatter.getNowDateTime();
    return await this.trx.transaction(async (trx) => {
      const replenishment = await trx
        .table<table_replenishment>("replenishment")
        .where("replenish_id", id)
        .first();
      if (!replenishment) {
        throw new Error("Replenishment not found");
      }
      if (replenishment.status !== "draft") {
        throw new Error("Cannot approve non-draft replenishment");
      }
      // get replenishment details
      const replenishmentDetails: table_replenishment_items[] = await trx
        .table<table_replenishment_items>("replenishment_items")
        .where("replenish_id", id);
      if (replenishmentDetails.length === 0) {
        throw new Error("Replenishment details not found");
      }
      // get replenishment picking list
      const replenishmentPickingList = await this.trx
        .table("replenishment_picking_list")
        .where("replenishment_id", id)
        .select("variant_id", "slot_id", "qty");
      if (replenishmentPickingList.length === 0) {
        throw new Error("Replenishment picking list not found");
      }
      // create replenishment fulfillment
      const replenishmentFulfillmentId = generateId();
      await trx
        .table<table_fulfill_replenishment>("fulfill_replenishment")
        .insert({
          id: replenishmentFulfillmentId,
          replenishment_id: id,
          created_at: now,
          created_by: this.user.id,
        });
      // deduct stock according to picking list
      for (const item of replenishmentPickingList) {
        const stockMovementService = new SlotMovementService(trx);
        const stockTransactionIds = await stockMovementService.stockout({
          variantId: item.variant_id,
          slotId: item.slot_id,
          qty: item.qty,
          transactionType: "REPLENISHMENT_OUT",
          createdBy: this.user,
        });

        // find replenishment detail id by variant id
        const replenishmentDetail = replenishmentDetails.find(
          (detail) => detail.product_variant_id === item.variant_id,
        );
        if (!replenishmentDetail) {
          throw new Error("Replenishment detail not found");
        }
        // create replenishment fulfillment detail
        for (const stockTransactionId of stockTransactionIds) {
          await trx
            .table<table_fulfill_replenishment_detail>(
              "fulfill_replenishment_detail",
            )
            .insert({
              id: generateId(),
              fulfill_replenishment_id: replenishmentFulfillmentId,
              replenishment_item_id: replenishmentDetail.replenish_items_id,
              transaction_id: stockTransactionId,
            });

          // update replenishment detail fulfilled qty
          await trx
            .table<table_replenishment_items>("replenishment_items")
            .where("replenish_items_id", replenishmentDetail.replenish_items_id)
            .increment("fulfilled_qty", item.qty);
        }
      }

      // update replenishment status to approved
      await trx
        .table<table_replenishment>("replenishment")
        .where("replenish_id", id)
        .update({
          status: "approved",
          updated_at: now,
          updated_by: this.user.id,
        });
      return true;
    });
  }
}
