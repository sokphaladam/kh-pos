/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { requestReplenishmentPickingList } from "@/app/hooks/use-query-replenishment";
import { FindProductInSlotResult } from "@/classes/find-product-in-slot";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { useWindowSize } from "@/components/use-window-size";
import { Formatter } from "@/lib/formatter";
import { useAuthentication } from "contexts/authentication-context";
import { produce } from "immer";
import {
  CreditCard,
  LaptopMinimalCheck,
  PackageCheck,
  Printer,
  User,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { SheetTransferStock } from "../transfer-stock/sheet-transfer-stock";
import { usePOSContext } from "./context/pos-context";
import { usePOSTabContext } from "./context/pos-tab-context";
import { POSCheckoutVerifyDialog } from "./pos-checkout-verify-dialog";
import { posPaymentDialog } from "./pos-payment-dialog";
import { DirectPrint } from "./print/direct-print";
import { dialogOrderCustomer } from "./dialog-customer";
import PrintTicketClient from "../order/components/print-ticket-client";

function DrawerCheckout({
  disabledCheckout,
  totalAfterDiscount,
  exchangeRate,
  tax,
  total,
  totalDiscount,
  totalKHR,
  handleCheckout,
  by,
}: {
  disabledCheckout: boolean;
  totalAfterDiscount: number;
  exchangeRate: number;
  total: number;
  totalKHR: number;
  tax: number;
  totalDiscount: number;
  handleCheckout: () => void;
  by: string;
}) {
  const { currency } = useAuthentication();
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          className="w-full md:hidden text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          disabled={disabledCheckout}
          size="lg"
        >
          <CreditCard className="h-5 w-5 mr-2" />
          Checkout ${totalAfterDiscount.toFixed(2)}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="text-center pb-4">
            <DrawerTitle className="text-xl font-bold text-gray-800">
              Order Summary
            </DrawerTitle>
            <DrawerDescription className="text-gray-600">
              Review your order before payment
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {by && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Cashier:</span>
                  <span className="font-medium text-gray-800">{by}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Exchange Rate:</span>
                <span className="font-medium text-gray-800">
                  {currency}1 = {Formatter.formatCurrencyKH(exchangeRate)}
                </span>
              </div>

              <Separator className="my-3" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <div className="text-right">
                    <div className="font-medium">${total.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      {Formatter.formatCurrencyKH(totalKHR)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({tax}%):</span>
                  <span className="text-gray-600 text-sm">Included</span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <div className="text-right">
                      <div className="font-medium">
                        -${totalDiscount.toFixed(2)}
                      </div>
                      <div className="text-xs">
                        -
                        {Formatter.formatCurrencyKH(
                          totalDiscount * (exchangeRate || 0),
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-3" />

              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">Total:</span>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">
                    {currency}
                    {totalAfterDiscount.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {Formatter.formatCurrencyKH(
                      totalAfterDiscount * (exchangeRate || 0),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter className="px-6 pb-6">
            <DrawerClose asChild>
              <Button
                className="w-full text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                size="lg"
                disabled={disabledCheckout}
                onClick={handleCheckout}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Pay ${totalAfterDiscount.toFixed(2)}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function POSCheckoutFooter() {
  const { tabs, recall } = usePOSTabContext();
  const {
    orders,
    setOrders,
    loading,
    onCheckout,
    exchangeRate,
    setIsPrint,
    isPrint,
    onChangeCustomerId,
    isPrintTicket,
    isDigitalTicket,
    setIsDigitalTicket,
    setIsPrintTicket,
  } = usePOSContext();
  const refPrintTicket = useRef<HTMLButtonElement | null>(null);
  const { height, width } = useWindowSize();
  const [checkingOut, setCheckingOut] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printOrderId, setPrintOrderId] = useState<string | null>(null);
  const { setting } = useAuthentication();

  const reservations = useMemo(() => {
    return (
      orders?.carts
        .map((cart) => cart.reservation?.map((res) => res).flat())
        .flat()
        .filter((r) => r !== undefined) || []
    );
  }, [orders]);

  const template =
    !setting?.isLoading && !setting?.isValidating
      ? setting?.data?.result
          ?.find((f) => f.option === "INVOICE_RECEIPT")
          ?.value?.split(",")[0]
      : "default";

  const total =
    orders &&
    orders.carts.reduce((sum, item) => sum + Number(item.usd || 0), 0);
  const totalKHR =
    orders &&
    orders.carts.reduce((sum, item) => sum + Number(item.khr || 0), 0);
  const totalDiscount =
    orders &&
    orders.carts.reduce(
      (sum, item) => sum + Number(item.discountValue || 0),
      0,
    );
  const totalAfterDiscount =
    orders &&
    orders.carts.reduce(
      (sum, item) => sum + Number(item.totalAfterDiscount || 0),
      0,
    );
  const tax = 10;

  const getPickingList = useCallback(async () => {
    const items =
      orders &&
      orders.carts.map((x) => {
        return {
          variantId: x.variantId,
          toFindQty: x.qty,
        };
      });
    const res = await requestReplenishmentPickingList("new", items, 0, 1);
    if (
      typeof res === "object" &&
      res !== null &&
      "success" in res &&
      (res as any).success
    ) {
      const raw: FindProductInSlotResult[] = (res as any).result;

      const itemsNeedingAction = raw.filter((f) => {
        // Transfer needed: has slot but not POS slot
        if (f.slot && f.slot.posSlot === false && f.qty > 0) {
          return true;
        }

        // Conversion needed: has todoType for unit conversion
        if (f.todoType && ["BREAK", "REPACK", "MIXED"].includes(f.todoType)) {
          return true;
        }

        // Unavailable: no slot and has quantity needed
        if (!f.slot && f.qty > 0) {
          return true;
        }

        return false;
      });

      return itemsNeedingAction;
    }
    return [];
  }, [orders]);

  const handleCheckout = useCallback(async () => {
    setCheckingOut(true);
    const itemsNeedingAction = await getPickingList();
    if (itemsNeedingAction.length === 0) {
      const result = await posPaymentDialog.show({
        defaultPayments: orders.payments,
        totalOrder: Math.round(totalAfterDiscount * 100) / 100,
        isPrint: !!isPrint,
        digitalTicket: !!isDigitalTicket,
        printTicket: !!isPrintTicket,
      });
      if (result.payment.length > 0) {
        if (!!result.printTicket && reservations.length > 0) {
          refPrintTicket.current?.click();
        }

        if (!!result.digitalTicket) {
          const orderData = {
            createdAt: "",
            createdBy: null,
            customerId: "",
            invoiceNo: 0,
            orderId: "",
            orderStatus: "DRAFT",
            totalAmount: "0",
            customer: 0,
            items: orders?.carts.map((cart) => {
              return {
                ...cart,
                orderDetailId: cart.id || "",
                title: cart.productTitle,
                sku: cart.sku || "",
                barcode: cart.barcode || "",
                price: String(cart.price || 0),
                discountAmount: String(cart.discountValue || 0),
                modiferAmount: "0",
                totalAmount: String(cart.totalAfterDiscount || 0),
                reservation: cart.reservation?.map((x) => {
                  return {
                    ...x,
                  };
                }),
                discounts: [],
              };
            }),
          };
          localStorage.setItem(
            "pos_digital_ticket_order",
            JSON.stringify(orderData),
          );
        }

        setIsPrint?.(result.isPrint);
        setIsDigitalTicket?.(result.digitalTicket);
        setIsPrintTicket?.(result.printTicket);
        localStorage.setItem("pos_is_print", String(result.isPrint));
        localStorage.setItem("pos_is_print_ticket", String(result.printTicket));
        localStorage.setItem(
          "pos_is_digital_ticket",
          String(result.digitalTicket),
        );
        setOrders(
          produce(orders, (draft) => {
            draft.payments = result.payment;
          }),
        );
        onCheckout?.(result.payment, {
          isPrint: result.isPrint,
          printDigitalTicket: result.digitalTicket,
          printTicket: result.printTicket,
        });
      }
    } else {
      const res = await POSCheckoutVerifyDialog.show({
        item: itemsNeedingAction,
        orderId: tabs.find((f) => f.active)?.id || "",
        onRefresh: getPickingList, // Pass refresh function to dialog
      });

      if (!!res) {
        const result = await posPaymentDialog.show({
          defaultPayments: orders.payments,
          totalOrder: Math.round(totalAfterDiscount * 100) / 100,
          isPrint: !!isPrint,
          digitalTicket: !!isDigitalTicket,
          printTicket: !!isPrintTicket,
        });
        if (result.payment.length > 0) {
          if (!!result.printTicket && reservations.length > 0) {
            refPrintTicket.current?.click();
          }

          if (!!result.digitalTicket) {
            const orderData = {
              createdAt: "",
              createdBy: null,
              customerId: "",
              invoiceNo: 0,
              orderId: "",
              orderStatus: "DRAFT",
              totalAmount: "0",
              customer: 0,
              items: orders?.carts.map((cart) => {
                return {
                  ...cart,
                  orderDetailId: cart.id || "",
                  title: cart.productTitle,
                  sku: cart.sku || "",
                  barcode: cart.barcode || "",
                  price: String(cart.price || 0),
                  discountAmount: String(cart.discountValue || 0),
                  modiferAmount: "0",
                  totalAmount: String(cart.totalAfterDiscount || 0),
                  reservation: cart.reservation?.map((x) => {
                    return {
                      ...x,
                    };
                  }),
                  discounts: [],
                };
              }),
            };
            localStorage.setItem(
              "pos_digital_ticket_order",
              JSON.stringify(orderData),
            );
          }

          setIsPrint?.(result.isPrint);
          setIsDigitalTicket?.(result.digitalTicket);
          setIsPrintTicket?.(result.printTicket);
          localStorage.setItem("pos_is_print", String(result.isPrint));
          localStorage.setItem(
            "pos_is_print_ticket",
            String(result.printTicket),
          );
          localStorage.setItem(
            "pos_is_digital_ticket",
            String(result.digitalTicket),
          );
          setOrders(
            produce(orders, (draft) => {
              draft.payments = result.payment;
            }),
          );
          onCheckout?.(result.payment, {
            isPrint: result.isPrint,
            printDigitalTicket: result.digitalTicket,
            printTicket: result.printTicket,
          });
        }
      }
    }
    setCheckingOut(false);
  }, [
    onCheckout,
    orders,
    setOrders,
    tabs,
    totalAfterDiscount,
    getPickingList,
    isPrint,
    setIsPrint,
    isPrintTicket,
    isDigitalTicket,
    setIsDigitalTicket,
    setIsPrintTicket,
    reservations,
  ]);

  const handleStockTransfer = useCallback(async () => {
    const items = {
      ...orders,
      invoiceNo: orders.invoiceNo,
      orderId: tabs.find((f) => f.active)?.id || "",
      items: orders.carts.map((x) => {
        return {
          ...x,
          title: x.productTitle,
          discountAmount: String(x.discountValue),
          modiferAmount: "0",
          orderDetailId: "",
          totalAmount: String(x.totalAfterDiscount),
          orderReturns: [],
          qty: x.qty,
          khr: x.khr,
          totalAfterDiscount: x.totalAfterDiscount,
          usd: x.totalAfterDiscount,
          variantId: x.variantId,
          warehouseId: x.warehouseId,
          sku: x.sku ?? "",
          barcode: x.barcode || "",
          price: x.price !== undefined ? String(x.price) : "0",
          slot: [],
          discounts: (x.discounts || []).map((d: any) => ({
            discountId: d.discountId ?? "",
            orderDetailId: d.orderDetailId ?? "",
            amount: d.amount ?? 0,
            name: d.name ?? "",
          })),
        };
      }),
      createdAt: "",
      createdBy: null,
      customerId: "",
      orderStatus: "DRAFT",
      totalAmount: "0",
    };
    const res = await SheetTransferStock.show({
      item: items as any,
    });

    if (!!res) {
      recall?.();
    }
  }, [orders, tabs, recall]);

  const handlePrint = useCallback(() => {
    const activeTabId = tabs.find((f) => f.active)?.id;
    if (activeTabId) {
      setPrintOrderId(activeTabId);
      setPrinting(true);
    }
  }, [tabs]);

  const handlePrintComplete = useCallback(() => {
    if (reservations.length > 0) {
      refPrintTicket.current?.click();
    }
    setPrinting(false);
    setPrintOrderId(null);
  }, [reservations]);

  const disabledCheckout =
    (orders && orders.carts.length === 0) || loading || checkingOut;

  if (!orders) return null;

  const isEmpty = orders.carts.length === 0;

  return (
    <div
      className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm"
      style={{ height: width < 768 ? "auto" : height - 130 }}
    >
      {/* Summary Section - Desktop */}
      <div className="flex-1 p-6 hidden md:block">
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Order Summary
            </h3>

            {orders.by && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 text-sm">Cashier:</span>
                <span className="font-medium text-gray-800">
                  {orders.by?.fullname}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Exchange Rate:</span>
              <span className="font-medium text-gray-800">
                $1 = {Formatter.formatCurrencyKH(exchangeRate)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <div className="text-right">
                <div className="font-medium text-gray-800">
                  ${total.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  {Formatter.formatCurrencyKH(totalKHR)}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Tax ({tax}%):</span>
              <span className="text-gray-600 text-sm">Included</span>
            </div>

            {totalDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <div className="text-right">
                  <div className="font-medium">
                    -${totalDiscount.toFixed(2)}
                  </div>
                  <div className="text-xs">
                    -
                    {Formatter.formatCurrencyKH(
                      totalDiscount * (exchangeRate || 0),
                    )}
                  </div>
                </div>
              </div>
            )}

            <Separator className="my-3" />

            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-gray-800">Total:</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  ${totalAfterDiscount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  {Formatter.formatCurrencyKH(
                    totalAfterDiscount * (exchangeRate || 0),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="space-y-3">
          {/* Stock Transfer and Print Buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1 justify-center bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 font-medium"
              variant="outline"
              size="sm"
              disabled={isEmpty}
              onClick={handleStockTransfer}
            >
              <PackageCheck className="h-4 w-4 mr-2" />
              Check Stock
            </Button>

            <Button
              className="flex-1 justify-center bg-green-50 hover:bg-green-100 text-green-700 border-green-200 font-medium"
              variant="outline"
              size="sm"
              disabled={isEmpty || printing}
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-2" />
              {printing ? "Printing..." : "Print"}
            </Button>

            <Button
              className={`flex-1 justify-center font-medium transition-all ${
                orders.customer
                  ? "bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
              }`}
              variant="outline"
              size="sm"
              disabled={isEmpty}
              onClick={async () => {
                const res = await dialogOrderCustomer.show({
                  customer: orders.customer || undefined,
                });

                if (!!res) {
                  onChangeCustomerId?.(String(res || ""));
                }
              }}
            >
              <User className="h-4 w-4 mr-2" />
              <div className="flex flex-col items-start min-w-0">
                <span className="text-sm font-medium truncate">
                  {orders.customer
                    ? orders.customer.customerName ||
                      orders.customer.phone ||
                      "Unknown"
                    : "Walk-in"}
                </span>
              </div>
            </Button>
          </div>

          {/* Main Checkout Button - Desktop */}
          <div className="hidden md:block">
            <Button
              className="w-full text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
              size="lg"
              disabled={disabledCheckout}
              onClick={handleCheckout}
            >
              <LaptopMinimalCheck className="h-5 w-5 mr-2" />
              {checkingOut
                ? "Processing..."
                : `Checkout $${totalAfterDiscount.toFixed(2)}`}
            </Button>
          </div>

          {/* Main Checkout Button - Mobile */}
          <div className="md:hidden">
            <DrawerCheckout
              disabledCheckout={disabledCheckout}
              totalAfterDiscount={totalAfterDiscount}
              exchangeRate={exchangeRate || 0}
              tax={tax}
              total={total}
              totalDiscount={totalDiscount}
              totalKHR={totalKHR}
              handleCheckout={handleCheckout}
              by={orders.by?.fullname ?? ""}
            />
          </div>
        </div>
      </div>

      {/* Print Component - Hidden */}
      {printOrderId && (
        <>
          <DirectPrint
            orderId={printOrderId}
            onPrintComplete={handlePrintComplete}
            autoprint={true}
            type={
              template as unknown as "default" | "template-i" | "template-ch"
            }
          />
        </>
      )}
      <PrintTicketClient reservations={reservations} ref={refPrintTicket} />
    </div>
  );
}
