import { table_inventory } from "@/generated/tables";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { ProductLot } from "@/dataloader/product-lot";
import { LoaderFactory } from "@/dataloader/loader-factory";
import { Slot } from "@/dataloader/slot-loader";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { SlotMovementService } from "./slot-movement";

export interface StockByLot {
  lot: ProductLot | null;
  stock: number;
}

export interface StockDetailForCounting {
  variant?: ProductVariantType | null;
  stockLot: StockByLot[];
}

export interface StockCountingProps {
  variantId: string;
  slotId: string;
  stockLot: StockByLot[];
}

export class StockCountingService {
  constructor(protected trx: Knex, protected user: UserInfo) {}

  async getStockDetailByVariant(
    variantId: string,
    slotId: string
  ): Promise<StockDetailForCounting> {
    const stocks = await this.trx<table_inventory>("inventory")
      .innerJoin("warehouse_slot", "inventory.slot_id", "warehouse_slot.id")
      .where("warehouse_slot.warehouse_id", this.user.currentWarehouseId)
      .where("variant_id", variantId)
      .where("slot_id", slotId)
      .select("inventory.*");

    const variantLoader = LoaderFactory.productVariantByIdLoader(
      this.trx,
      this.user.currentWarehouseId!
    );

    const variant = await variantLoader.load(variantId);
    const lotLoader = LoaderFactory.productLotLoader(this.trx);

    const stockDetails = await Promise.all(
      stocks.map(async (stock) => {
        return {
          lot: await lotLoader.load(stock.lot_id),
          stock: stock.qty,
        } as StockByLot;
      })
    );

    return {
      variant,
      stockLot: stockDetails,
    };
  }

  async getSlotsByVariant(variantId: string): Promise<(Slot | null)[]> {
    const slots = await this.trx
      .table("inventory")
      .innerJoin("warehouse_slot", "inventory.slot_id", "warehouse_slot.id")
      .where("warehouse_slot.warehouse_id", this.user.currentWarehouseId)
      .where("variant_id", variantId)
      .select()
      .distinct("slot_id");

    const slotLoader = LoaderFactory.slotLoader(this.trx);
    return await Promise.all(
      slots.map(async (slot) => {
        return slotLoader.load(slot.slot_id);
      })
    );
  }

  async countStockByVariant({
    variantId,
    slotId,
    stockLot,
  }: StockCountingProps) {
    return await this.trx.transaction(async (trx) => {
      for (const stock of stockLot) {
        if (!stock.lot?.id) continue;
        // get the current stock
        const currentStock: table_inventory = await trx
          .table<table_inventory>("inventory")
          .where("variant_id", variantId)
          .where("slot_id", slotId)
          .where("lot_id", stock.lot?.id)
          .first()
          .forUpdate();
        if (currentStock) {
          const newStock = stock.stock;
          const diff = newStock - currentStock.qty;
          if (diff === 0) continue;
          const stockMovement = new SlotMovementService(trx);
          await stockMovement.adjustStock({
            variantId,
            slotId,
            qty: diff,
            lotId: stock.lot?.id,
            createdBy: this.user,
            transactionType: diff > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
          });
        }
      }
      return true;
    });
  }
}
