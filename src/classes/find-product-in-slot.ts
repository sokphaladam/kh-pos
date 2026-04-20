import { LoaderFactory } from "@/dataloader/loader-factory";
import { ProductLot } from "@/dataloader/product-lot";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { Slot } from "@/dataloader/slot-loader";
import { table_inventory, table_product } from "@/generated/tables";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { ProductVariantConversion } from "./product-variant-conversion";

export interface FindProductProps {
  variantId: string;
  toFindQty: number;
}

export interface FindProductInSlotResult {
  variant: ProductVariantType | null; // variant to find
  slot: Slot | null;
  lot: ProductLot | null;
  qty: number;
  message?: string;
  stock: number;
  todoType?: "TRANSFER" | "BREAK" | "REPACK" | "NOTHING" | "MIXED";
  status?: string;
  breakdownStockInfo?: {
    variant: ProductVariantType | null;
    slot: Slot | null;
    lot: ProductLot | null;
    qty: number;
  }[];
  repackStockInfo?: {
    variant: ProductVariantType | null;
    slot: Slot | null;
    lot: ProductLot | null;
    qty: number;
  }[];
}

export class FindProductInSlotService {
  constructor(
    protected db: Knex,
    protected user: UserInfo,
    protected slotIds: string[],
  ) {}

  async findProduct(
    items: FindProductProps[],
    convertUnit: boolean = false,
  ): Promise<FindProductInSlotResult[]> {
    const result: {
      variantId: string;
      slotId: string | null;
      lotId: string | null;
      qty: number;
      message?: string;
    }[] = [];

    for (const item of items) {
      const { variantId, toFindQty } = item;

      const stockExpiryList = await this.db
        .table("inventory")
        .where({
          variant_id: variantId,
        })
        .whereIn("slot_id", this.slotIds)
        .where("qty", ">", 0)
        .orderBy("expired_at", "asc")
        .select<table_inventory[]>();

      let remainingQty = toFindQty;
      for (const stock of stockExpiryList) {
        const qtyStockAfterBooking = stock.qty;
        const qtyToDeduct = Math.min(remainingQty, qtyStockAfterBooking);

        if (qtyToDeduct > 0) {
          result.push({
            variantId: variantId,
            slotId: stock.slot_id,
            lotId: stock.lot_id,
            qty: qtyToDeduct,
          });
        }

        remainingQty -= qtyToDeduct > 0 ? qtyToDeduct : 0;

        if (remainingQty <= 0) break;
      }

      if (remainingQty > 0) {
        // get product info to check if it is stock tracked
        const product: table_product = await this.db
          .table("product_variant")
          .innerJoin("product", "product_variant.product_id", "product.id")
          .where({ "product_variant.id": variantId })
          .select("product.*")
          .first();
        if (product.track_stock) {
          result.push({
            variantId: variantId,
            slotId: null,
            lotId: null,
            qty: remainingQty,
            message: `Not enough stock.`,
          });
        }
      }
    }

    // aggregate result by variantId, slotId, and lotId
    const aggregatedResult: {
      variantId: string;
      slotId: string | null;
      lotId: string | null;
      qty: number;
      message?: string;
    }[] = [];
    const map = new Map<
      string,
      {
        variantId: string;
        slotId: string | null;
        lotId: string | null;
        qty: number;
        message?: string;
      }
    >();

    for (const item of result) {
      const key = `${item.variantId}|${item.slotId}|${item.lotId}`;
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.qty += item.qty;
      } else {
        map.set(key, {
          variantId: item.variantId,
          slotId: item.slotId,
          lotId: item.lotId,
          qty: item.qty,
          message: item.message,
        });
      }
    }

    map.forEach((value) => {
      aggregatedResult.push({
        variantId: value.variantId,
        slotId: value.slotId,
        lotId: value.lotId,
        qty: value.qty,
        message: value.message,
      });
    });

    const variantLoader = LoaderFactory.productVariantByIdLoader(
      this.db,
      this.user.currentWarehouseId!,
    );

    const slotLoader = LoaderFactory.slotLoader(this.db);
    const lotLoader = LoaderFactory.productLotLoader(this.db);
    const variantSlotStockLoader = LoaderFactory.variantSlotStockLoader(
      this.db,
      this.user.currentWarehouseId!,
    );

