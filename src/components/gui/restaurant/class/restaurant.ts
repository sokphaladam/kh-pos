import { CustomerOrderDiscount } from "@/dataloader/discount-by-order-items-loader";
import { OrderModifierType } from "@/dataloader/order-modifier-loader";
import {
  ProductModifierItemType,
  ProductModifierType,
  ProductVariantType,
} from "@/dataloader/product-variant-loader";
import { table_restaurant_tables } from "@/generated/tables";
import { applyStackDiscount } from "@/lib/apply-stack-discount";
import {
  VARIANT_DISCOUNT_MAX_QTY,
  computeVariantDiscount,
} from "@/lib/variant-discount";
import {
  OrderDiscountRules,
  resolveVariantUnitCapByLine,
} from "@/lib/order-discount-rules";
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

  /** Units on a restaurant order line (sum of the per-status quantities). */
  private static itemQty(item: RestaurantOrderItem): number {
    return item.status?.reduce((a, b) => a + b.qty, 0) || 0;
  }

  /** Whether a line actually carries a product-variant menu discount. */
  private static itemHasVariantDiscount(item: RestaurantOrderItem): boolean {
    return (item.discounts ?? []).some(
      (d) => d.discountId === "variant" && Number(d.value || 0) > 0,
    );
  }

  public static calculateItemTotals(
    item: RestaurantOrderItem,
    rules?: OrderDiscountRules,
    /**
     * Pre-resolved unit cap for this line, from `resolveVariantUnitCapByLine`
     * (needed for `countBy: "PRODUCT" | "CATEGORY"`). `undefined` with `rules`
     * set = no cap; `0` = discount nothing; `> 0` = that many units. Ignored
     * when `rules` is not loaded (falls back to the built-in default).
     */
    variantUnitCap?: number,
  ): RestaurantOrderItem {
    // Cap passed to computeVariantDiscount (0 there means "no cap").
    const maxQtyPerLine = !rules
      ? VARIANT_DISCOUNT_MAX_QTY
      : variantUnitCap === undefined
        ? 0
        : variantUnitCap;
    // Explicit 0 (only possible with rules loaded) = budget used up.
    const skipVariantDiscount = !!rules && variantUnitCap === 0;
    const notesCharge = Number(item.notes?.price || 0);
    const totalModifier =
      RestaurantaAction.calculateModifierTotal(item.orderModifiers) +
      notesCharge;
    const priceAfterModifier = Number(item.price || 0) + totalModifier;
    const qty = RestaurantaAction.itemQty(item);
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

    // The product-variant menu discount ("variant") is per-unit and only
    // covers the first `maxQtyPerLine` units — mirror the server here instead
    // of letting applyStackDiscount subtract it once per line. The auto
    // order-level slice ("order") is already resolved per line by the server;
    // trust its stored amount. Everything else stacks per line.
    let running = subtotal;
    const resolvedAmounts = new Map<string, number>();

    for (const d of discountsArray) {
      if (d.discountId === "variant") {
        const vd = skipVariantDiscount
          ? null
          : computeVariantDiscount(
              priceAfterModifier,
              d.discountType,
              Number(d.value || 0),
              qty,
              maxQtyPerLine,
            );
        const amt = Math.min(vd?.lineDiscountAmount ?? 0, running);
        resolvedAmounts.set(d.id, amt);
        running -= amt;
      } else if (d.discountId === "order") {
        const amt = Math.min(Number(d.amount || 0), running);
        resolvedAmounts.set(d.id, amt);
        running -= amt;
      }
    }

    const stackables = discountsArray.filter(
      (d) => d.discountId !== "variant" && d.discountId !== "order",
    );
    const { stackDiscount, finalPrice } = applyStackDiscount(running, stackables);
    for (const s of stackDiscount) {
      resolvedAmounts.set(s.id, s.discountAmount);
    }

    return {
      ...item,
      modiferAmount: String(totalModifier),
      discountAmount: String(subtotal - finalPrice),
      discounts: discountsArray.map((d) => ({
        ...d,
        amount: resolvedAmounts.get(d.id) ?? Number(d.amount),
      })),
      totalAmount: String(finalPrice),
      price: String(item.price),
    };
  }

  public static calculateOrderTotal(
    order: RestaurantOrder,
    rules?: OrderDiscountRules,
  ): RestaurantOrder {
    // Resolve the variant-discount unit cap for every line up front so the
    // `countBy: "PRODUCT" | "CATEGORY"` budget can be shared across lines.
    const unitCapByLine = rules
      ? resolveVariantUnitCapByLine(
          rules,
          order.items.map((it) => {
            const category = it.productVariant?.basicProduct?.category;
            return {
              orderDetailId: it.orderDetailId,
              qty: RestaurantaAction.itemQty(it),
              hasVariantDiscount:
                RestaurantaAction.itemHasVariantDiscount(it),
              productId: it.productVariant?.productId,
              categoryId: category?.categoryId ?? category?.id,
            };
          }),
        )
      : undefined;

    const items = order.items.map((it) =>
      RestaurantaAction.calculateItemTotals(
        it,
        rules,
        unitCapByLine?.get(it.orderDetailId),
      ),
    );

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

  /** The (primary) category id of a variant, matching calculateOrderTotal. */
  private static variantCategoryId(v?: ProductVariantType): string | null {
    const c = v?.basicProduct?.category;
    return c?.categoryId ?? c?.id ?? null;
  }

  /**
   * Decide where a freshly tapped `product` unit goes on the order: the
   * `orderDetailId` of an existing line to increment, or `null` to start a new
   * line.
   *
   * Same-variant units (no modifiers / notes) normally stack onto one line.
   * But once the product-variant menu-discount cap for that unit's budget is
   * used up — per line for `countBy: "VARIANT"`, shared across the product or
   * category otherwise — the extra unit is split onto its own line so it shows
   * at full price while the units already on the order keep their discount.
   * Repeated overflow taps stack onto that full-price line instead of spawning
   * a new line each time.
   */
  public static resolveAddTarget(
    order: RestaurantOrder,
    product: ProductVariantType & {
      quantity: number;
      notes?: OrderModifierType;
      modifiers?: ProductModifierType[];
    },
    rules?: OrderDiscountRules,
  ): string | null {
    const identical = order.items.filter((it) =>
      RestaurantaAction.areProductsIdentical(it, product),
    );
    if (identical.length === 0) return null;

    const legacyTarget = identical[0].orderDetailId;

    if (!rules?.maxQtyPerLine?.enabled || !(rules.maxQtyPerLine.value > 0)) {
      return legacyTarget;
    }

    // The cap only bites for a variant that actually carries a menu discount.
    const productHasVariantDiscount = !!computeVariantDiscount(
      Number(product.price ?? 0),
      product.discountType,
      Number(product.discountValue ?? 0),
      1,
      0,
    );
    if (!productHasVariantDiscount) return legacyTarget;

    // Simulate adding the unit as its own new line and let the shared resolver
    // say whether that unit would land inside the discount budget.
    const capByLine = resolveVariantUnitCapByLine(rules, [
      ...order.items.map((it) => ({
        orderDetailId: it.orderDetailId,
        qty: RestaurantaAction.itemQty(it),
        hasVariantDiscount: RestaurantaAction.itemHasVariantDiscount(it),
        productId: it.productVariant?.productId,
        categoryId: RestaurantaAction.variantCategoryId(it.productVariant),
      })),
      {
        orderDetailId: "__incoming__",
        qty: 1,
        hasVariantDiscount: true,
        productId: product.productId,
        categoryId: RestaurantaAction.variantCategoryId(product),
      },
    ]);
    const incomingCap = capByLine.get("__incoming__");

    // Budget still available -> stack normally, the unit gets discounted.
    if (incomingCap === undefined || incomingCap > 0) return legacyTarget;

    // Budget used up -> keep the unit off the discounted line. Reuse an existing
    // full-price line for this variant (one that carries the variant discount
    // but has it resolved to 0 by the cap); otherwise start a new line. Never
    // fall back to a line whose discount state is still unknown — a new line is
    // always safe, a wrong merge produces the mixed line we are avoiding.
    const fullPriceLine = [...identical].reverse().find((it) => {
      const vd = (it.discounts ?? []).find((d) => d.discountId === "variant");
      return !!vd && Number(vd.amount ?? 0) === 0;
    });
    return fullPriceLine ? fullPriceLine.orderDetailId : null;
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
      forceNewLine?: boolean;
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

    // The caller (selectProduct) has already decided merge-vs-new-line via
    // RestaurantaAction.resolveAddTarget: `forceNewLine` means start a line even
    // if an identical one exists; otherwise `payload.id` names the exact line to
    // increment. Fall back to the identical-line search only when neither is set.
    const existingItemIndex = payload.forceNewLine
      ? -1
      : payload.id
        ? order.items?.findIndex((item) => item.orderDetailId === payload.id)
        : order.items?.findIndex((item) =>
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
      RestaurantaAction.calculateOrderTotal(order, draft.orderDiscountRules);
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
        RestaurantaAction.calculateOrderTotal(order, draft.orderDiscountRules);
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
        RestaurantaAction.calculateOrderTotal(order, draft.orderDiscountRules);
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
      RestaurantaAction.calculateOrderTotal(order, draft.orderDiscountRules);
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
      RestaurantaAction.calculateOrderTotal(order, draft.orderDiscountRules);
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
      RestaurantaAction.calculateOrderTotal(order, draft.orderDiscountRules);
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
      RestaurantaAction.calculateOrderTotal(order, draft.orderDiscountRules);
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
      RestaurantaAction.calculateOrderTotal(order, draft.orderDiscountRules);
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
        orders: this.calculateOrderTotal(
          {
            ...payload.originalOrder!,
            items: payload.orderItems,
          },
          draft.orderDiscountRules,
        ),
      });

      // Update destination table status
      const destinationTableIndex = draft.tables.findIndex(
        (t) => t.id === payload.destinationTable.id,
      );
      if (destinationTableIndex !== -1) {
        draft.tables[destinationTableIndex].status = "order_taken";
        draft.tables[destinationTableIndex].order = this.calculateOrderTotal(
          {
            ...payload.originalOrder!,
            items: payload.orderItems,
          },
          draft.orderDiscountRules,
        );
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
          this.calculateOrderTotal(
            destinationOrder,
            draft.orderDiscountRules,
          );
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
      draft.activeTables[activeTableIndex].orders = this.calculateOrderTotal(
        {
          ...payload.originalOrder!,
          items: remainingItems,
        },
        draft.orderDiscountRules,
      );
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
