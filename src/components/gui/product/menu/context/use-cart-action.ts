import {
  requestAutoInvoiceNumber,
  useCreateOrder,
  useMutationCreateOrderItem,
  useMutationDeleteOrderItem,
} from "@/app/hooks/use-query-order";
import {
  requestAddOrderModifier,
  useMutationAddOrderModifier,
} from "@/app/hooks/use-query-order-modifier";
import { useMutationForceUpdateQtyByStatus } from "@/app/hooks/use-query-order-update-status-item";
import { OrderModifierType } from "@/dataloader/order-modifier-loader";
import {
  ProductModifierType,
  ProductVariantType,
} from "@/dataloader/product-variant-loader";
import { table_restaurant_tables } from "@/generated/tables";
import { generateId } from "@/lib/generate-id";
import { ResponseType } from "@/lib/types";
import { useCallback } from "react";
import { toast } from "sonner";
import { useCart } from "./cart-provider";
import { requestUpdateTableStatus } from "@/app/hooks/use-query-table";
import { useSWRConfig } from "swr";
import type { PromotionSetCartLine } from "../../../restaurant/hooks/use-restaurant-actions";

export function useCartActions() {
  const { dispatch, state, setIsRequest } = useCart();
  const { mutate } = useSWRConfig();
  const { trigger: triggerCreateOrder } = useCreateOrder();
  const { trigger: triggerForceUpdateQtyByStatus } =
    useMutationForceUpdateQtyByStatus(state.orders?.orderId || "");
  const { trigger: triggerCreateOrderItem } = useMutationCreateOrderItem(
    state.orders?.orderId || ""
  );
  const { trigger: triggerDeleteOrderItem } = useMutationDeleteOrderItem(
    state.orders?.orderId || ""
  );
  const { trigger: triggerForceUpdateOrderItemStatus } =
    useMutationForceUpdateQtyByStatus(state.orders?.orderId || "");
  const { trigger: triggerAddOrderModifier } = useMutationAddOrderModifier(
    state.orders?.orderId || ""
  );

  const selectProduct = useCallback(
    async (
      product: ProductVariantType & {
        quantity: number;
        notes?: OrderModifierType;
        modifiers?: ProductModifierType[];
      },
      table: table_restaurant_tables
    ) => {
      setIsRequest(true);
      const id = generateId();

      if (state.tables?.status === "available") {
        await requestUpdateTableStatus(state.tables.id, "order_taken");
      }

      if (!state.orders?.invoiceNo) {
        const invoice = await requestAutoInvoiceNumber(1);

        if (invoice.success) {
          const create = (await triggerCreateOrder({
            customerId: state.posInfo?.posCustomerId || "",
            invoiceNo: Number(invoice.result?.at(0)),
            slotId: state.posInfo?.posSlotId || "",
            tableNumber: table.id || "",
            warehouseId: state.currentWarehouse?.id || "",
            items: [
              {
                id,
                qty: product.quantity,
                price: String(product.price ?? 0),
                discounts: [],
                discountAmount: "0",
                variantId: product.id,
              },
            ],
          })) as ResponseType<unknown>;

          if (create) {
            for (const modifier of product.modifiers || []) {
              for (const item of modifier.items || []) {
                await requestAddOrderModifier(String(create.result || ""), {
                  modifierItemId: item.id,
                  orderDetailId: id,
                  price: Number(item.price || 0),
                });
              }
            }

            if (!!product.notes) {
              await requestAddOrderModifier(String(create.result || ""), {
                modifierItemId: "notes",
                orderDetailId: id,
                notes: product.notes.notes,
                price: product.notes.price || 0,
              });
            }

            dispatch({
              type: "FIRST_ORDER",
              payload: {
                table,
                invoiceNo: String(Number(invoice.result?.[0])),
                orderId: String(create.result || ""),
                itemId: id,
                product,
              },
            });
          }
        }
      } else {
        // if order already exists, add product to order
        const existingItem = state.orders.items.filter(
          (item) =>
            item.orderModifiers?.length === product.modifiers?.length &&
            item.variantId === product.id &&
            item.notes === product.notes
        );
        // If product already exists in order, update quantity
        if (existingItem !== undefined && existingItem.length > 0) {
          const qtyPending =
            Number(
              existingItem[0].status?.find((f) => f.status === "pending")?.qty
            ) + product.quantity;

          const res = await triggerForceUpdateQtyByStatus({
            orderDetailId: existingItem[0].orderDetailId || "",
            qty: qtyPending,
            status: "pending",
          });
          if (!res.success) {
            return toast.error("Failed to update product quantity");
          }
        } else {
          // If product does not exist in order, add it
          const res = await triggerCreateOrderItem({
            id,
            variantId: product.id,
            qty: product.quantity,
            price: String(product.price ?? 0),
            discounts: [],
            discountAmount: "0",
          });
          if (!res.success) {
            return toast.error("Failed to add product to order");
          }

          for (const modifier of product.modifiers || []) {
            for (const item of modifier.items || []) {
              await triggerAddOrderModifier({
                modifierItemId: item.id,
                orderDetailId: id,
                price: Number(item.price || 0),
              });
            }
          }

          if (!!product.notes) {
            await triggerAddOrderModifier({
              modifierItemId: "notes",
              orderDetailId: id,
              notes: product.notes.notes,
              price: product.notes.price || 0,
            });
          }
        }

        console.log(product);

        dispatch({
          type: "SELECT_PRODUCT",
          payload: {
            product: {
              ...product,
              quantity: product.quantity,
            },
            table,
            id: id,
          },
        });
      }
      setIsRequest(false);
    },
    [
      dispatch,
      state,
      triggerCreateOrder,
      triggerCreateOrderItem,
      triggerForceUpdateQtyByStatus,
      setIsRequest,
      triggerAddOrderModifier,
    ]
  );

  const removeProduct = useCallback(
    async (orderDetailId: string, table: table_restaurant_tables) => {
      try {
        setIsRequest(true);
        const existingItems = state.orders?.items.filter(
          (item) => item.orderDetailId === orderDetailId
        );

        if (existingItems && existingItems.length === 1) {
          const res = await triggerDeleteOrderItem({
            item_id: orderDetailId,
          });

          if (!res.success) {
            return toast.error("Failed to remove product from order");
          }
        }

        dispatch({
          type: "REMOVE_PRODUCT",
          payload: {
            orderDetailId,
            table,
          },
        });
      } catch (error) {
        console.error("Error removing product:", error);
      } finally {
        setIsRequest(false);
      }
    },
    [dispatch, setIsRequest, state, triggerDeleteOrderItem]
  );

  const updateProductQty = useCallback(
    async (
      orderDetailId: string,
      quantity: number,
      table: table_restaurant_tables
    ) => {
      try {
        setIsRequest(true);
        const res = await triggerForceUpdateOrderItemStatus({
          orderDetailId,
          qty: quantity,
          status: "pending",
        });
        if (!res.success) {
          return toast.error("Failed to update product quantity");
        }

        dispatch({
          type: "UPDATE_PRODUCT_QTY",
          payload: {
            orderDetailId,
            quantity,
            table,
          },
        });
      } catch (error) {
        console.error("Error updating product quantity:", error);
      } finally {
        setIsRequest(false);
      }
    },
    [setIsRequest, dispatch, triggerForceUpdateOrderItemStatus]
  );

  /**
   * Add every line of a promotion set as new order lines. The server prices
   * the set, so the cart re-syncs from the table query afterwards instead of
   * guessing the promotion discount locally.
   */
  const addPromotionSet = useCallback(
    async (
      lines: PromotionSetCartLine[],
      table: table_restaurant_tables,
    ): Promise<boolean> => {
      const toAdd = lines.filter((l) => l.quantity > 0);
      if (toAdd.length === 0) return false;

      setIsRequest(true);
      try {
        if (state.tables?.status === "available") {
          await requestUpdateTableStatus(state.tables.id, "order_taken");
        }

        const items = toAdd.map((l) => ({
          id: generateId(),
          variantId: l.product.id,
          qty: l.quantity,
          price: String(l.product.price ?? 0),
          discounts: [],
          discountAmount: "0",
        }));

        if (!state.orders?.invoiceNo) {
          const invoice = await requestAutoInvoiceNumber(1);
          if (!invoice.success) {
            toast.error("Failed to create order");
            return false;
          }
          const create = (await triggerCreateOrder({
            customerId: state.posInfo?.posCustomerId || "",
            invoiceNo: Number(invoice.result?.at(0)),
            slotId: state.posInfo?.posSlotId || "",
            tableNumber: table.id || "",
            warehouseId: state.currentWarehouse?.id || "",
            items,
          })) as ResponseType<unknown>;
          if (!create?.success) {
            toast.error(create?.error || "Failed to create order");
            return false;
          }
        } else {
          for (const item of items) {
            const res = await triggerCreateOrderItem(item);
            if (!res.success) {
              toast.error("Failed to add product to order");
              return false;
            }
          }
        }
        return true;
      } finally {
        // Pull the order back with the promotion prices applied.
        await mutate(`/api/table/${table.id}`);
        setIsRequest(false);
      }
    },
    [
      state,
      setIsRequest,
      triggerCreateOrder,
      triggerCreateOrderItem,
      mutate,
    ],
  );

  return {
    addPromotionSet,
    selectProduct,
    removeProduct,
    updateProductQty,
  };
}
