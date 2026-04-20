import { LoaderFactory } from "@/dataloader/loader-factory";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import {
  table_inventory,
  table_product_lot,
  table_product_variant,
  table_product_variant_conversion,
} from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { z } from "zod";
import { SlotMovementService } from "./slot-movement";

export interface ProductVariantConversionInput {
  fromVariantId: string;
  toVariantId: string;
  productId: string;
  conversionRate: number;
}

export interface ProductVariantConversionType {
  fromVariant: ProductVariantType | null;
  toVariant: ProductVariantType | null;
  productId: string;
  conversionRate: number;
}

export const inputProductConversionSchema = z
  .array(
    z.object({
      fromVariantId: z.string().uuid(),
      toVariantId: z.string().uuid(),
      productId: z.string().uuid(),
      conversionRate: z.number().min(2),
    })
  )
  .optional();

export const convertProductVariantStockSchema = z.object({
  destinationVariant: z.string().uuid(),
  sourceToBreak: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        slotId: z.string().uuid(),
        quantity: z.number().min(1),
      })
    )
    .default([]),
  sourceToRepack: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        slotId: z.string().uuid(),
        quantity: z.number().min(1),
      })
    )
    .default([]),
  destinationSlot: z.string().uuid(),
  destinationQty: z.number().min(1),
  conversionType: z.enum(["BREAK", "REPACK", "MIXED"]),
});

interface StockInfo {
  variantId: string;
  slotId: string;
  qty: number;
}

interface ConversionResult {
  stockInfo: StockInfo[];
  conversionType: "BREAK" | "REPACK" | "MIXED";
  remainingQty: number;
}

export class ProductVariantConversion {
  constructor(protected trx: Knex, protected user: UserInfo) {}

  async addProductVariantConversion(
    input: ProductVariantConversionInput[],
    productId: string
  ): Promise<void> {
    return this.trx.transaction(async (trx) => {
      if (input.length === 0) {
        await trx("product_variant_conversion")
          .where({ product_id: productId })
          .delete();
        return;
      }

      // get existing conversions
      const existingConversions = await trx("product_variant_conversion")
        .where({ product_id: productId })
        .select("*");

      // delete those records that have no in new input
      for (const conversion of existingConversions) {
        if (
          !input.find(
            (i) =>
              i.fromVariantId === conversion.from_variant_id &&
              i.toVariantId === conversion.to_variant_id &&
              i.productId === conversion.product_id
          )
        ) {
          await trx("product_variant_conversion")
            .where({
              from_variant_id: conversion.from_variant_id,
              to_variant_id: conversion.to_variant_id,
              product_id: conversion.product_id,
            })
            .delete();
        }
      }

      // insert new conversions
      const now = Formatter.getNowDateTime();
      for (const conversion of input) {
        await trx<table_product_variant_conversion>(
          "product_variant_conversion"
        )
          .insert({
            from_variant_id: conversion.fromVariantId,
            to_variant_id: conversion.toVariantId,
            product_id: conversion.productId,
            conversion_rate: conversion.conversionRate,
            created_at: now,
            created_by: this.user.id,
          })
          .onConflict(["from_variant_id", "to_variant_id", "product_id"])
          .merge();
      }
    });
  }

  async getProductVariantConversions(
    productId: string
  ): Promise<ProductVariantConversionType[]> {
    const conversionLoader = LoaderFactory.productVariantConversionLoader(
      this.trx,
      this.user.currentWarehouseId!
    );
    return conversionLoader.load(productId);
  }

