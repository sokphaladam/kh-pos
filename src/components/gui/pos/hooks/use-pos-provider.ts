/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuthentication } from "contexts/authentication-context";
import {
  CartProps,
  DiscountProps,
  OrderProps,
  PaymentProps,
} from "../types/post-types";
import { useCallback, useState } from "react";
import {
  useCreateOrder,
  useMutationCheckout,
  useMutationCreateOrderItem,
  useMutationDeleteOrderItem,
  useMutationUpdateDiscountItem,
  useMutationUpdateOrderItemQty,
  useQueryPOSInfo,
} from "@/app/hooks/use-query-order";
import { produce } from "immer";
import { toast } from "sonner";
import { requestSearchProduct } from "@/app/hooks/use-query-product";
import { ResponseType } from "@/lib/types";
import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { applyStackDiscount } from "@/lib/apply-stack-discount";
import { MultiplePayment, PaymentMethod } from "@/classes/multiple-payment";
import { requestReplenishmentPickingList } from "@/app/hooks/use-query-replenishment";
import { generateId } from "@/lib/generate-id";
import { usePOSTabContext } from "../context/pos-tab-context";
import { useCreatePromotion } from "@/app/hooks/use-query-promotion";
import { useMutationUpdateCustomerIdInCustomerOrder } from "@/app/hooks/use-query-customer";
import { ReservationItem } from "@/classes/order";

