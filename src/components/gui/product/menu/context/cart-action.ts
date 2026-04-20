import { RestaurantaAction } from "@/components/gui/restaurant/class/restaurant";
import { OrderModifierType } from "@/dataloader/order-modifier-loader";
import {
  ProductModifierType,
  ProductVariantType,
} from "@/dataloader/product-variant-loader";
import { table_restaurant_tables } from "@/generated/tables";
import { Draft } from "immer";
import { CartState } from "./cart-provider";

export class CartAction {
  public static handleFirstOrder(
    draft: Draft<CartState>,
    payload: {
      table: table_restaurant_tables;
      invoiceNo: string;
      orderId: string;
      product: ProductVariantType & {
        quantity: number;
        notes?: OrderModifierType;
        modifiers?: ProductModifierType[];
      };
      itemId: string;
    }
  ): void {
    if (draft.orders) {
      draft.orders.invoiceNo = Number(payload.invoiceNo);
      draft.orders.orderId = payload.orderId;
      draft.orders.customerId = draft.posInfo?.posCustomerId || "";

      // Add new item
      const newItem = RestaurantaAction.createNewOrderItem(
        payload.product,
        payload.itemId
      );
      if (
        draft.orders.printCount === 0 ||
        draft.orders.printCount === undefined
      ) {
        draft.orders.printCount = 1;
        draft.orders.customer = 1;
      }

      const modifier: OrderModifierType[] = [];

      for (const mod of payload.product.modifiers || []) {
        for (const item of mod.items || []) {
          modifier.push({
            modifierItemId: item.id,
            orderDetailId: newItem.orderDetailId,
            price: Number(item.price || 0),
          });
        }
      }

      draft.orders.items?.push({
        ...newItem,
        orderModifiers: modifier,
        notes: payload.product.notes
          ? {
              modifierItemId: payload.product.notes?.modifierItemId || "",
              orderDetailId: payload.product.notes?.orderDetailId || "",
              notes: payload.product.notes?.notes || "",
              price: payload.product.notes?.price || 0,
            }
          : undefined,
      });
      // Recalculate totals
      draft.orders = RestaurantaAction.calculateOrderTotal(draft.orders!);
    }
  }

  public static handleSelectProduct(
    draft: Draft<CartState>,
    payload: {
      table: table_restaurant_tables;
      product: ProductVariantType & {
        quantity: number;
        notes?: OrderModifierType;
        modifiers?: ProductModifierType[];
      };
      id?: string;
    }
  ): void {
    const existingItemIndex = draft.orders?.items.findIndex(
      (f) =>
        f.orderModifiers?.length === payload.product.modifiers?.length &&
        f.variantId === payload.product.id &&
        f.notes === payload.product.notes
    );
    if (existingItemIndex !== undefined && existingItemIndex >= 0) {
      // Update quantity of existing item
      const existingItem = draft.orders!.items[existingItemIndex];
      existingItem.qty = existingItem.qty + payload.product.quantity;

      const existingStatus = existingItem.status?.findIndex(
        (f) => f.status === "pending"
      );

      if (
        existingStatus !== undefined &&
        existingStatus >= 0 &&
        existingItem.status
      ) {
        existingItem.status![existingStatus].qty =
          existingItem.status![existingStatus].qty + payload.product.quantity;
      } else {
        existingItem.status?.push({
          status: "pending",
          qty: payload.product.quantity,
          orderItemId: existingItem.orderDetailId,
        });
      }
    } else {
      const newItem = RestaurantaAction.createNewOrderItem(
        payload.product,
        payload.id
      );

      const modifier: OrderModifierType[] = [];

      for (const mod of payload.product.modifiers || []) {
        for (const item of mod.items || []) {
          modifier.push({
            modifierItemId: item.id,
            orderDetailId: newItem.orderDetailId,
            price: Number(item.price || 0),
          });
        }
      }

      draft.orders?.items.push({
        ...newItem,
        orderModifiers: modifier,
        notes: payload.product.notes
          ? {
              modifierItemId: payload.product.notes?.modifierItemId || "",
              orderDetailId: payload.product.notes?.orderDetailId || "",
              notes: payload.product.notes?.notes || "",
              price: payload.product.notes?.price || 0,
            }
          : undefined,
      });
    }

    // Recalculate totals
    draft.orders = RestaurantaAction.calculateOrderTotal(draft.orders!);
  }

  public static handleRemoveProduct(
    draft: Draft<CartState>,
    payload: {
      table: table_restaurant_tables;
      orderDetailId: string;
    }
  ): void {
    if (draft.orders) {
      const itemIndex = draft.orders.items.findIndex(
        (f) => f.orderDetailId === payload.orderDetailId
      );
      if (itemIndex >= 0) {
        draft.orders.items.splice(itemIndex, 1);
        // Recalculate totals
        draft.orders = RestaurantaAction.calculateOrderTotal(draft.orders!);
      }
    }
  }

  public static handleUpdateProductQty(
    draft: Draft<CartState>,
    payload: {
      table: table_restaurant_tables;
      orderDetailId: string;
      quantity: number;
    }
  ): void {
    if (draft.orders) {
      const itemIndex = draft.orders.items.findIndex(
        (f) => f.orderDetailId === payload.orderDetailId
      );
      if (itemIndex >= 0) {
        const existingStatus = draft.orders.items[itemIndex].status?.findIndex(
          (f) => f.status === "pending"
        );

        if (existingStatus !== undefined && existingStatus >= 0) {
          draft.orders.items[itemIndex].status![existingStatus].qty =
            payload.quantity;
        }

        // Recalculate totals
        draft.orders = RestaurantaAction.calculateOrderTotal(draft.orders!);
      }
    }
  }
}