  async breakBulkProductVariantStock(
    input: z.infer<typeof convertProductVariantStockSchema>
  ) {
    return this.trx.transaction(async (trx) => {
      let archiveQty = 0;
      const destVariantInfo = await trx<table_product_variant>(
        "product_variant"
      )
        .where({ id: input.destinationVariant })
        .first();
      for (const source of input.sourceToBreak) {
        // check of the conversion exists
        const conversion = await trx("product_variant_conversion")
          .where({
            from_variant_id: source.variantId, // bigger unit
            to_variant_id: input.destinationVariant,
          })
          .first();

        if (!conversion) {
          throw new Error("Conversion not found");
        }
        // check available stock for the specific variant in the slot
        const availableStockResult = await trx<table_inventory>("inventory")
          .where({
            slot_id: source.slotId,
            variant_id: source.variantId,
          })
          .sum("qty as total")
          .first();

        const totalAvailableStock = Number(
          (availableStockResult as unknown as Record<string, unknown>)?.total ||
            0
        );

        if (totalAvailableStock < source.quantity) {
          throw new Error(`Insufficient stock }`);
        }

        // deduct stock from source Variant
        const stockMovement = new SlotMovementService(trx);
        const trxIds = await stockMovement.stockout({
          slotId: source.slotId,
          variantId: source.variantId,
          qty: source.quantity,
          transactionType: "CONVERSION_OUT",
          createdBy: this.user,
        });

        for (const trxId of trxIds) {
          // get product lot information
          const transactionDetail = await stockMovement.getTransactionDetail(
            trxId
          );
          // check conversion rate and stock in
          const stockInQty =
            Math.abs(transactionDetail?.transaction.qty || 1) *
            Number(conversion.conversion_rate);

          await stockMovement.stockin({
            slotId: input.destinationSlot,
            variantId: input.destinationVariant,
            qty: stockInQty,
            transactionType: "CONVERSION_IN",
            createdBy: this.user,
            productLot: {
              lotNumber: transactionDetail?.lot?.lot_number,
              expiredAt: transactionDetail?.lot?.expiration_date ?? undefined,
              manufacturedAt:
                transactionDetail?.lot?.manufacturing_date ?? undefined,
              costPerUnit: Number(destVariantInfo?.purchased_cost || 0),
              variantId: input.destinationVariant,
            },
          });
          archiveQty += stockInQty;
        }
      }
      return archiveQty;
    });
  }

  async repackProductVariantStock(
    input: z.infer<typeof convertProductVariantStockSchema>
  ) {
    return this.trx.transaction(async (trx) => {
      const destVariantInfo = await trx<table_product_variant>(
        "product_variant"
      )
        .where({ id: input.destinationVariant })
        .first();

      let consumedQty = 0;
      const oldestProductLot: table_product_lot | null = {
        lot_number: "",
        expiration_date: Formatter.getNowDate(),
        manufacturing_date: null,
        created_at: Formatter.getNowDateTime(),
        variant_id: input.destinationVariant,
        cost_per_unit: String(destVariantInfo?.purchased_cost || 0),
      };
      const stockMovement = new SlotMovementService(trx);

      for (const slot of input.sourceToRepack) {
        // check if the reverse conversion exists(from smaller unit to bigger unit)
        const conversion = await trx("product_variant_conversion")
          .where({
            from_variant_id: input.destinationVariant, // bigger unit
            to_variant_id: slot.variantId, // smaller unit
          })
          .first();
        if (!conversion) {
          throw new Error(
            "Reverse conversion not found. Cannot repack without conversion rate."
          );
        }
        // check if available stock in this slot
        const availableStock = await trx<table_inventory>("inventory")
          .where({
            slot_id: slot.slotId,
            variant_id: slot.variantId,
          })
          .sum("qty as total")
          .first();

        const totalAvailable = Number(
          (availableStock as unknown as Record<string, unknown>)?.total || 0
        );

        if (totalAvailable < slot.quantity) {
          throw new Error(`Insufficient stock`);
        }

        const conversionRate = Number(conversion.conversion_rate || 1);

        consumedQty += slot.quantity / conversionRate;
        // deduct stock from source variant (smaller unit)
        const trxIds = await stockMovement.stockout({
          slotId: slot.slotId,
          variantId: slot.variantId,
          qty: slot.quantity,
          transactionType: "CONVERSION_OUT",
          createdBy: this.user,
        });

        await this.findOldestProductLot(
          trxIds,
          oldestProductLot,
          stockMovement
        );
      }
      if (consumedQty < input.destinationQty) {
        throw new Error(`Insufficient stock for repacking.`);
      }
      // add stock
      await stockMovement.stockin({
        slotId: input.destinationSlot,
        variantId: input.destinationVariant,
        qty: consumedQty,
        transactionType: "CONVERSION_IN",
        createdBy: this.user,
        productLot: {
          lotNumber: oldestProductLot.lot_number,
          expiredAt: oldestProductLot.expiration_date ?? undefined,
          manufacturedAt: oldestProductLot.manufacturing_date ?? undefined,
          costPerUnit: Number(destVariantInfo?.purchased_cost || 0),
          variantId: input.destinationVariant,
        },
      });
      return consumedQty;
    });
  }

