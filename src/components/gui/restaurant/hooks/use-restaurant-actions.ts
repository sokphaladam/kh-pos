import { UpdateOrderItemStatusSchemaAPIInput } from "@/app/api/pos/order/[id]/update-item-status/update-order-item-status";
import {
  requestAutoInvoiceNumber,
  requestOrderPrintTime,
  useCreateOrder,
  useDeleteOrder,
  useMutationCheckout,
  useMutationCreateOrderItem,
  useMutationDeleteOrderItem,
} from "@/app/hooks/use-query-order";
import {
  useMutationForceUpdateQtyByStatus,
  useMutationUpdateOrderItemStatusAPI,
} from "@/app/hooks/use-query-order-update-status-item";
import {
  requestUpdateTableStatus,
  useMutationDeleteTable,
} from "@/app/hooks/use-query-table";
import { CustomerOrderDiscount } from "@/dataloader/discount-by-order-items-loader";
import { OrderModifierType } from "@/dataloader/order-modifier-loader";
import {
  ProductModifierItemType,
  ProductModifierType,
  ProductVariantType,
} from "@/dataloader/product-variant-loader";
import { table_restaurant_tables } from "@/generated/tables";
import { generateId } from "@/lib/generate-id";
import { ResponseType } from "@/lib/types";
import { useAuthentication } from "contexts/authentication-context";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { PaymentProps } from "../../pos/types/post-types";
import { RestaurantaAction } from "../class/restaurant";
import {
  RestaurantOrder,
  RestaurantOrderItem,
  useRestaurant,
} from "../contexts/restaurant-context";
import { Customer } from "@/classes/customer";