    const stockBySlots: FindProductInSlotResult[] = await Promise.all(
      aggregatedResult.map(async (item) => {
        const stock = await variantSlotStockLoader.load(
          `${item.variantId}_${item.slotId}`,
        );
        const qtyStockAfterBooking = stock?.stock || 0;
        return {
          variant: await variantLoader.load(item.variantId),
          slot: item.slotId ? await slotLoader.load(item.slotId) : null,
          lot: item.lotId ? await lotLoader.load(item.lotId) : null,
          qty: item.qty,
          stock: qtyStockAfterBooking || 0,
          message: item.message,
        };
      }),
    );

    for (const stock of stockBySlots) {
      if (stock.slot?.posSlot) {
        stock.todoType = "NOTHING";
      } else {
        stock.todoType = "TRANSFER";
      }
    }

    // Check for stock conversion if needed
    if (convertUnit) await this.checkForStockConversion(stockBySlots);

    return stockBySlots;
  }

  async checkForStockConversion(items: FindProductInSlotResult[]) {
    const noStock = items.filter((item) => item.slot === null && item.qty > 0);
    if (noStock.length === 0) return;
    const stockConversion = new ProductVariantConversion(this.db, this.user);
    const variantLoader = LoaderFactory.productVariantByIdLoader(
      this.db,
      this.user.currentWarehouseId!,
    );
    const slotLoader = LoaderFactory.slotLoader(this.db);

    for (const item of noStock) {
      if (!item.variant?.id) continue;
      const conversionResult = await stockConversion.availableStockConversion({
        requiredQty: item.qty,
        requiredVariantId: item.variant.id,
      });

      if (conversionResult.length == 0) continue;

      if (conversionResult.length === 1) {
        item.todoType = conversionResult[0].conversionType;
        item.message = "Require to convert unit";
        item.qty = item.qty - conversionResult[0].remainingQty;
        if (conversionResult[0].conversionType === "BREAK") {
          item.breakdownStockInfo = await Promise.all(
            conversionResult[0].stockInfo.map(async (stock) => ({
              variant: await variantLoader.load(stock.variantId),
              slot: stock.slotId ? await slotLoader.load(stock.slotId) : null,
              lot: null,
              qty: stock.qty,
            })),
          );
        } else if (conversionResult[0].conversionType === "REPACK") {
          item.repackStockInfo = await Promise.all(
            conversionResult[0].stockInfo.map(async (stock) => ({
              variant: await variantLoader.load(stock.variantId),
              slot: stock.slotId ? await slotLoader.load(stock.slotId) : null,
              lot: null,
              qty: stock.qty,
            })),
          );
        }

        if (conversionResult[0].remainingQty > 0) {
          items.push({
            variant: item.variant,
            slot: null,
            lot: null,
            qty: conversionResult[0].remainingQty,
            todoType: "NOTHING",
            message: "No available stock",
            stock: 0,
          });
        }
      } else if (conversionResult.length === 2) {
        item.todoType = "MIXED";
        item.message = "Require to convert unit";
        item.qty = item.qty - conversionResult[1].remainingQty;
        item.breakdownStockInfo = await Promise.all(
          conversionResult[0].stockInfo.map(async (stock) => ({
            variant: await variantLoader.load(stock.variantId),
            slot: stock.slotId ? await slotLoader.load(stock.slotId) : null,
            lot: null,
            qty: stock.qty,
          })),
        );
        item.repackStockInfo = await Promise.all(
          conversionResult[1].stockInfo.map(async (stock) => ({
            variant: await variantLoader.load(stock.variantId),
            slot: stock.slotId ? await slotLoader.load(stock.slotId) : null,
            lot: null,
            qty: stock.qty,
          })),
        );
        if (conversionResult[1].remainingQty > 0) {
          items.push({
            variant: item.variant,
            slot: null,
            lot: null,
            qty: conversionResult[1].remainingQty,
            todoType: "NOTHING",
            message: "No available stock",
            stock: 0,
          });
        }
      }
    }
  }
}
