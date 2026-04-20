import { CustomerOrderDiscount } from "@/dataloader/discount-by-order-items-loader";
import { OrderModifierType } from "@/dataloader/order-modifier-loader";
import {
  ProductModifierItemType,
  ProductModifierType,
  ProductVariantType,
} from "@/dataloader/product-variant-loader";
import { table_restaurant_tables } from "@/generated/tables";
import { applyStackDiscount } from "@/lib/apply-stack-discount";
import { Formatter } from "@/lib/formatter";
import { generateId } from "@/lib/generate-id";
import { Draft } from "immer";
import { PaymentProps } from "../../pos/types/post-types";
import {
  RestaurantOrder,
  RestaurantOrderItem,
  RestaurantState,
} from "../contexts/restaurant-context";
import { Customer } from "@/classes/customer";

export class RestaurantaAction {
  // Calculation Helper Methods
  public static calculateModifierTotal(
    modifiers?: OrderModifierType[],
  ): number {
    if (!modifiers) return 0;

    return modifiers.reduce((total, modifier) => {
      return total + Number(modifier.price);
    }, 0);
  }

  public static mergeOrderItem(items: RestaurantOrderItem[]) {
    const map = new Map<string, RestaurantOrderItem>();

    for (const item of items) {
      const key = `${item.orderDetailId}-${item.status}`;

      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.qty += item.qty;
      } else {
        map.set(key, { ...item });
      }
    }