export function usePOSProvider(id?: string) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setChangeOrder] = useState(false);
  const [edit] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<string | null>(null);
  const [printingPicking, setPrintingPicking] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const {
    tabs,
    setTabs,
    onCleanup,
    onCloseTab,
    onAutoInvoice,
    onFetch,
    recall,
    loading: loadingTab,
  } = usePOSTabContext();
  const [isPrint, setIsPrint] = useState(
    localStorage.getItem("pos_is_print")
      ? localStorage.getItem("pos_is_print") === "true"
      : true,
  );
  const [isPrintTicket, setIsPrintTicket] = useState(
    localStorage.getItem("pos_is_print_ticket")
      ? localStorage.getItem("pos_is_print_ticket") === "true"
      : false,
  );
  const [isDigitalTicket, setIsDigitalTicket] = useState(
    localStorage.getItem("pos_is_digital_ticket")
      ? localStorage.getItem("pos_is_digital_ticket") === "true"
      : false,
  );
  const [isDirty, setIsDirty] = useState(false);
  const { currentWarehouse, currentShift, setting } = useAuthentication();
  const { trigger: triggerCreateOrder, isMutating: isMutatingCreateOrder } =
    useCreateOrder();
  // const { trigger: triggerUpdateOrder, isMutating: isMutatingUpdateOrder } =
  //   useUpdateOrder(id || "");
  const { trigger: triggerCheckout, isMutating: isMutatingCheckout } =
    useMutationCheckout(id || "");

  const {
    trigger: triggerUpdateOrderItemQty,
    isMutating: isUpdatingOrderItemQty,
  } = useMutationUpdateOrderItemQty(id || "");
  const { trigger: triggerDeleteOrderItem, isMutating: isDeletingOrderItem } =
    useMutationDeleteOrderItem(id || "");
  const { trigger: triggerCreateOrderItem, isMutating: isCreatingOrderItem } =
    useMutationCreateOrderItem(id || "");
  const { trigger: triggerDiscountItem, isMutating: isDiscountingItem } =
    useMutationUpdateDiscountItem(id || "");

  const { trigger: triggerUpdateCustomerId, isMutating: isUpdatingCustomerId } =
    useMutationUpdateCustomerIdInCustomerOrder(id || "");

  const { data, isLoading } = useQueryPOSInfo(currentWarehouse?.id || "");

  const {
    trigger: triggerCreatePromotion,
    isMutating: isMutatingCreatePromotion,
  } = useCreatePromotion(id || "");

  const activeIndexTab = tabs.findIndex((f) => !!f.active);
  const exchangeRate = Number(
    !setting?.isLoading && setting?.data?.result
      ? setting.data?.result?.find((f) => f.option === "EXCHANGE_RATE")?.value
      : "4100",
  );

  const onPickingList = useCallback(async () => {
    const pickingList = (
      (await requestReplenishmentPickingList(
        "new",
        tabs[activeIndexTab].value?.carts.map((x) => {
          return {
            toFindQty: x.qty,
            variantId: x.variantId,
          };
        }),
        0,
      )) as any
    ).result;
    return pickingList;
  }, [activeIndexTab, tabs]);

  const onUpdateOrderItemQty = useCallback(
    async (
      itemId: string,
      qty: number,
      reservationData?: ReservationItem[],
    ) => {
      triggerUpdateOrderItemQty({
        qty: String(qty || "0"),
        item_id: itemId,
        reservation: reservationData || [],
      })
        .then(async (res) => {
          if (res.error === "Order already checkout") {
            onCloseTab?.(id || "", true);
            toast.error(res.error);
            setFetching(false);
          } else if (res.success === true) {
            setIsDirty(true);
            setTabs(
              produce(tabs, (draft) => {
                draft[activeIndexTab].value?.carts.forEach((cart) => {
                  if (cart.id === itemId) {
                    const total = (cart.price || 0) * (qty || 0);
                    let tempTotal = total;
                    const discount = Number(
                      cart.discounts.reduce((a, b) => {
                        if (b.discountType === "PERCENTAGE") {
                          const discountAmount =
                            tempTotal * (Number(b.value) / 100);
                          tempTotal = tempTotal - discountAmount;
                          return discountAmount + a;
                        }
                        return a + Number(b.value || 0);
                      }, 0) || 0,
                    );
                    cart.qty = qty;
                    cart.totalAfterDiscount = total - discount;
                    cart.khr = total * exchangeRate;
                    cart.usd = total;
                    cart.discountValue = discount;
                  }
                });
              }),
            );
            setIsDirty(false);
            setFetching(false);
            if (reservationData && reservationData.length > 0) {
              recall?.();
            }
          }
        })
        .catch(() => {
          toast.error(
            qty < 0 ? "Cannot decrease item" : "Cannot increase item",
          );
          setFetching(false);
        });
    },
    [
      triggerUpdateOrderItemQty,
      setTabs,
      tabs,
      onCloseTab,
      id,
      activeIndexTab,
      exchangeRate,
      recall,
    ],
  );

  const onCreateOrderItem = useCallback(
    (
      data: CartProps,
      discountAutoId?: string,
      reservationData?: ReservationItem[],
    ) => {
      const input = {
        variantId: data.variantId,
        qty: Number(data.qty),
        price: String(data.price),
        discountAmount: String(data.discountValue),
        discount: [],
        id: data.id,
        reservation: reservationData
          ? reservationData.map((r) => {
              return {
                showtimeId: r.showtimeId,
                seatId: r.seatId,
                price: Number(r.price),
              };
            })
          : [],
      };
      triggerCreateOrderItem(input)
        .then((res) => {
          if (res.error === "Order already checkout") {
            onCloseTab?.(id || "", true);
            toast.error(res.error);
            return;
          }
          if (res.result) {
            // --- code
            if (discountAutoId) {
              triggerCreatePromotion({
                itemId: data.id || "",
                discountAutoId: discountAutoId,
              }).then(() => {
                recall?.();
              });
            }

            if (reservationData && reservationData.length > 0) {
              recall?.();
            }
          } else {
            toast.error("Cannot added new item");
          }
        })
        .catch(() => {
          toast.error("Cannot create new item");
        });
    },
    [triggerCreateOrderItem, onCloseTab, id, triggerCreatePromotion, recall],
  );

  const mulitplePayment = useCallback(
    (payments: PaymentProps[]) => {
      const mPayment = new MultiplePayment(
        Number(
          tabs[activeIndexTab].value?.carts.reduce(
            (a: number, b) =>
              (a = a + Math.round(Number(b.totalAfterDiscount) * 100) / 100),
            0,
          ),
        ),
      );

      try {
        for (const x of payments) {
          mPayment.addPayment(
            new PaymentMethod(
              x.paymentMethod,
              Number(x.amount),
              x.currency,
              x.currency === "KHR" ? exchangeRate : 1,
            ),
          );
        }

        return mPayment.summary();
      } catch (e) {
        toast.error("Invalid payment:" + e);
      }
    },
    [activeIndexTab, exchangeRate, tabs],
  );

  // Checkout
  const onCheckout = useCallback(
    async (
      payments?: PaymentProps[],
      option?: {
        isPrint: boolean;
        printTicket: boolean;
        printDigitalTicket: boolean;
      },
    ) => {
      if (!currentShift) {
        toast.warning("You must open a shift before proceeding with an order.");
        return;
      }

      if (data?.success && (payments?.length || 0) > 0) {
        const pay = mulitplePayment(payments || []);

        if (!pay?.isFullyPaid) {
          return toast.error("Order not fully paid.");
        }

        const index = tabs.findIndex((f) => !!f.active);
        const invoice = ((await onAutoInvoice?.()) as any).result;

        if (!invoice) {
          toast.error("Cannot generate invoice number.");
          return;
        }

        const inputOrder = {
          warehouseId: currentWarehouse?.id,
          slotId: data?.result?.posSlotId,
          customerId: data?.result?.posCustomerId,
          invoiceNo: tabs[index].isDraft ? tabs[index].title : invoice[index],
          items: tabs[activeIndexTab].value?.carts.map((x) => {
            return {
              variantId: x.variantId,
              qty: x.qty,
              price: String(x.price),
              discountAmount: String(x.discountValue),
              discount: x.discounts.filter((f) => !!f.id),
            };
          }),
          payments: pay.payments.map((x) => {
            return {
              amount: Number(x.received),
              paymentMethod: x.methodType,
              currency: x.currency,
              amountUsd: Number(x.converted),
              exchangeRate: Number(x.rate),
              used: Number(x.used),
            };
          }),
        };

        if (!!tabs[index].isDraft) {
          const updateOrder = (await triggerCheckout({
            payments: inputOrder.payments,
            slotId: inputOrder.slotId || "",
          })) as ResponseType<unknown>;
          if (updateOrder.success) {
            toast.success("Checkout success");
            if (!!option?.isPrint) {
              setPrintingOrder(id as string);
            } else {
              setPrintingOrder(null);
              onCloseTab(tabs[index].id || "", true);
            }
          } else {
            if (updateOrder.error === "Order already checkout") {
              // setPrintingOrder(id as string);
              toast.error(updateOrder.error);
            } else {
              toast.error("Fail checkout");
            }
          }
        }
      }
    },
    [
      currentWarehouse,
      data,
      mulitplePayment,
      onAutoInvoice,
      tabs,
      currentShift,
      id,
      activeIndexTab,
      triggerCheckout,
      setPrintingOrder,
      onCloseTab,
    ],
  );

  // Save draft
  const onSaveDraft = useCallback(
    async (
      items?: OrderProps,
      discountAutoId?: string,
      reservation?: ReservationItem[],
    ) => {
      // search index are not save in draft
      const index = tabs.filter((f) => !f.isDraft).findIndex((f) => !!f.active);
      const invoice = ((await onAutoInvoice?.()) as any).result;

      if (!invoice) {
        toast.error("Cannot generate invoice number.");
        return;
      }

      const orders = items ? items : tabs[activeIndexTab].value;

      const inputOrder = {
        warehouseId: currentWarehouse?.id,
        slotId: data?.result?.posSlotId,
        customerId: data?.result?.posCustomerId,
        invoiceNo: invoice[index],
        items: orders?.carts.map((x) => {
          return {
            id: x.id,
            variantId: x.variantId,
            qty: x.qty,
            price: String(x.price),
            reservation,
          };
        }),
      };

      // search actual index in all tabs
      const idx = tabs.findIndex((f) => !!f.active);

      if (!!tabs[idx].isDraft) {
        // Code here
      } else {
        const createOrder = (await triggerCreateOrder(
          inputOrder,
        )) as ResponseType<unknown>;
        if (createOrder.success) {
          setTimeout(() => {
            if (!!discountAutoId) {
              triggerCreatePromotion({
                discountAutoId,
                itemId: orders?.carts[0].id || "",
              });
            }
            setTabs(
              produce(tabs, (draft) => {
                draft[activeIndexTab].id =
                  typeof createOrder.result === "string"
                    ? createOrder.result
                    : "";
                draft[activeIndexTab].isDraft = true;
                draft[activeIndexTab].active = true;
                draft[activeIndexTab].title = inputOrder.invoiceNo;
                if (draft[activeIndexTab].value) {
                  draft[activeIndexTab].value.invoiceNo = inputOrder.invoiceNo;
                  draft[activeIndexTab].value.carts = orders?.carts || [];
                }
              }),
            );
            recall?.();
          }, 300);
        } else {
          toast.error("Fail create order");
        }
      }
    },
    [
      currentWarehouse,
      triggerCreateOrder,
      data,
      onAutoInvoice,
      tabs,
      activeIndexTab,
      setTabs,
      recall,
      triggerCreatePromotion,
    ],
  );

  // Scan barcode product
  const onScanBarcode = useCallback(
    (
      barcode: string,
      by: "BARCODE" | "SKU" | "TITLE" = "BARCODE",
      callback: (success: boolean) => void,
    ) => {
      setFetching(true);
      const split = barcode.split("::");
      requestSearchProduct(split[0].trim(), by)
        .then((res) => {
          const response = res as ResponseType<ProductSearchResult[]>;
          if (response.success && (response.result?.length || 0) > 0) {
            let inputDummy: any = null;
            setTabs(
              produce(tabs, (draft) => {
                if (response.result && response.result.length > 0) {
                  const findIndex =
                    draft[activeIndexTab].value?.carts.findIndex(
                      (f) =>
                        f.variantId === (response.result || [])[0].variantId,
                    ) ?? -1;

                  if (findIndex >= 0) {
                    if (draft[activeIndexTab].value) {
                      const qty =
                        (draft[activeIndexTab].value?.carts[findIndex].qty ||
                          1) + 1;

                      const total =
                        (draft[activeIndexTab].value?.carts[findIndex].price ||
                          0) * (qty || 0);
                      const afterDiscount = applyStackDiscount(
                        total,
                        draft[activeIndexTab].value?.carts[findIndex]
                          .discounts || [],
                      ).finalPrice;

                      draft[activeIndexTab].value.carts[findIndex].qty = qty;
                      draft[activeIndexTab].value.carts[findIndex].khr =
                        total * exchangeRate;
                      draft[activeIndexTab].value.carts[findIndex].usd = total;
                      draft[activeIndexTab].value.carts[
                        findIndex
                      ].discountValue = total - afterDiscount;
                      draft[activeIndexTab].value.carts[
                        findIndex
                      ].totalAfterDiscount = afterDiscount;

                      if (draft[activeIndexTab].value.status === "DRAFT") {
                        onUpdateOrderItemQty(
                          draft[activeIndexTab].value?.carts[findIndex].id ||
                            "",
                          qty,
                        );
                        setFetching(false);
                      }
                    }
                  } else {
                    const input = {
                      ...response.result[0],
                      qty: 1,
                      khr: Number(response.result[0].price || 0) * exchangeRate,
                      usd: Number(response.result[0].price || 0),
                      discounts: [],
                      discountValue: 0,
                      totalAfterDiscount: Number(response.result[0].price) || 0,
                      id: generateId(),
                    };
                    draft[activeIndexTab].value?.carts.push(input);

                    if (draft[activeIndexTab].value?.status === "DRAFT") {
                      onCreateOrderItem(input, split[1]?.trim() || "");
                    } else {
                      inputDummy = {
                        ...draft[activeIndexTab].value,
                        carts: [...(draft[activeIndexTab].value?.carts || [])],
                        status: "DRAFT",
                      };
                    }
                  }
                }
              }),
            );
            setTimeout(() => {
              if (inputDummy) {
                onSaveDraft(inputDummy, split[1]?.trim() || "").then(() => {
                  onFetch?.();
                });
              }
              setFetching(false);
            }, 300);
          } else {
            toast.error("Barcode not found!");
            setFetching(false);
          }
        })
        .catch((err) => {
          console.log(err);
          toast.error("Barcode not found!!");
          callback(false);
          setFetching(false);
        })
        .finally(() => {
          callback(true);
          setFetching(false);
        });
    },
    [
      setTabs,
      tabs,
      activeIndexTab,
      exchangeRate,
      onUpdateOrderItemQty,
      onCreateOrderItem,
      onSaveDraft,
      onFetch,
    ],
  );

  const onPrintPickingList = useCallback(() => {
    setPrintingPicking(id || "");
  }, [id]);

  const onDeleteOrderItem = useCallback(
    (itemId: string) => {
      triggerDeleteOrderItem({ item_id: itemId })
        .then((res) => {
          if (res.error === "Order already checkout") {
            onCloseTab?.(id || "", true);
            toast.error(res.error);
          } else {
            // setOldOrders(orders);
            // setChangeOrder(true);
          }
        })
        .catch(() => {
          toast.error("Cannot delete item");
        });
    },
    [triggerDeleteOrderItem, onCloseTab, id],
  );

  const onUpdateDiscountItem = useCallback(
    (itemId: string, discountAmount: string, discount: DiscountProps[]) => {
      triggerDiscountItem({
        item_id: itemId,
        discount_amount: discountAmount,
        discount,
      })
        .then((res) => {
          if (res.error === "Order already checkout") {
            onCloseTab?.(id || "", true);
            toast.error(res.error);
          } else {
            // setOldOrders(orders);
            // setChangeOrder(true);
          }
        })
        .catch(() => {
          toast.error("Cannot discount item");
        });
    },
    [id, onCloseTab, triggerDiscountItem],
  );

  const onChangeCustomerId = useCallback(
    (customerId: string) => {
      triggerUpdateCustomerId({
        customerId: customerId,
        code: "",
        type: "dine_in",
      })
        .then((res) => {
          if (res.error === "Order already checkout") {
            onCloseTab?.(id || "", true);
            toast.error(res.error);
          } else {
            setTabs(
              produce(tabs, (draft) => {
                if (draft[activeIndexTab].value) {
                  draft[activeIndexTab].value!.customerId = customerId;
                }
              }),
            );
            recall?.();
          }
        })
        .catch(() => {
          toast.error("Cannot update customer ID");
        });
    },
    [
      id,
      onCloseTab,
      triggerUpdateCustomerId,
      recall,
      activeIndexTab,
      tabs,
      setTabs,
    ],
  );

  const loading =
    isLoading ||
    isMutatingCreateOrder ||
    isMutatingCheckout ||
    isUpdatingOrderItemQty ||
    isDeletingOrderItem ||
    isCreatingOrderItem ||
    isDiscountingItem ||
    isDirty ||
    isMutatingCreatePromotion ||
    loadingTab ||
    isUpdatingCustomerId;

  return {
    orders:
      tabs[activeIndexTab] && tabs[activeIndexTab].value
        ? tabs[activeIndexTab].value
        : null,
    onChangeOrders: (v: OrderProps) => {
      setTabs(
        produce(tabs, (draft) => {
          if (draft[activeIndexTab].value) {
            draft[activeIndexTab].value.payments = v.payments;
            draft[activeIndexTab].value.carts = v.carts.map((x) => {
              const total = (x.price || 0) * (x.qty || 0);
              const afterDiscount = applyStackDiscount(
                total,
                x.discounts,
              ).finalPrice;

              return {
                ...x,
                khr: total * exchangeRate,
                usd: total,
                discountValue: total - afterDiscount,
                totalAfterDiscount: afterDiscount,
              };
            });
          }
        }),
      );
    },
    onScanBarcode,
    onCheckout,
    loading,
    exchangeRate,
    onCleanup,
    onCloseTab,
    printingOrder,
    setPrintingOrder,
    onSaveDraft,
    disabledDraft: tabs.find((f) => f.id === id)?.isDraft && !edit,
    onPrintPickingList,
    printingPicking,
    setPrintingPicking,
    onPickingList,
    onUpdateOrderItemQty,
    onDeleteOrderItem,
    onCreateOrderItem,
    onUpdateDiscountItem,
    onChangeCustomerId,
    fetching,
    setFetching,
    isPrint,
    setIsPrint,
    isPrintTicket,
    setIsPrintTicket,
    isDigitalTicket,
    setIsDigitalTicket,
  };
}
