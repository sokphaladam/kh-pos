import { OrderModifierType } from "@/dataloader/order-modifier-loader";
import {
  ProductModifierType,
  ProductVariantType,
} from "@/dataloader/product-variant-loader";
import { table_restaurant_tables } from "@/generated/tables";
import { CartState } from "./cart-provider";

export type CartAction =
  | {
      type: "FIRST_ORDER";
      payload: {
        table: table_restaurant_tables;
        invoiceNo: string;
        orderId: string;
        itemId: string;
        product: ProductVariantType & {
          quantity: number;
          notes?: OrderModifierType;
          modifiers?: ProductModifierType[];
        };
      };
    }
  | {
      type: "SELECT_PRODUCT";
      payload: {
        table: table_restaurant_tables;
        product: ProductVariantType & {
          quantity: number;
          notes?: OrderModifierType;
          modifiers?: ProductModifierType[];
        };
        id?: string;
      };
    }
  | {
      type: "REMOVE_PRODUCT";
      payload: {
        table: table_restaurant_tables;
        orderDetailId: string;
      };
    }
  | {
      type: "UPDATE_PRODUCT_QTY";
      payload: {
        table: table_restaurant_tables;
        orderDetailId: string;
        quantity: number;
      };
    }
  | {
      type: "SYNC_STATE";
      payload: Partial<CartState>;
    };
