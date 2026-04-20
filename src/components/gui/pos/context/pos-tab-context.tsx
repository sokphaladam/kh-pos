"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { v4 } from "uuid";
import { produce } from "immer";
import {
  requestAutoInvoiceNumber,
  useQueryOrderList,
} from "@/app/hooks/use-query-order";
import { OrderProps } from "../types/post-types";
import { useAuthentication } from "contexts/authentication-context";
import { SheetTabContext } from "./sheet-tab-context";
import { POSSecondWindow } from "../second-window";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductVariantType } from "@/dataloader/product-variant-loader";

const EMPTY_VALUE_ID = v4();

const EMPTY_VALUE_ORDER: OrderProps = {
  invoiceNo: 0,
  carts: [],
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

export interface TabProps {
  id: string;
  title: string;
  active: boolean;
  value?: OrderProps;
  isDraft?: boolean;
}

interface Props {
  tabs: TabProps[];
  setTabs: (tabs: TabProps[]) => void;
  onNewTab: () => void;
  onActiveTab: (id: string) => void;
  onCloseTab: (id: string, checkout?: boolean) => void;
  openSecondWindow?: () => void;
  onCleanup?: () => void;
  onAutoInvoice: () => void;
  onFetch?: () => void;
  sleep?: boolean;
  recall?: () => void;
  loading?: boolean;
}

export const POSTabContext = createContext<Props>({
  tabs: [],
  setTabs: () => {},
  onNewTab: () => {},
  onActiveTab: () => {},
  onCloseTab: () => {},
  onAutoInvoice: () => {},
});

export function usePOSTabContext() {
  return useContext(POSTabContext);
}

export function POSTabContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const EMPTY_VALUE: TabProps[] = [
    {
      id: EMPTY_VALUE_ID,
      title: "New tab",
      active: true,
      value: EMPTY_VALUE_ORDER,
    },
  ];
  const [sleep, setSleep] = useState(false);
  const [tabs, setTabs] = useState<TabProps[]>(EMPTY_VALUE);
  const [loadingList, setLoadingList] = useState(true);
  const [openWindow, setOpenWindow] = useState(false);
  const { user, currentWarehouse, setting } = useAuthentication();
  const [newTab, setNewTab] = useState(true);

  const queryOrder = useQueryOrderList({
    offset: 0,
    limit: 100,
    status: "DRAFT",
    userId: user?.id,
    checkSharedDraft: "1",
  });

  const exchangeRate = Number(
    !setting?.isLoading && setting?.data?.result
      ? setting.data?.result?.find((f) => f.option === "EXCHANGE_RATE")?.value
      : "4100",
  );

  const onActiveTab = useCallback(
    (id: string) => {
      const param = new URLSearchParams(searchParams);
      setSleep(true);

      setTabs(
        produce((draft) => {
          const index = draft.findIndex((f) => f.id === id);
          const currentActive = draft.findIndex((f) => f.active === true);
          if (index < 0) return;
          if (index === currentActive) return;
          draft[index].active = true;
          draft[currentActive].active = false;
        }),
      );

      param.set("id", id);
      router.push(`${pathname}?${param.toString()}`);

      setTimeout(() => {
        const doc = document.getElementById(id);
        if (doc) {
          doc.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }
      }, 100);
      setTimeout(() => {
        setSleep(false);
      }, 100);
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (loadingList && !queryOrder.isLoading && !queryOrder.isValidating) {
      if ((queryOrder.data?.result?.orders.length || 0) > 0) {
        setTabs(
          produce(() => {
            const results: TabProps[] = !!newTab
              ? [
                  // {
                  //   id: EMPTY_VALUE_ID,
                  //   title: "New tab",
                  //   active: true,
                  //   value: EMPTY_VALUE_ORDER,
                  // },
                ]
              : [];
            for (const [index, x] of (
              queryOrder.data?.result?.orders || []
            ).entries()) {
              const value: OrderProps = {
                customerId: x.customerId || undefined,
                customer: x.customerLoader || undefined,
                invoiceNo: x.invoiceNo,
                status: x.orderStatus,
                by: x.createdBy,
                carts:
                  x.items?.map((x) => {
                    const amountBeforDiscount =
                      Number(x.discountAmount) + Number(x.totalAmount);

                    const manualDiscount = x.discounts?.find(
                      (f) => f.discountId === "manual",
                    );

                    return {
                      discounts: [
                        {
                          ...manualDiscount,
                          id: manualDiscount?.id || "",
                          discountId: manualDiscount?.discountId || "",
                          name: manualDiscount?.name,
                          amount: manualDiscount?.amount?.toString() ?? "0",
                          discountType:
                            manualDiscount?.discountType || "AMOUNT",
                          orderDetailId: manualDiscount?.orderDetailId || "",
                          productId: x.productVariant?.basicProduct?.id || "",
                          title: manualDiscount?.name || "",
                          description: "",
                          warehouseId: currentWarehouse?.id || "",
                          updatedAt: "",
                          value: manualDiscount?.value || 0,
                          createdAt: manualDiscount?.createdAt || "",
                        },
                        ...(x.discounts
                          ?.filter((f) => f.discountId !== "manual")
                          .map((d) => {
                            return {
                              ...d,
                              id: d.id || "",
                              discountId: d.discountId || "",
                              name: d.name,
                              amount: d.amount?.toString() ?? "0",
                              discountType: d.discountType || "AMOUNT",
                              orderDetailId: d.orderDetailId || "",
                              productId:
                                x.productVariant?.basicProduct?.id || "",
                              title: d.name || "",
                              description: "",
                              warehouseId: currentWarehouse?.id || "",
                              updatedAt: "",
                              value: d.value || 0,
                              createdAt: d.createdAt || "",
                            };
                          }) || []),
                      ],
                      discountValue: Number(x.discountAmount),
                      khr: amountBeforDiscount * exchangeRate,
                      productId: x.productVariant?.basicProduct?.id || "",
                      productTitle: x.title || "",
                      qty: x.qty,
                      totalAfterDiscount: Number(x.totalAmount),
                      usd: Number(amountBeforDiscount.toFixed(2)),
                      variantId: x.variantId || "",
                      warehouseId: currentWarehouse?.id || "",
                      barcode: x.barcode || "",
                      images: x.productVariant?.basicProduct?.images,
                      price: Number(x.price),
                      sku: x.sku,
                      id: x.orderDetailId,
                      reservation: x.reservation,
                      variants: [
                        { ...x.productVariant },
                      ] as ProductVariantType[],
                    };
                  }) || [],
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
              const have = results.find((f) => f.id === id);
              results.push({
                id: x.orderId + "" || "",
                title: x.invoiceNo + "" || "",
                active: have ? (x.orderId === id ? true : false) : index === 0,
                value: value,
                isDraft: true,
              });
            }
            return results;
          }),
        );
      } else {
        setTabs([
          {
            id: EMPTY_VALUE_ID,
            title: "New tab",
            active: true,
            value: EMPTY_VALUE_ORDER,
          },
        ]);
      }
      setTimeout(() => {
        onActiveTab(id || "");
        setSleep(false);
      }, 100);
      setNewTab(false);
      setLoadingList(false);
    }
  }, [
    queryOrder,
    loadingList,
    tabs,
    id,
    onActiveTab,
    currentWarehouse,
    exchangeRate,
    newTab,
  ]);

  const onAutoInvoice = useCallback(async () => {
    // if (loading) {
    return await requestAutoInvoiceNumber(tabs.length);
    // }
  }, [tabs]);

  const autoInvoice = useCallback(() => {
    if (tabs.length > 0) {
      setTimeout(() => {
        requestAutoInvoiceNumber(tabs.length)
          .then((res: any) => {
            if (res.success) {
              setTabs(
                produce((draft) => {
                  draft.forEach((tab, idx) => {
                    tab.title =
                      tab.title === "New tab" ? res.result[idx] : tab.title;
                  });
                }),
              );
            }
          })
          .catch();
      }, 100);
    }
  }, [tabs]);

  const openSecondWindow = () => {
    setOpenWindow(true);
  };

  const onClickNewtab = useCallback(() => {
    setSleep(true);
    setTabs(
      produce((draft) => {
        const currentActive = draft.findIndex((f) => f.active === true);
        const id = v4();
        draft[currentActive].active = false;
        draft.unshift({
          id,
          title: `New tab`,
          active: true,
          value: EMPTY_VALUE_ORDER,
        });
      }),
    );
    setTimeout(() => {
      setSleep(false);
    }, 300);
  }, []);

  const onFetch = useCallback(() => {
    queryOrder.mutate();
  }, [queryOrder]);

  const recall = useCallback(() => {
    queryOrder.mutate();
    setLoadingList(true);
  }, [queryOrder]);

  const onCloseTab = useCallback(
    async (id: string, checkout?: boolean) => {
      setSleep(true);
      const index = tabs.findIndex((f) => f.id === id);

      if (tabs[index].isDraft && !checkout) {
        const res = await SheetTabContext.show({ id });
        if (res === "remove") {
          setSleep(true);
        }
        if (res === "cancel") return setSleep(false);
      }

      setTabs(
        produce((draft) => {
          if (index === -1) return;
          const wasActive = draft[index].active;
          draft.splice(index, 1); // <-- Remove tab
          if (draft.length === 0) {
            draft.unshift({
              id,
              title: `New tab`,
              active: true,
              value: EMPTY_VALUE_ORDER,
            });
          } else {
            if (wasActive && draft.length > 0) {
              // Prefer next tab, otherwise previous
              const nextIndex = index < draft.length ? index : draft.length - 1;
              draft.forEach((tab) => (tab.active = false));
              draft[nextIndex].active = true;
            }
          }
        }),
      );

      await autoInvoice();
      setTimeout(() => {
        setSleep(false);
      }, 100);
    },
    [tabs, autoInvoice],
  );

  const onCleanup = useCallback(() => {
    const currentActive = tabs.find((f) => !!f.active);
    if (!!currentActive?.isDraft) {
      return;
    }
    onClickNewtab();
  }, [onClickNewtab, tabs]);

  const currentTab = tabs.find((f) => f.active);

  return (
    <POSTabContext.Provider
      value={{
        recall,
        tabs,
        setTabs: (v) => {
          const param = new URLSearchParams(searchParams);
          const active = v.find((f) => !!f.active);

          if (active?.id !== id) {
            param.set("id", active?.id || "");
            router.push(`${pathname}?${param.toString()}`);
          }
          setTabs(v);

          if (v.filter((f) => f.title === "New tab").length > 0) {
            autoInvoice();
          }
        },
        onActiveTab,
        onNewTab: onClickNewtab,
        onCloseTab,
        openSecondWindow,
        onCleanup,
        onAutoInvoice,
        onFetch,
        sleep,
        loading: loadingList,
      }}
    >
      {/* {loadingList ? (
        <div className="flex items-center justify-center h-full w-full">
          Loading...
        </div>
      ) : (
        children
      )} */}
      {children}
      {!!openWindow && (
        <POSSecondWindow
          key={`second_window_${openSecondWindow}`}
          data={currentTab ? currentTab.value : undefined}
          onClosed={() => setOpenWindow(false)}
        />
      )}
    </POSTabContext.Provider>
  );
}
