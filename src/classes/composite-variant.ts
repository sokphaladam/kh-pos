import { LoaderFactory } from "@/dataloader/loader-factory";
import {
  table_product_variant,
  table_variant_composite,
  table_warehouse_slot,
} from "@/generated/tables";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { Knex } from "knex";
import { SlotMovementService } from "./slot-movement";
import { getVariantProperName } from "@/dataloader/product-variant-by-id-loader";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import {
  FindProductInSlotResult,
  FindProductInSlotService,
} from "./find-product-in-slot";
import { StockinInput } from "@/app/api/inventory/stockin/type";

export interface CompositeStockSlotInput {
  slotId: string;
  qty: number;
}
export interface ComposeVariantProps {
  composedVariant: StockinInput;
  componentVariants: {
    id: string;
    stockSlots: CompositeStockSlotInput[];
  }[];
}

export interface ProductVariantComponent extends ProductVariantType {
  availableStock: number;
  requiredStock: number;
  canProduce: boolean;
}

export interface CompositionDraft extends ProductVariantComponent {
  stockSlots: FindProductInSlotResult[];
}

export class CompositeVariant {
  constructor(
    protected trx: Knex,
    protected user: UserInfo,
  ) {}

  // flow to compose a variant:
  // 1. User search and select composed variant and input production quantity
  // 1.1. (We need to add option to filter only composite variants in searchProduct)
  // 2. Call to api getCompositionDraft to get
  // 2.1 component variants with required stock, available stock and slot
  // 2.2 Show the component variants that have insufficient stock
  // 3. Suggest available production quantity based on available stock
  // 4. User can save the composition draft and print the stock picking list
  // 5. User can confirm the composition by select stockin slot and calling composeVariant

  private async getCompositeVariantAndComponentStocks(
    trx: Knex,
    variantId: string,
    qty: number,
  ) {
    const compositeVariant: table_product_variant = await trx
      .table<table_product_variant>("product_variant")
      .where("id", variantId)
      .whereNull("deleted_at")
      .where("is_composite", 1)
      .first();

    if (!compositeVariant) {
      throw new Error("Composite variant not found");
    }

    const componentVariants: table_variant_composite[] = await trx
      .table<table_variant_composite>("variant_composite")
      .where("variant_composite_id", variantId)
      .whereNull("deleted_at");

    if (componentVariants.length === 0) {
      throw new Error("No component variants found for this composite variant");
    }

    const variantWithStockLoader = LoaderFactory.productVariantByIdLoader(
      trx,
      this.user.currentWarehouseId!,
    );

    const componentStocks: ProductVariantComponent[] = await Promise.all(
      componentVariants.map(async (component) => {
        const stock = await variantWithStockLoader.load(
          component.variant_component_id,
        );
        const requiredStock = (component.qty || 0) * qty;
        const availableStock = stock?.stock || 0;
        return {
          ...stock,
          availableStock,
          requiredStock,
          canProduce: availableStock >= requiredStock,
        } as ProductVariantComponent;
      }),
    );

    return { compositeVariant, componentVariants, componentStocks };
  }

  async getCompositionDraft(
    variantId: string,
    qty: number,
  ): Promise<CompositionDraft[]> {
    return await this.trx.transaction(async (trx) => {
      const { componentStocks } =
        await this.getCompositeVariantAndComponentStocks(trx, variantId, qty);

      const slots = await this.trx<table_warehouse_slot>("warehouse_slot")
        .where("warehouse_id", this.user.currentWarehouseId)
        .where("is_deleted", false);

      const findProductService = new FindProductInSlotService(
        trx,
        this.user,
        slots.map((slot) => slot.id!),
      );

      const stockInSlots = await findProductService.findProduct(
        componentStocks.map((stock) => ({
          variantId: stock.id,
          toFindQty: stock.requiredStock,
        })),
      );

      return componentStocks.map((stock) => {
        const stockInSlot = stockInSlots.filter(
          (s) => s.variant?.id === stock.id,
        );
        return {
          ...stock,
          stockSlots: stockInSlot,
        };
      });
    });
  }

  async composeVariant(data: ComposeVariantProps): Promise<boolean> {
    return await this.trx.transaction(async (trx) => {
      const { componentStocks } =
        await this.getCompositeVariantAndComponentStocks(
          trx,
          data.composedVariant.variantId,
          data.composedVariant.qty,
        );

      const insufficientStocks = componentStocks.filter(
        (stock) => !stock.canProduce,
      );

      if (insufficientStocks.length > 0) {
        const errorMessages = insufficientStocks.map(
          (stock) =>
            ` Variant ${stock.basicProduct?.title} (${stock.name}): required ${stock.requiredStock}, available ${stock.availableStock}`,
        );
        throw new Error(
          `Cannot produce composite variant due to insufficient stocks:\n${errorMessages.join(
            "\n",
          )}`,
        );
      }

      // compare given component variants stock and slot with
      // componentStocks that has been fetched
      for (const component of componentStocks) {
        const matchingComponent = data.componentVariants.filter(
          (c) => c.id === component.id,
        );
        if (matchingComponent.length === 0) {
          throw new Error(
            `Component variant ${getVariantProperName(
              component as ProductVariantType,
            )} not found in the provided components`,
          );
        }

        const givenStock = matchingComponent.reduce(
          (acc, curr) =>
            acc +
            curr.stockSlots.reduce((slotAcc, slot) => slotAcc + slot.qty, 0),
          0,
        );
        if (givenStock !== component.requiredStock) {
          throw new Error(
            `Component variant ${getVariantProperName(
              component as ProductVariantType,
            )} has a mismatch in required stock. Expected ${
              component.requiredStock
            }, but got ${givenStock}`,
          );
        }
      }

      const stockMovementService = new SlotMovementService(trx);

      // Stockout the components variants
      for (const component of data.componentVariants) {
        for (const slot of component.stockSlots) {
          await stockMovementService.stockout({
            slotId: slot.slotId,
            variantId: component.id,
            qty: slot.qty,
            transactionType: "COMPOSE_OUT",
            createdBy: this.user,
          });
        }
      }

      // Stock in the composite variant
      await stockMovementService.stockin({
        slotId: data.composedVariant.slotId,
        variantId: data.composedVariant.variantId,
        qty: data.composedVariant.qty,
        transactionType: "COMPOSE_IN",
        createdBy: this.user,
        productLot: {
          ...data.composedVariant.productLot,
          variantId: data.composedVariant.variantId,
        },
      });
      return true;
    });
  }
}
