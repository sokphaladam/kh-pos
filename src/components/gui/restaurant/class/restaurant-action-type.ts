import { CustomerOrderDiscount } from "@/dataloader/discount-by-order-items-loader";
import { OrderModifierType } from "@/dataloader/order-modifier-loader";
import {
  ProductModifierItemType,
  ProductModifierType,
  ProductVariantType,
} from "@/dataloader/product-variant-loader";
import { table_restaurant_tables } from "@/generated/tables";
import { PaymentProps } from "../../pos/types/post-types";
import {
  RestaurantOrder,
  RestaurantOrderItem,
  RestaurantState,
} from "../contexts/restaurant-context";
import { Customer } from "@/classes/customer";

export type RestaurantAction =
  | {
      type: "SELECT_TABLE";
      payload: {
        table: table_restaurant_tables;
        toStatus: "available" | "order_taken" | "cleaning";
      };
    }
  | { type: "CREATE_TABLE"; payload: { table: table_restaurant_tables } }
  | { type: "UPDATE_TABLE"; payload: { table: table_restaurant_tables } }
  | { type: "REMOVE_TABLE"; payload: { table: table_restaurant_tables } }
  | {
      type: "RESET_TABLE_TO_AVAILABLE";
      payload: { table: table_restaurant_tables };
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
      type: "UPDATE_PRODUCT_QTY";
      payload: {
        table: table_restaurant_tables;
        orderDetailId: string;
        quantity: number;
        status: "pending" | "cooking" | "served";
        quantityStatus: number;
        statusMode: "convert" | "force";
      };
    }
  | {
      type: "REMOVE_PRODUCT";
      payload: {
        table: table_restaurant_tables;
        orderDetailId: string;
        status: string;
      };
    }
  | { type: "SEND_TO_KITCHEN"; payload: { table: table_restaurant_tables } }
  | {
      type: "COMPLETED_PRODUCT";
      payload: {
        table: table_restaurant_tables;
        orderDetailId: string;
        qtyToServed: number;
      };
    }
  | {
      type: "SET_DISCOUNT";
      payload: {
        table: table_restaurant_tables;
        orderDetailId: string;
        discount: CustomerOrderDiscount[];
      };
    }
  | {
      type: "CHECKOUT";
      payload: { table: table_restaurant_tables; payments: PaymentProps[] };
    }
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
  | { type: "TRANSFER_PRODUCT"; payload: { table: table_restaurant_tables } }
  | {
      type: "SYNC_STATE";
      payload: Partial<RestaurantState>;
    }
  | {
      type: "ADD_MODIFIER";
      payload: {
        table: table_restaurant_tables;
        orderDetailId: string;
        modifierItem: ProductModifierItemType;
      };
    }
  | {
      type: "REMOVE_MODIFIER";
      payload: {
        table: table_restaurant_tables;
        orderDetailId: string;
        modifierItemId: string;
      };
    }
  | {
      type: "SET_NOTES";
      payload: {
        table: table_restaurant_tables;
        orderDetailId: string;
        notes: OrderModifierType;
      };
    }
  | { type: "REMOVE_ORDER"; payload: { table: table_restaurant_tables } }
  | {
      type: "TRANSFER_TABLE";
      payload: {
        table: table_restaurant_tables;
        destinationTable: table_restaurant_tables;
        orderId: string;
        orderItems: RestaurantOrderItem[];
        originalOrder: RestaurantOrder;
      };
    }
  | {
      type: "SET_CUSTOMER";
      payload: {
        table: table_restaurant_tables;
        count?: number;
      };
    }
  | {
      type: "SET_ORDER_PRINT_TIME";
      payload: {
        table: table_restaurant_tables;
      };
    }
  | {
      type: "SET_FOOD_DELIVERY";
      payload: {
        table: table_restaurant_tables;
        deliveryCode: string;
        servedType: string;
        customer?: Customer;
      };
    };