  private async findOldestProductLot(
    transactionIds: string[],
    oldestProductLot: table_product_lot,
    stockMovement: SlotMovementService
  ) {
    for (const trxId of transactionIds) {
      const transactionDetail = await stockMovement.getTransactionDetail(trxId);
      // find the oldest product lot
      const newLot = transactionDetail?.lot;
      if (!newLot) continue;
      if (!newLot.created_at) continue;

      if (newLot.created_at < oldestProductLot.created_at!) {
        oldestProductLot = {
          ...oldestProductLot,
          expiration_date: newLot.expiration_date,
        };
      }
    }
  }

  async availableStockConversion(item: {
    requiredVariantId: string;
    requiredQty: number;
  }): Promise<ConversionResult[]> {
    const result: ConversionResult[] = [];

    const existingConversion: table_product_variant_conversion[] =
      await this.trx("product_variant_conversion")
        .orWhere("from_variant_id", item.requiredVariantId)
        .orWhere("to_variant_id", item.requiredVariantId);

    if (existingConversion.length === 0) {
      return [];
    }

    let remainingQty = item.requiredQty;

    // if we have bigger unit available for conversion: break down to smaller units
    const biggerUnits = existingConversion.filter(
      (conversion) => conversion.to_variant_id === item.requiredVariantId
    );

    if (biggerUnits.length > 0) {
      const breakdownResult = await this.findOptimalBreakdownCombination(
        item.requiredQty,
        biggerUnits
      );

      if (
        breakdownResult.remainingQty <= 0 &&
        breakdownResult.stockInfo.length > 0
      )
        return [breakdownResult];

      if (
        breakdownResult.remainingQty < item.requiredQty &&
        breakdownResult.stockInfo.length > 0
      ) {
        remainingQty = breakdownResult.remainingQty;
        result.push(breakdownResult);
      }
    }

    // if we have smaller unit available for conversion: repackage to bigger units
    const smallerUnits = existingConversion.filter(
      (conversion) => conversion.from_variant_id === item.requiredVariantId
    );
    if (smallerUnits.length > 0) {
      const repackResult = await this.findOptimalRepackCombination(
        remainingQty,
        smallerUnits
      );

      if (result.length === 0 && repackResult.stockInfo.length > 0) {
        return [repackResult];
      }
      result.push(repackResult);
      remainingQty = repackResult.remainingQty;
    }

    if (result.length === 2) {
      return result;
    }

    return [];
  }