export function useRestaurantActions() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { dispatch, state, setPrintingOrder, setIsRequest, onRefetch } =
    useRestaurant();

  const current = state.activeTables.find(
    (f) => f.tables?.id === params.get("table"),
  );

  const { user } = useAuthentication();
  const { trigger: triggerCreateOrder } = useCreateOrder();
  const { trigger: triggerCreateOrderItem } = useMutationCreateOrderItem(
    current?.orders?.orderId || "",
  );
  const { trigger: triggerDeleteOrderItem } = useMutationDeleteOrderItem(
    current?.orders?.orderId || "",
  );
  const { trigger: triggerCheckout } = useMutationCheckout(
    current?.orders?.orderId || "",
  );
  const { trigger: triggerUpdateOrderItemStatus } =
    useMutationUpdateOrderItemStatusAPI(current?.orders?.orderId || "");
  const { trigger: triggerForceUpdateQtyByStatus } =
    useMutationForceUpdateQtyByStatus(current?.orders?.orderId || "");

  const { trigger: triggerDeleteOrder } = useDeleteOrder(
    current?.orders?.orderId || "",
  );
  const { trigger: triggerDeleteTable } = useMutationDeleteTable();

  const selectTable = useCallback(
    async (table: table_restaurant_tables) => {
      setIsRequest(true);
      const toStatus: "available" | "order_taken" | "cleaning" =
        table.status === "available"
          ? "order_taken"
          : table.status === "cleaning"
            ? "available"
            : table.status || "available";
      if (table.status !== toStatus) {
        const res = await requestUpdateTableStatus(table.id, toStatus);
        if (!res.success) {
          return toast.error("Failed to update table status");
        }
      }
      dispatch({
        type: "SELECT_TABLE",
        payload: {
          table,
          toStatus,
        },
      });
      setIsRequest(false);
    },
    [dispatch, setIsRequest],
  );

  const createTable = useCallback(
    async (table: table_restaurant_tables) => {
      setIsRequest(true);
      dispatch({
        type: "CREATE_TABLE",
        payload: {
          table,
        },
      });
      setIsRequest(false);
    },
    [dispatch, setIsRequest],
  );

  const updateTable = useCallback(
    async (table: table_restaurant_tables) => {
      setIsRequest(true);
      dispatch({
        type: "UPDATE_TABLE",
        payload: {
          table,
        },
      });
      setIsRequest(false);
    },
    [dispatch, setIsRequest],
  );

  const removeTable = useCallback(
    async (table: table_restaurant_tables) => {
      setIsRequest(true);
      const res = await triggerDeleteTable({ id: table.id });
      if (!res.success) {
        toast.error("Failed to delete table");
        setIsRequest(false);
        return;
      }
      dispatch({
        type: "REMOVE_TABLE",
        payload: {
          table,
        },
      });
      setIsRequest(false);
    },
    [dispatch, setIsRequest, triggerDeleteTable],
  );

  const selectProduct = useCallback(
    async (
      product: ProductVariantType & {
        quantity: number;
        notes?: OrderModifierType;
        modifiers?: ProductModifierType[];
      },
      table: table_restaurant_tables,
    ) => {
      console.log(product);
      setIsRequest(true);
      const activeTableIndex = state.activeTables.findIndex(
        (f) => f.tables?.id === table.id,
      );
      const id = generateId();

      // first create order
      if (!state.activeTables[activeTableIndex].orders?.invoiceNo) {
        const invoice = await requestAutoInvoiceNumber(1);
        if (user && invoice.success) {
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

          if (create.error) {
            return toast.error(create.error);
          }

          if (create.success) {
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
        const existingItem = state.activeTables[
          activeTableIndex
        ].orders.items.filter((item) =>
          RestaurantaAction.areProductsIdentical(item, product),
        );
        // If product already exists in order, update quantity
        if (existingItem !== undefined && existingItem.length > 0) {
          const qtyPending =
            Number(
              existingItem[0].status?.find((f) => f.status === "pending")
                ?.qty || 0,
            ) + 1;

          const res = await triggerForceUpdateQtyByStatus({
            orderDetailId: existingItem[0].orderDetailId || "",
            qty: qtyPending,
            status: "pending",
          });
          if (res.success) {
            dispatch({
              type: "SELECT_PRODUCT",
              payload: {
                product: {
                  ...product,
                  quantity: qtyPending,
                },
                table,
                id: existingItem[0].orderDetailId,
              },
            });
          } else {
            toast.error("Failed to update product quantity");
          }
        } else {
          // If product does not exist in order, add it
          const customerType =
            state.activeTables[activeTableIndex].orders.customerLoader?.type ||
            "general";
          const customerExtraPrice = Number(
            state.activeTables[activeTableIndex].orders.customerLoader
              ?.extraPrice || 0,
          );
          const excludeFeeDelivery =
            product.basicProduct?.category?.excludeFeeDelivery;
          const markExtraFee =
            product.basicProduct?.category?.markExtraFee || 0;

          let price = product.price ?? 0;

          if (!excludeFeeDelivery && customerType !== "general") {
            if (markExtraFee > 0) {
              price += markExtraFee;
            } else {
              price += customerExtraPrice;
            }
          }

          const res = await triggerCreateOrderItem({
            id,
            variantId: product.id,
            qty: product.quantity,
            price: String(price),
            discounts: [],
            discountAmount: "0",
          });
          if (res.success) {
            const productAfterExtraPrice = {
              ...product,
              price: price,
            };
            dispatch({
              type: "SELECT_PRODUCT",
              payload: {
                product: productAfterExtraPrice,
                table,
                id,
              },
            });
          } else {
            toast.error("Failed to add product to order");
          }
        }
      }
      setIsRequest(false);
    },
    [
      dispatch,
      state,
      user,
      triggerCreateOrder,
      triggerCreateOrderItem,
      triggerForceUpdateQtyByStatus,
      setIsRequest,
    ],
  );

  const updateProductQty = useCallback(
    async (
      orderDetailId: string,
      quantity: number,
      table: table_restaurant_tables,
      status: "pending" | "cooking" | "served",
      quantityStatus: number,
      statusMode: "convert" | "force",
    ) => {
      try {
        setIsRequest(true);
        dispatch({
          type: "UPDATE_PRODUCT_QTY",
          payload: {
            orderDetailId,
            quantity,
            table,
            status,
            quantityStatus,
            statusMode,
          },
        });
      } catch (error) {
        console.error("Error updating product quantity:", error);
      } finally {
        setIsRequest(false);
      }
    },
    [dispatch, setIsRequest],
  );

  const removeProduct = useCallback(
    async (
      orderDetailId: string,
      table: table_restaurant_tables,
      status: string,
    ) => {
      try {
        const activeTableIndex = state.activeTables.findIndex((f) => {
          return f.tables?.id === table.id;
        });

        const existingItems = state.activeTables[
          activeTableIndex
        ].orders?.items.filter((item) => item.orderDetailId === orderDetailId);

        if (existingItems && existingItems.length === 1) {
          await triggerDeleteOrderItem({
            item_id: orderDetailId,
          });
        }

        dispatch({
          type: "REMOVE_PRODUCT",
          payload: {
            orderDetailId,
            table,
            status,
          },
        });
      } catch (error) {
        console.error("Error removing product:", error);
      } finally {
        setIsRequest(false);
      }
    },
    [dispatch, setIsRequest, state, triggerDeleteOrderItem],
  );

  const sendAllToKitchent = useCallback(
    async (table: table_restaurant_tables) => {
      setIsRequest(true);
      const currentOrder = state.activeTables.find(
        (f) => f.tables?.id === table.id,
      )?.orders;

      if (currentOrder) {
        const dataToUpdate: UpdateOrderItemStatusSchemaAPIInput = [];
        for (const item of currentOrder.items) {
          const havePending = item.status
            ?.filter((f) => f.qty > 0 && f.status === "pending")
            .reduce((a, b) => a + b.qty, 0);
          if (havePending) {
            dataToUpdate.push({
              fromStatus: "pending",
              toStatus: "cooking",
              orderDetailId: item.orderDetailId || "",
              qty: havePending,
            });
          }
        }
        const res = await triggerUpdateOrderItemStatus(dataToUpdate);
        if (res.success) {
          for (const item of currentOrder.items) {
            const havePending = item.status
              ?.filter((f) => f.qty > 0 && f.status === "pending")
              .reduce((a, b) => a + b.qty, 0);
            if (havePending) {
              dispatch({
                type: "UPDATE_PRODUCT_QTY",
                payload: {
                  orderDetailId: item.orderDetailId || "",
                  quantity: item.status?.reduce((a, b) => a + b.qty, 0) || 0,
                  table: table,
                  status: "cooking",
                  quantityStatus: havePending,
                  statusMode: "convert",
                },
              });
            }
          }
        } else {
          toast.error("Failed to send items to kitchen");
        }
      }

      setIsRequest(false);
    },
    [dispatch, setIsRequest, triggerUpdateOrderItemStatus, state],
  );

  const serverAllItems = useCallback(
    async (table: table_restaurant_tables) => {
      setIsRequest(true);
      const currentOrder = state.activeTables.find(
        (f) => f.tables?.id === table.id,
      )?.orders;
      if (currentOrder) {
        const dataToUpdate: UpdateOrderItemStatusSchemaAPIInput = [];
        for (const item of currentOrder.items) {
          const haveCooking = item.status
            ?.filter((f) => f.qty > 0 && f.status === "cooking")
            .reduce((a, b) => a + b.qty, 0);
          if (haveCooking) {
            dataToUpdate.push({
              fromStatus: "cooking",
              toStatus: "served",
              orderDetailId: item.orderDetailId || "",
              qty: haveCooking,
            });
          }
        }
        const res = await triggerUpdateOrderItemStatus(dataToUpdate);
        if (res.success) {
          for (const item of currentOrder.items) {
            const haveCooking = item.status
              ?.filter((f) => f.qty > 0 && f.status === "cooking")
              .reduce((a, b) => a + b.qty, 0);
            if (haveCooking) {
              dispatch({
                type: "UPDATE_PRODUCT_QTY",
                payload: {
                  orderDetailId: item.orderDetailId || "",
                  quantity: item.status?.reduce((a, b) => a + b.qty, 0) || 0,
                  table: table,
                  status: "served",
                  quantityStatus: haveCooking,
                  statusMode: "convert",
                },
              });
            }
          }
        } else {
          toast.error("Failed to serve items");
        }
      }
      setIsRequest(false);
    },
    [dispatch, setIsRequest, state, triggerUpdateOrderItemStatus],
  );

  const completedProduct = useCallback(
    async (
      table: table_restaurant_tables,
      orderDetailId: string,
      qtyToServed: number,
    ) => {
      setIsRequest(true);

      dispatch({
        type: "COMPLETED_PRODUCT",
        payload: {
          table,
          orderDetailId,
          qtyToServed,
        },
      });
      setIsRequest(false);
    },
    [dispatch, setIsRequest],
  );

  const setDiscount = useCallback(
    (
      table: table_restaurant_tables,
      orderDetailId: string,
      discount: CustomerOrderDiscount[],
    ) => {
      dispatch({
        type: "SET_DISCOUNT",
        payload: {
          table,
          orderDetailId,
          discount,
        },
      });
    },
    [dispatch],
  );

  const checkout = useCallback(
    async (table: table_restaurant_tables, payments: PaymentProps[]) => {
      const activeTableIndex = state.activeTables.findIndex(
        (f) => f.tables?.id === table.id,
      );
      const id = state.activeTables[activeTableIndex].orders?.orderId || "";
      const data = {
        slotId: state.posInfo?.posSlotId || "",
        payments: payments.map((x) => {
          return {
            amount: Number(x.amount),
            paymentMethod: x.paymentMethod,
            currency: x.currency,
            amountUsd: Number(x.amountUsd),
            exchangeRate: Number(x.exchangeRate),
            used: Number(x.used),
          };
        }),
      };

      const checkout = await triggerCheckout(data);
      if (checkout.success) {
        dispatch({
          type: "CHECKOUT",
          payload: {
            table,
            payments,
          },
        });
        setTimeout(() => {
          setPrintingOrder(id);
        }, 500);
      } else {
        toast.error("Failed to checkout order");
      }
    },
    [dispatch, setPrintingOrder, state, triggerCheckout],
  );

  const addModifier = useCallback(
    (
      table: table_restaurant_tables,
      orderDetailId: string,
      modifierItem: ProductModifierItemType,
    ) => {
      setIsRequest(true);
      dispatch({
        type: "ADD_MODIFIER",
        payload: {
          table,
          orderDetailId,
          modifierItem,
        },
      });
      setIsRequest(false);
    },
    [dispatch, setIsRequest],
  );

  const removeModifier = useCallback(
    (
      table: table_restaurant_tables,
      orderDetailId: string,
      modifierItemId: string,
    ) => {
      setIsRequest(true);
      dispatch({
        type: "REMOVE_MODIFIER",
        payload: {
          table,
          orderDetailId,
          modifierItemId,
        },
      });
      setIsRequest(false);
    },
    [dispatch, setIsRequest],
  );

  const updateNotes = useCallback(
    (
      table: table_restaurant_tables,
      orderDetailId: string,
      notes: OrderModifierType,
    ) => {
      setIsRequest(true);
      dispatch({
        type: "SET_NOTES",
        payload: {
          table,
          orderDetailId,
          notes,
        },
      });
      setIsRequest(false);
    },
    [dispatch, setIsRequest],
  );

  const onRemoveOrder = useCallback(
    async (table: table_restaurant_tables) => {
      setIsRequest(true);
      const deleteOrderRes = await triggerDeleteOrder({});
      if (!deleteOrderRes.success) {
        setIsRequest(false);
        return;
      }
      const res = await requestUpdateTableStatus(table.id, "available");
      if (res.success) {
        dispatch({
          type: "REMOVE_ORDER",
          payload: { table },
        });
        const param = new URLSearchParams(params.toString());
        param.delete("table");
        router.push(`${pathname}?${param.toString()}`);
        onRefetch?.();
      }
      setIsRequest(false);
    },
    [
      dispatch,
      params,
      pathname,
      router,
      setIsRequest,
      triggerDeleteOrder,
      onRefetch,
    ],
  );

  const resetTableToAvailable = useCallback(
    async (table: table_restaurant_tables) => {
      setIsRequest(true);
      const res = await requestUpdateTableStatus(table.id, "available");
      if (res.success) {
        dispatch({
          type: "RESET_TABLE_TO_AVAILABLE",
          payload: { table },
        });
      } else {
        toast.error("Failed to reset table status");
      }
      setIsRequest(false);
    },
    [dispatch, setIsRequest],
  );

  const transferTable = useCallback(
    (
      sourceTable: table_restaurant_tables,
      destinationTable: table_restaurant_tables,
      orderId: string,
      orderItems: RestaurantOrderItem[],
      originalOrder: RestaurantOrder,
    ) => {
      setIsRequest(true);

      dispatch({
        type: "TRANSFER_TABLE",
        payload: {
          table: sourceTable,
          destinationTable,
          orderId,
          orderItems,
          originalOrder,
        },
      });
      setIsRequest(false);
    },
    [dispatch, setIsRequest],
  );

  const setCustomerCount = useCallback(
    (table: table_restaurant_tables, count: number) => {
      setIsRequest(true);
      dispatch({
        type: "SET_CUSTOMER",
        payload: {
          table,
          count,
        },
      });
      setIsRequest(false);
    },
    [dispatch, setIsRequest],
  );

  const setOrderPrintTime = useCallback(
    async (table?: table_restaurant_tables) => {
      setIsRequest(true);
      return await requestOrderPrintTime(current?.orders?.orderId || "")
        .catch(() => {
          toast.error("Failed to update order print time");
        })
        .finally(() => {
          if (table) {
            dispatch({
              type: "SET_ORDER_PRINT_TIME",
              payload: {
                table,
              },
            });
          }
          setIsRequest(false);
        });
    },
    [setIsRequest, current, dispatch],
  );

  const setFoodDelivery = useCallback(
    async (
      table: table_restaurant_tables,
      deliveryCode: string,
      servedType: string,
      customer?: Customer,
    ) => {
      setIsRequest(true);
      dispatch({
        type: "SET_FOOD_DELIVERY",
        payload: {
          table,
          deliveryCode,
          servedType,
          customer,
        },
      });
      setIsRequest(false);
    },
    [setIsRequest, dispatch],
  );

  return {
    selectTable,
    selectProduct,
    updateProductQty,
    removeProduct,
    sendAllToKitchent,
    serverAllItems,
    completedProduct,
    setDiscount,
    checkout,
    addModifier,
    removeModifier,
    updateNotes,
    onRemoveOrder,
    createTable,
    updateTable,
    removeTable,
    resetTableToAvailable,
    transferTable,
    setCustomerCount,
    setOrderPrintTime,
    setFoodDelivery,
  };
}
