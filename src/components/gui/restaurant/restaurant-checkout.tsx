import { requestReplenishmentPickingList } from "@/app/hooks/use-query-replenishment";
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
import { Formatter } from "@/lib/formatter";
import { useAuthentication } from "contexts/authentication-context";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { CreditCard, LaptopMinimalCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { POSCheckoutVerifyDialog } from "../pos/pos-checkout-verify-dialog";
import { posPaymentDialog } from "../pos/pos-payment-dialog";
import { DirectPrint } from "../pos/print/direct-print";
import { useRestaurant } from "./contexts/restaurant-context";
import { useRestaurantActions } from "./hooks/use-restaurant-actions";

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
  const { formatForDisplay } = useCurrencyFormat();
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          className="w-full md:hidden text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          disabled={disabledCheckout}
          size="lg"
        >
          <CreditCard className="h-5 w-5 mr-2" />
          Checkout {formatForDisplay(totalAfterDiscount)}
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
                  {formatForDisplay(1)} ={" "}
                  {Formatter.formatCurrencyKH(exchangeRate)}
                </span>
              </div>

              <Separator className="my-3" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <div className="text-right">
                    <div className="font-medium">{formatForDisplay(total)}</div>
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
                        -{formatForDisplay(totalDiscount)}
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
                    {formatForDisplay(totalAfterDiscount)}
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
                Pay {formatForDisplay(totalAfterDiscount)}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function RestaurantCheckout() {
  const { currentShift } = useAuthentication();
  const { formatForDisplay } = useCurrencyFormat();
  const { state } = useRestaurant();
  const params = useSearchParams();
  const currentTable = state.activeTables.find(
    (t) => t.tables?.id === params.get("table") || "",
  );
  const { setting } = useAuthentication();
  const { checkout } = useRestaurantActions();
  const [checkingOut, setCheckingOut] = useState(false);
  const [printingOrder, setPrintingOrder] = useState(null);
  const currentOrder = useMemo(
    () => currentTable?.orders?.items || [],
    [currentTable?.orders?.items],
  );
  const allowCheckout =
    currentOrder.length > 0 &&
    Number(
      currentOrder.reduce(
        (a, b) =>
          a +
          (b.status?.reduce(
            (c, d) => c + (d.status === "served" ? d.qty : 0),
            0,
          ) || 0),
        0,
      ),
    ) ===
      Number(
        currentOrder.reduce(
          (a, b) => a + (b.status?.reduce((c, d) => c + d.qty, 0) || 0),
          0,
        ),
      ) &&
    currentTable?.orders?.orderStatus === "DRAFT";

  const exchangeRate = Number(
    !setting?.isLoading && setting?.data?.result
      ? setting.data?.result?.find((f) => f.option === "EXCHANGE_RATE")?.value
      : "4100",
  );

  const template =
    !setting?.isLoading && !setting?.isValidating
      ? setting?.data?.result
          ?.find((f) => f.option === "INVOICE_RECEIPT")
          ?.value?.split(",")[0]
      : "default";

  const total =
    currentTable?.orders?.items.reduce(
      (sum, item) => sum + Number(item.totalAmount),
      0,
    ) || 0;

  const totalDiscount =
    currentTable?.orders?.items.reduce(
      (sum, item) => sum + Number(item.discountAmount || 0),
      0,
    ) || 0;
  const tax = 10;

  const getPickingList = useCallback(async () => {
    const items =
      currentOrder &&
      currentOrder.map((x) => {
        return {
          variantId: x.variantId,
          toFindQty: x.qty,
        };
      });
    const res = await requestReplenishmentPickingList("new", items, 0);
    if (
      typeof res === "object" &&
      res !== null &&
      "success" in res &&
      (res as { success: boolean }).success
    ) {
      const raw = (
        res as unknown as { result: { slot: { posSlot: boolean } }[] }
      ).result;
      const haveSlotNeedTransfer = raw
        .filter((f) => f.slot)
        .filter((f) => f.slot.posSlot === false);
      return haveSlotNeedTransfer;
    }
    return [];
  }, [currentOrder]);

  const handleCheckout = useCallback(async () => {
    if (!currentShift) {
      return toast.error("Please open shift before checkout");
    }
    setCheckingOut(true);
    const payments = currentTable?.orders?.payments || [];
    const haveSlotNeedTransfer = await getPickingList();
    if (haveSlotNeedTransfer.length === 0) {
      const result = await posPaymentDialog.show({
        defaultPayments: payments,
        totalOrder: Math.round(total * 100) / 100,
        isPrint: true,
        digitalTicket: false,
        printTicket: false,
      });
      if (result.payment.length > 0 && currentTable?.tables) {
        checkout(currentTable?.tables, result.payment);
      }
    } else {
      const res = await POSCheckoutVerifyDialog.show({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        item: haveSlotNeedTransfer as any,
        orderId: currentTable?.orders?.orderId || "",
      });

      if (!!res) {
        const result = await posPaymentDialog.show({
          defaultPayments: payments,
          totalOrder: Math.round(total * 100) / 100,
          isPrint: true,
          digitalTicket: false,
          printTicket: false,
        });

        if (result.payment.length > 0 && currentTable?.tables) {
          checkout(currentTable?.tables, result.payment);
        }
      }
    }
    setCheckingOut(false);
  }, [currentTable, getPickingList, checkout, total, currentShift]);

  return (
    <>
      <Button
        className="hidden md:flex w-full text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
        size="sm"
        disabled={!allowCheckout || checkingOut}
        onClick={handleCheckout}
      >
        <LaptopMinimalCheck className="h-5 w-5" />
        {formatForDisplay(total)}
      </Button>
      <div className="md:hidden">
        <DrawerCheckout
          disabledCheckout={!allowCheckout || checkingOut}
          totalAfterDiscount={total}
          exchangeRate={exchangeRate || 0}
          tax={tax}
          total={total}
          totalDiscount={totalDiscount}
          totalKHR={Number(
            Formatter.formatCurrencyKH(total * (exchangeRate || 0)),
          )}
          handleCheckout={handleCheckout}
          by={currentTable?.orders?.createdBy?.fullname || ""}
        />
      </div>
      {printingOrder && (
        <DirectPrint
          orderId={printingOrder}
          onPrintComplete={() => {
            setPrintingOrder(null);
          }}
          type={template as unknown as "default" | "template-i" | "template-ch"}
        />
      )}
    </>
  );
}