  private async findOptimalBreakdownCombination(
    requiredQty: number,
    biggerUnits: table_product_variant_conversion[]
  ): Promise<ConversionResult> {
    const result: ConversionResult = {
      stockInfo: [],
      conversionType: "BREAK",
      remainingQty: requiredQty,
    };

    // Get all available inventory for bigger units
    const inventoryStock = await this.getInventoryByVariants(
      biggerUnits.map((u) => u.from_variant_id)
    );

    // Sort inventory by conversion efficiency (highest conversion rate first)
    // This ensures we use the most efficient conversions first
    const sortedInventory = inventoryStock
      .map((stock) => {
        const conversion = biggerUnits.find(
          (u) => u.from_variant_id === stock.variant_id
        );
        return {
          ...stock,
          conversion: conversion!,
          smallUnitsPerBigUnit: conversion!.conversion_rate,
        };
      })
      .sort((a, b) => b.smallUnitsPerBigUnit - a.smallUnitsPerBigUnit);

    let remainingQty = requiredQty;

    for (const stock of sortedInventory) {
      if (remainingQty <= 0) break;

      // Calculate minimum big units needed to satisfy remaining requirement
      const minBigUnitsNeeded = Math.ceil(
        remainingQty / stock.smallUnitsPerBigUnit
      );

      // Use the minimum of what we need vs what's available
      const bigUnitsToUse = Math.min(minBigUnitsNeeded, stock.qty);

      // Calculate actual small units we'll get from this breakdown
      const smallUnitsFromThisBreakdown =
        bigUnitsToUse * stock.smallUnitsPerBigUnit;

      result.stockInfo.push({
        variantId: stock.variant_id,
        slotId: stock.slot_id!,
        qty: bigUnitsToUse, // This is the minimum qty to breakdown
      });

      remainingQty -= smallUnitsFromThisBreakdown;
    }

    return { ...result, remainingQty: Math.max(remainingQty, 0) };
  }

  private async findOptimalRepackCombination(
    requiredQty: number,
    smallerUnits: table_product_variant_conversion[],
    requireFloor: boolean = false
  ): Promise<ConversionResult> {
    const result: ConversionResult = {
      stockInfo: [],
      conversionType: "REPACK",
      remainingQty: requiredQty,
    };

    // Get all available inventory for smaller units
    const inventoryStock = await this.getInventoryByVariants(
      smallerUnits.map((u) => u.to_variant_id)
    );
    // sort conversions by conversion rate ascending
    smallerUnits.sort((a, b) => a.conversion_rate - b.conversion_rate);

    let remainingQty = requiredQty;

    for (const unit of smallerUnits) {
      if (remainingQty <= 0) break;

      const stock = inventoryStock.filter(
        (s) => s.variant_id === unit.to_variant_id
      );

      for (const s of stock) {
        if (remainingQty <= 0) break;

        // Calculate how many small units we need to produce the remaining required big units
        const smallUnitsNeeded = remainingQty * unit.conversion_rate;

        // Use the minimum of what we need vs what's available in this slot
        let smallUnitsToUse = Math.min(smallUnitsNeeded, s.qty);

        // Calculate how many big units this will produce
        let bigUnitsProduced = smallUnitsToUse / unit.conversion_rate;
        if (requireFloor) {
          bigUnitsProduced = Math.floor(smallUnitsToUse / unit.conversion_rate);
        }
        if (bigUnitsProduced === 0) continue;

        smallUnitsToUse = bigUnitsProduced * unit.conversion_rate;

        result.stockInfo.push({
          variantId: s.variant_id,
          slotId: s.slot_id!,
          qty: smallUnitsToUse, // Use exact quantity needed, not all available
        });

        remainingQty -= bigUnitsProduced;
      }
    }

    // if the remaining quantity is greater than 0 and not the complete unit
    if (remainingQty > 0 && remainingQty % 1 !== 0) {
      return await this.findOptimalRepackCombination(
        requiredQty,
        smallerUnits,
        true
      );
    } else {
      return { ...result, remainingQty: Math.max(remainingQty, 0) };
    }
  }

  private async getInventoryByVariants(variantIds: string[]) {
    return this.trx<table_inventory>("inventory")
      .whereIn("variant_id", variantIds)
      .where("qty", ">", 0)
      .orderBy("expired_at", "asc")
      .select<table_inventory[]>();
  }
}