    return Array.from(map.values());
  }

  public static calculateItemTotals(
    item: RestaurantOrderItem,
  ): RestaurantOrderItem {
    const notesCharge = Number(item.notes?.price || 0);
    const totalModifier =
      RestaurantaAction.calculateModifierTotal(item.orderModifiers) +
      notesCharge;
    const priceAfterModifier = Number(item.price || 0) + totalModifier;
    const qty = item.status?.reduce((a, b) => a + b.qty, 0) || 0;
    const subtotal = priceAfterModifier * Number(qty || 0);

    const discountsArray = (item.discounts ?? []).map((d) => ({
      ...d,
      amount: String(d.amount),
      description: "",
      productId: item.productVariant?.basicProduct?.id || "",
      title: d.name,
      updatedAt: Formatter.getNowDateTime(),
      warehouseId: "",
      discountType: d.discountType ?? "AMOUNT",
      value: Number(d.value),
      createdAt: d.createdAt || "",
    }));

    const afterDiscount = applyStackDiscount(
      subtotal,
      discountsArray,
    ).finalPrice;

    return {
      ...item,
      modiferAmount: String(totalModifier),
      discountAmount: String(subtotal - afterDiscount),
      discounts: discountsArray.map((d) => ({
        ...d,
        amount: Number(d.amount),
      })),
      totalAmount: String(afterDiscount),
      price: String(item.price),
    };
  }

  public static calculateOrderTotal(order: RestaurantOrder): RestaurantOrder {
    const items = order.items.map(RestaurantaAction.calculateItemTotals);

    const totalAmount = items.reduce((acc, item) => {
      return acc + (Number(item.totalAmount) || 0);
    }, 0);

    // console.log(orde)

    return {
      ...order,
      items,
      totalAmount: String(totalAmount),
    };
  }

  public static createNewOrderItem(
    product: ProductVariantType & {
      quantity: number;
      notes?: OrderModifierType;
      modifiers?: ProductModifierType[];
    },
    id?: string,
  ): RestaurantOrderItem {
    const orderItemId = id ? id : generateId();
    return {
      orderDetailId: orderItemId,
      variantId: product.id,
      title: product.basicProduct?.title || "",
      discountAmount: "0",
      totalAmount: "0",
      qty: product.quantity,
      price: String(product.price ?? 0),
      sku: String(product.sku),
      barcode: product.barcode,
      modiferAmount: "0",
      productVariant: product,
      status: [
        { orderItemId, qty: product.quantity, status: "pending" },
        { orderItemId, qty: 0, status: "cooking" },
        { orderItemId, qty: 0, status: "served" },
      ],
    };
  }

  public static areProductsIdentical(
    existingItem: RestaurantOrderItem,
    newProduct: ProductVariantType & {
      quantity: number;
      notes?: OrderModifierType;
      modifiers?: ProductModifierType[];
    },
  ): boolean {
    const existingModifierLength = existingItem.orderModifiers?.length || 0;
    return (
      existingItem.variantId === newProduct.id &&
      existingModifierLength === 0 &&
      existingItem.notes === undefined
    );
  }

  public static createNewOrder(): RestaurantOrder {
    return {
      invoiceNo: 0,
      orderId: "",
      createdAt: Formatter.getNowDateTime(),
      createdBy: null,
      customerId: "",
      orderStatus: "DRAFT",
      totalAmount: "0",
      items: [],
      paidAt: null,
      payments: [
        {
          amount: "0",
          amountUsd: "0",
          currency: "USD",
          paymentMethod: "1",
          exchangeRate: "0",
          used: "0",
        },
      ],
    };
  }

  // Action Handler Methods
  public static handleSelectTable(
    draft: Draft<RestaurantState>,
    payload: {
      table: table_restaurant_tables;
      toStatus: "available" | "order_taken" | "cleaning";
    },
  ): void {
    const tableIndex = draft.tables.findIndex((t) => t.id === payload.table.id);
    if (tableIndex !== -1) {
      draft.tables[tableIndex].status = payload.toStatus;
      const activeTableIndex = draft.activeTables.findIndex(
        (f) => f.tables?.id === payload.table.id,
      );
      if (activeTableIndex === -1 && payload.toStatus === "order_taken") {
        draft.activeTables.push({
          tables: draft.tables[tableIndex],
          orders: RestaurantaAction.createNewOrder(),
        });
      }
    }
  }

  public static handleCreateTable(
    draft: Draft<RestaurantState>,
    payload: { table: table_restaurant_tables },
  ): void {
    draft.tables.push({
      ...payload.table,
      order: null,
    });
  }

  public static handleUpdateTable(
    draft: Draft<RestaurantState>,
    payload: { table: table_restaurant_tables },
  ): void {
    const index = draft.tables.findIndex((f) => f.id === payload.table.id);
    if (index !== -1) {
      draft.tables[index] = {
        ...payload.table,
        status: draft.tables[index].status,
        order: draft.tables[index].order,
      };
      const indexActive = draft.activeTables.findIndex(
        (f) => f.tables?.id === payload.table.id,
      );
      if (indexActive !== -1) {
        draft.activeTables[indexActive].tables = {
          ...payload.table,
          status: draft.tables[indexActive].status,
        };
      }
    }
  }

  public static handleRemoveTable(
    draft: Draft<RestaurantState>,
    payload: { table: table_restaurant_tables },
  ): void {
    draft.tables = draft.tables.filter(
      (table) => table.id !== payload.table.id,
    );
  }

  public static handleResetTableToAvailable(
    draft: Draft<RestaurantState>,
    payload: { table: table_restaurant_tables },
  ): void {
    const tableIndex = draft.tables.findIndex((t) => t.id === payload.table.id);

    if (tableIndex !== -1) {
      draft.tables[tableIndex].status = "available";
      const activeTableIndex = draft.activeTables.findIndex(
        (f) => f.tables?.id === payload.table.id,
      );
      if (activeTableIndex !== -1) {
        draft.activeTables = draft.activeTables.filter(
          (f) => f.tables?.id !== payload.table.id,
        );
      }
    }
  }

  public static handleSelectProduct(
    draft: Draft<RestaurantState>,
    payload: {
      table: table_restaurant_tables;
      product: ProductVariantType & {
        quantity: number;
        notes?: OrderModifierType;
        modifiers?: ProductModifierType[];
      };
      id?: string;
    },
  ): void {
    const activeTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.table.id,
    );

    if (
      activeTableIndex === -1 ||
      !draft.activeTables[activeTableIndex].orders
    ) {
      return;
    }

    const order = draft.activeTables[activeTableIndex].orders!;
    const existingItemIndex = order.items?.findIndex((item) =>
      RestaurantaAction.areProductsIdentical(item, payload.product),
    );

    if (existingItemIndex !== undefined && existingItemIndex !== -1) {
      // Increase quantity of existing item
      order.items[existingItemIndex].qty = payload.product.quantity;

      const existingStatus = order.items[existingItemIndex].status?.findIndex(
        (f) => f.status === "pending",
      );

      if (
        existingStatus !== undefined &&
        existingStatus !== -1 &&
        order.items[existingItemIndex].status
      ) {
        order.items[existingItemIndex].status[existingStatus].qty =
          payload.product.quantity;
      } else {
        order.items[existingItemIndex].status?.push({
          status: "pending",
          qty: payload.product.quantity,
          orderItemId: order.items[existingItemIndex].orderDetailId,
        });
      }
    } else {
      // Add new item
      const newItem = RestaurantaAction.createNewOrderItem(
        payload.product,
        payload.id,
      );
      order.items?.push(newItem);
    }

    // Recalculate totals
    draft.activeTables[activeTableIndex].orders =
      RestaurantaAction.calculateOrderTotal(order);
  }

  public static handleUpdateProductQty(
    draft: Draft<RestaurantState>,
    payload: {
      table: table_restaurant_tables;
      orderDetailId: string;
      quantity: number;
      status: "pending" | "cooking" | "served";
      quantityStatus: number;
      statusMode: "convert" | "force";
    },
  ): void {
    const activeTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.table.id,
    );

    if (
      activeTableIndex === -1 ||
      !draft.activeTables[activeTableIndex].orders
    ) {
      return;
    }

    const order = draft.activeTables[activeTableIndex].orders!;
    const itemIndex = order.items?.findIndex(
      (item) => item.orderDetailId === payload.orderDetailId,
    );

    if (itemIndex !== undefined && itemIndex !== -1) {
      if (payload.quantity === 0) {
        order.items.splice(itemIndex, 1);
      } else {
        order.items[itemIndex].qty = payload.quantity;
        const findStatus = order.items[itemIndex].status?.find(
          (f) => f.status === payload.status,
        );

        if (!findStatus) {
          order.items[itemIndex].status?.push({
            orderItemId: payload.orderDetailId,
            qty: 0,
            status: payload.status,
          });
        }
        order.items[itemIndex].status?.forEach((f) => {
          if (f.status === payload.status) {
            if (payload.statusMode === "force") {
              f.qty = payload.quantityStatus;
            } else {
              f.qty += payload.quantityStatus;
            }
          }

          if (payload.statusMode === "convert") {
            if (payload.status === "served" && f.status === "cooking") {
              f.qty -= payload.quantityStatus;
            }
            if (payload.status === "cooking" && f.status === "pending") {
              f.qty -= payload.quantityStatus;
            }
          }
        });
      }

      draft.activeTables[activeTableIndex].orders =
        RestaurantaAction.calculateOrderTotal(order);
    }
  }

  public static handleRemoveProduct(
    draft: Draft<RestaurantState>,
    payload: {
      table: table_restaurant_tables;
      orderDetailId: string;
      status: string;
    },
  ): void {
    const activeTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.table.id,
    );

    if (
      activeTableIndex === -1 ||
      !draft.activeTables[activeTableIndex].orders
    ) {
      return;
    }

    const order = draft.activeTables[activeTableIndex].orders!;
    const itemIndex = order.items.findIndex(
      (item) => item.orderDetailId === payload.orderDetailId,
      // && item.status === payload.status
    );

    if (itemIndex >= 0) {
      order.items.splice(itemIndex, 1);
      draft.activeTables[activeTableIndex].orders =
        RestaurantaAction.calculateOrderTotal(order);
    }
  }
  public static handleSendToKitchen(
    draft: Draft<RestaurantState>,
    payload: { table: table_restaurant_tables },
  ): void {
    const activeTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.table.id,
    );

    if (activeTableIndex === -1) return;

    draft.activeTables[activeTableIndex].orders?.items.forEach((item) => {
      if (!item.status) {
        item.status = [];
      }
      const pendingStatus = item.status.find((s) => s.status === "pending");
      if (pendingStatus) {
        // Move all pending to cooking
        const cookingStatus = item.status.find((s) => s.status === "cooking");
        if (cookingStatus) {
          cookingStatus.qty += pendingStatus.qty;
        } else {
          item.status.push({
            status: "cooking",
            qty: pendingStatus.qty,
            orderItemId: item.orderDetailId,
          });
        }
        pendingStatus.qty = 0;
      }
    });

    draft.activeTables[activeTableIndex].orders!.items =
      RestaurantaAction.mergeOrderItem(
        draft.activeTables[activeTableIndex].orders?.items || [],
      );
  }

  public static handleCompleteProduct(
    draft: Draft<RestaurantState>,
    payload: {
      table: table_restaurant_tables;
      orderDetailId: string;
      qtyToServed: number;
    },
  ): void {
    const activeTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.table.id,
    );

    if (activeTableIndex === -1) return;

    const items = draft.activeTables[activeTableIndex].orders?.items;
    if (!items) return;

    // Find the cooking item to serve
    const cookingItemIndex = items.findIndex(
      (item) => item.orderDetailId === payload.orderDetailId,
      //  && item.status === "cooking"
    );

    if (cookingItemIndex === -1) return;

    const cookingItem = items[cookingItemIndex];

    // Validate that we don't serve more than available
    if (payload.qtyToServed > cookingItem.qty) {
      return;
    }

    // Create a new served item with the specified quantity
    const servedItem: RestaurantOrderItem = {
      ...cookingItem,
      qty: payload.qtyToServed,
      // status: "served",
    };

    // Add the served item to the order
    items.push(servedItem);

    // Update the cooking item quantity
    if (cookingItem.qty === payload.qtyToServed) {
      // Remove the cooking item if all quantity is served
      items.splice(cookingItemIndex, 1);
    } else {
      // Reduce the cooking item quantity
      cookingItem.qty -= payload.qtyToServed;
    }

    // Merge and recalculate order items
    draft.activeTables[activeTableIndex].orders!.items =
      RestaurantaAction.mergeOrderItem(items);
  }

  public static handleSetDiscount(
    draft: Draft<RestaurantState>,
    payload: {
      table: table_restaurant_tables;
      orderDetailId: string;
      discount: CustomerOrderDiscount[];
    },
  ): void {
    const activeTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.table.id,
    );

    if (activeTableIndex === -1) return;

    const order = draft.activeTables[activeTableIndex].orders;
    if (!order) return;

    order.items.forEach((item) => {
      if (item.orderDetailId === payload.orderDetailId) {
        item.discounts = payload.discount;
      }
    });

    draft.activeTables[activeTableIndex].orders =
      RestaurantaAction.calculateOrderTotal(order);
  }

  public static handleCheckout(
    draft: Draft<RestaurantState>,
    payload: { table: table_restaurant_tables; payments: PaymentProps[] },
  ): void {
    const activeTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.table.id,
    );
    const tableIndex = draft.tables.findIndex((t) => t.id === payload.table.id);

    if (activeTableIndex === -1) return;

    const order = draft.activeTables[activeTableIndex].orders;
    if (!order) return;

    order.payments = payload.payments;
    order.orderStatus = "COMPLETED";

    if (tableIndex !== -1) {
      draft.tables[tableIndex].status = "cleaning";
      draft.activeTables.splice(activeTableIndex, 1);
    }
  }

  public static handleFirstOrder(
    draft: Draft<RestaurantState>,
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
    },
  ): void {
    const activeTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.table.id,
    );

    if (activeTableIndex === -1) return;

    const order = draft.activeTables[activeTableIndex].orders;
    if (!order) return;

    order.invoiceNo = Number(payload.invoiceNo);
    order.orderId = payload.orderId;
    order.customerId = draft.posInfo?.posCustomerId || "";
    order.servedType = "dine_in";

    // Add new item
    const newItem = RestaurantaAction.createNewOrderItem(
      payload.product,
      payload.itemId,
    );
    order.customer = 1;
    order.items?.push(newItem);

    // Recalculate totals
    draft.activeTables[activeTableIndex].orders =
      RestaurantaAction.calculateOrderTotal(order);
    draft.tables.forEach((f) => {
      if (f.id === payload.table.id) {
        f.order = draft.activeTables[activeTableIndex].orders!;
      }
    });
  }

  public static handleAddModifier(
    draft: Draft<RestaurantState>,
    payload: {
      table: table_restaurant_tables;
      orderDetailId: string;
      modifierItem: ProductModifierItemType;
    },
  ): void {
    const activeTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.table.id,
    );

    if (activeTableIndex === -1) return;

    const order = draft.activeTables[activeTableIndex].orders;
    if (!order) return;

    const itemIndex = order.items.findIndex(
      (i) => i.orderDetailId === payload.orderDetailId,
    );
    if (itemIndex === -1) return;

    const item = draft.activeTables[activeTableIndex].orders?.items[itemIndex];
    if (item) {
      // Initialize orderModifiers array if it doesn't exist
      if (!item.orderModifiers) {
        item.orderModifiers = [];
      }

      // Add the new modifier
      item.orderModifiers.push({
        modifierItemId: payload.modifierItem.id,
        orderDetailId: payload.orderDetailId,
        price: Number(payload.modifierItem.price || 0),
      });
    }

    // Recalculate totals
    draft.activeTables[activeTableIndex].orders =
      RestaurantaAction.calculateOrderTotal(order);
  }

  public static handleRemoveModifier(
    draft: Draft<RestaurantState>,
    payload: {
      table: table_restaurant_tables;
      orderDetailId: string;
      modifierItemId: string;
    },
  ): void {
    const activeTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.table.id,
    );

    if (activeTableIndex === -1) return;

    const order = draft.activeTables[activeTableIndex].orders;
    if (!order) return;

    const itemIndex = order.items.findIndex(
      (i) => i.orderDetailId === payload.orderDetailId,
    );
    if (itemIndex === -1) return;

    const item = draft.activeTables[activeTableIndex].orders?.items[itemIndex];
    if (item && item.orderModifiers) {
      // Filter out the modifier to remove
      item.orderModifiers = item.orderModifiers.filter(
        (f) => f.modifierItemId !== payload.modifierItemId,
      );
    }

    // Recalculate totals
    draft.activeTables[activeTableIndex].orders =
      RestaurantaAction.calculateOrderTotal(order);
  }

  public static handleSetNotes(
    draft: Draft<RestaurantState>,
    payload: {
      table: table_restaurant_tables;
      orderDetailId: string;
      notes: OrderModifierType;
    },
  ): void {
    const activeTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.table.id,
    );

    if (activeTableIndex === -1) return;

    const order = draft.activeTables[activeTableIndex].orders;
    if (!order) return;

    // Update the notes for the specific item
    order.items.forEach((item) => {
      if (item.orderDetailId === payload.orderDetailId) {
        item.notes = payload.notes;
      }
    });

    // Recalculate totals
    draft.activeTables[activeTableIndex].orders =
      RestaurantaAction.calculateOrderTotal(order);
  }

  public static handleRemoveOrder(
    draft: Draft<RestaurantState>,
    payload: { table: table_restaurant_tables },
  ): void {
    const activeTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.table.id,
    );

    if (activeTableIndex === -1) return;

    draft.tables.forEach((f) => {
      if (f.id === payload.table.id) {
        f.status = "available";
      }
    });

    draft.activeTables.splice(activeTableIndex, 1);
  }

  public static handleTransferTable(
    draft: Draft<RestaurantState>,
    payload: {
      table: table_restaurant_tables;
      destinationTable: table_restaurant_tables;
      orderId: string;
      orderItems: RestaurantOrderItem[];
      originalOrder: RestaurantOrder;
    },
  ) {
    const activeTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.table.id,
    );

    const destinationActiveTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.destinationTable.id,
    );

    if (activeTableIndex === -1) return;

    // Calculate remaining items (items not being transferred)
    // Handle both full item transfers and partial quantity transfers
    const remainingItems: RestaurantOrderItem[] = [];

    payload.originalOrder?.items?.forEach((originalItem) => {
      const transferItem = payload.orderItems.find(
        (item) => item.orderDetailId === originalItem.orderDetailId,
      );

      if (!transferItem) {
        // Item not being transferred at all, keep the entire item
        remainingItems.push({ ...originalItem });
      } else {
        // Item is being transferred, check if there's remaining quantity
        const remainingItem = { ...originalItem };

        // Update status quantities for remaining item
        remainingItem.status =
          originalItem.status?.map((statusItem) => {
            const transferStatusItem = transferItem.status?.find(
              (ts) => ts.status === statusItem.status,
            );

            if (transferStatusItem) {
              const remainingQty = statusItem.qty - transferStatusItem.qty;
              return { ...statusItem, qty: Math.max(0, remainingQty) };
            }

            return { ...statusItem };
          }) || [];

        // Calculate total remaining quantity
        const totalRemainingQty = remainingItem.status.reduce(
          (sum, statusItem) => sum + statusItem.qty,
          0,
        );

        if (totalRemainingQty > 0) {
          remainingItem.qty = totalRemainingQty;
          remainingItems.push(remainingItem);
        }
      }
    });

    const isTransferringAllItems = remainingItems.length === 0;

    // Handle destination table
    if (destinationActiveTableIndex === -1) {
      // Create new active table with transferred items
      draft.activeTables.push({
        tables: { ...payload.destinationTable, status: "order_taken" },
        orders: this.calculateOrderTotal({
          ...payload.originalOrder!,
          items: payload.orderItems,
        }),
      });

      // Update destination table status
      const destinationTableIndex = draft.tables.findIndex(
        (t) => t.id === payload.destinationTable.id,
      );
      if (destinationTableIndex !== -1) {
        draft.tables[destinationTableIndex].status = "order_taken";
        draft.tables[destinationTableIndex].order = this.calculateOrderTotal({
          ...payload.originalOrder!,
          items: payload.orderItems,
        });
      }
    } else {
      // Merge with existing destination table orders
      const destinationOrder =
        draft.activeTables[destinationActiveTableIndex].orders;
      if (destinationOrder) {
        // Add transferred items to destination table
        destinationOrder.items.push(...payload.orderItems);

        // Recalculate destination order totals
        draft.activeTables[destinationActiveTableIndex].orders =
          this.calculateOrderTotal(destinationOrder);
      }
    }

    // Handle source table
    if (isTransferringAllItems) {
      // Remove source table from active tables (all items transferred)
      draft.activeTables.splice(activeTableIndex, 1);

      // Update source table status to cleaning
      const sourceTableIndex = draft.tables.findIndex(
        (t) => t.id === payload.table.id,
      );
      if (sourceTableIndex !== -1) {
        draft.tables[sourceTableIndex].status = "cleaning";
        draft.tables[sourceTableIndex].order = null;
      }
    } else {
      // Keep source table with remaining items only
      draft.activeTables[activeTableIndex].orders = this.calculateOrderTotal({
        ...payload.originalOrder!,
        items: remainingItems,
      });
    }
  }

  public static handleSetCustomer(
    draft: Draft<RestaurantState>,
    payload: {
      table: table_restaurant_tables;
      count?: number;
    },
  ): void {
    const activeTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.table.id,
    );

    if (activeTableIndex === -1) return;

    const order = draft.activeTables[activeTableIndex].orders;
    if (!order) return;

    order.customer = payload.count;
  }

  public static handleSetOrderPrintTime(
    draft: Draft<RestaurantState>,
    payload: {
      table: table_restaurant_tables;
      count?: number;
    },
  ) {
    const activeTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.table.id,
    );

    if (activeTableIndex === -1) return;

    const order = draft.activeTables[activeTableIndex].orders;
    if (order) {
      order.printCount = (order.printCount || 0) + 1;
    }
  }

  public static handleSetFoodDelivery(
    draft: Draft<RestaurantState>,
    payload: {
      table: table_restaurant_tables;
      deliveryCode: string;
      servedType: string;
      customer?: Customer;
    },
  ) {
    const activeTableIndex = draft.activeTables.findIndex(
      (t) => t.tables?.id === payload.table.id,
    );

    if (activeTableIndex === -1) return;

    const order = draft.activeTables[activeTableIndex].orders;
    if (order) {
      order.deliveryCode = payload.deliveryCode;
      order.servedType = payload.servedType as
        | "dine_in"
        | "take_away"
        | "food_delivery";
      order.customerLoader = payload.customer;
    }
  }
}
