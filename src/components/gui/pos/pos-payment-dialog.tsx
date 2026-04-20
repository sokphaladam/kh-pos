import { BasicMenuAction } from "@/components/basic-menu-action";
import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MaterialInput } from "@/components/ui/material-input";
import { Formatter } from "@/lib/formatter";
import { produce } from "immer";
import { AlertCircle, CheckCircle2, CreditCard } from "lucide-react";
import { useCallback, useState } from "react";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { POSPaymentCurrencySelect } from "./pos-payment-currency-select";
import { POSPaymentMehtodSelect } from "./pos-payment-method-select";
import { PaymentProps } from "./types/post-types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const posPaymentDialog = createDialog<
  {
    defaultPayments: PaymentProps[];
    totalOrder?: number;
    isPrint?: boolean;
    printTicket: boolean;
    digitalTicket: boolean;
  },
  {
    payment: PaymentProps[];
    isPrint: boolean;
    printTicket: boolean;
    digitalTicket: boolean;
  }
>(
  ({
    defaultPayments,
    close,
    totalOrder,
    isPrint,
    printTicket,
    digitalTicket,
  }) => {
    const { setting } = useAuthentication();
    const [print, setPrint] = useState<boolean>(!!isPrint);
    const [printT, setPrintT] = useState<boolean>(!!printTicket);
    const [digitalT, setDigitalT] = useState<boolean>(!!digitalTicket);
    const { formatForDisplay, format, currencyCode } = useCurrencyFormat();
    const exchangeRate = Number(
      !setting?.isLoading && setting?.data?.result
        ? setting.data?.result?.find((f) => f.option === "EXCHANGE_RATE")?.value
        : "4100",
    );
    const [payments, setPayments] = useState<PaymentProps[]>(
      defaultPayments && defaultPayments.length > 0
        ? defaultPayments
        : [
            {
              amount: "0",
              amountUsd: "0",
              currency: "USD",
              paymentMethod: "",
              exchangeRate: exchangeRate.toString(),
              used: "0",
            },
          ],
    );

    const onAdd = useCallback(() => {
      setPayments(
        produce((draft) => {
          draft.push({
            amount: "0",
            amountUsd: "0",
            currency: "USD",
            paymentMethod: "",
            exchangeRate: exchangeRate.toString(),
            used: "0",
          });
        }),
      );
    }, [exchangeRate]);

    const onDelete = useCallback((idx: number) => {
      setPayments(
        produce((draft) => {
          draft.splice(idx, 1);
        }),
      );
    }, []);

    const customerReceived = payments.reduce(
      (a, b) => (a = a + Number(b.amountUsd)),
      0,
    );

    const returnToCustomer = customerReceived - (totalOrder || 0);

    const remainingBalance = Math.max(0, (totalOrder || 0) - customerReceived);

    const totalOrderSub = Formatter.exchangeValue(
      totalOrder || 0,
      currencyCode === "USD" ? "KHR" : "USD",
      exchangeRate,
    );
    const totalCustomerReceived = Formatter.exchangeValue(
      customerReceived,
      currencyCode === "USD" ? "KHR" : "USD",
      exchangeRate,
    );
    const totalRemainingBalance = Formatter.exchangeValue(
      remainingBalance,
      currencyCode === "USD" ? "KHR" : "USD",
      exchangeRate,
    );

    const type_pos =
      !setting?.isLoading && !setting?.isValidating
        ? JSON.parse(
            setting?.data?.result?.find((f) => f.option === "TYPE_POS")
              ?.value || "{}",
          ).system_type
        : "mart";

    return (
      <>
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Processing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Exchange Rate Display */}
          <div className="flex justify-center">
            <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-lg border">
              Exchange Rate: 1 USD = {exchangeRate.toLocaleString()} KHR
            </div>
          </div>

          {/* Compact Summary */}
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">Total</div>
                <div className="font-bold text-lg">
                  {formatForDisplay(totalOrder || 0)}
                </div>
                <div className="text-xs text-gray-500">
                  {totalOrderSub.symbol}
                  {totalOrderSub.amount}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Paid</div>
                <div className="font-semibold text-lg text-green-600">
                  {formatForDisplay(customerReceived)}
                </div>
                <div className="text-xs text-gray-500">
                  {totalCustomerReceived.symbol}
                  {totalCustomerReceived.amount}
                </div>
              </div>
              {remainingBalance > 0 ? (
                <div className="text-right">
                  <div className="text-sm text-orange-600">Remaining</div>
                  <div className="font-semibold text-lg text-orange-600">
                    {formatForDisplay(remainingBalance)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {totalRemainingBalance.symbol}
                    {totalRemainingBalance.amount}
                  </div>
                </div>
              ) : returnToCustomer > 0 ? (
                <div className="text-right">
                  <div className="text-sm text-green-600">Change</div>
                  <div className="font-semibold text-lg text-green-600">
                    {formatForDisplay(returnToCustomer)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {currencyCode === "USD"
                      ? Formatter.formatCurrencyKH(
                          returnToCustomer * exchangeRate,
                        )
                      : `$${(returnToCustomer / exchangeRate).toFixed(2)}`}
                  </div>
                </div>
              ) : (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Payment Methods</h3>
            </div>

            {payments.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No payment methods added</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((payment, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-3 items-center">
                      <POSPaymentMehtodSelect
                        value={payment.paymentMethod}
                        setValue={(v) => {
                          setPayments(
                            produce((draft) => {
                              draft[idx].paymentMethod = v;
                            }),
                          );
                        }}
                      />
                      <POSPaymentCurrencySelect
                        value={payment.currency}
                        setValue={(v) => {
                          setPayments(
                            produce((draft) => {
                              const newCurrency = v as "USD" | "KHR";
                              const oldCurrency = draft[idx].currency;

                              if (oldCurrency !== newCurrency) {
                                const currentAmount = Number(draft[idx].amount);
                                let newAmount: number;

                                if (
                                  oldCurrency === "USD" &&
                                  newCurrency === "KHR"
                                ) {
                                  newAmount =
                                    currencyCode === "USD"
                                      ? currentAmount * exchangeRate
                                      : currentAmount / exchangeRate;
                                } else {
                                  // KHR → USD
                                  newAmount =
                                    currencyCode === "USD"
                                      ? currentAmount / exchangeRate
                                      : currentAmount * exchangeRate;
                                }

                                draft[idx].amount = newAmount.toString();
                                draft[idx].amountUsd =
                                  newCurrency === "USD"
                                    ? newAmount.toString()
                                    : (currencyCode === "USD"
                                        ? newAmount / exchangeRate
                                        : newAmount * exchangeRate
                                      ).toString();
                              }

                              draft[idx].currency = newCurrency;
                            }),
                          );
                        }}
                      />
                      <div className="space-y-1">
                        <MaterialInput
                          label=""
                          type="number"
                          value={payment.amount}
                          onChange={(e) => {
                            setPayments(
                              produce((draft) => {
                                draft[idx].amount = e.target.value;
                                draft[idx].amountUsd =
                                  draft[idx].currency === "USD"
                                    ? e.target.value
                                    : (currencyCode === "USD"
                                        ? Number(e.target.value) / exchangeRate
                                        : Number(e.target.value) * exchangeRate
                                      ).toString();
                              }),
                            );
                          }}
                          className="h-9"
                          onFocus={(e) => e.target.select()}
                          autoFocus={idx === 0}
                        />
                        {payment.currency === "KHR" && (
                          <div className="text-xs text-gray-500">
                            ≈{" "}
                            {currencyCode === "USD"
                              ? format(Number(payment.amountUsd), {
                                  showSymbol: true,
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : Formatter.formatCurrencyKH(
                                  Number(payment.amountUsd),
                                )}{" "}
                          </div>
                        )}
                        {payment.currency === "USD" && (
                          <div className="text-xs text-gray-500">
                            ≈{" "}
                            {currencyCode === "USD"
                              ? Formatter.formatCurrencyKH(
                                  Number(payment.amount) * exchangeRate,
                                )
                              : `$${(
                                  Number(payment.amount) / exchangeRate
                                ).toFixed(2)}`}{" "}
                          </div>
                        )}
                      </div>
                    </div>
                    <BasicMenuAction
                      value={payment}
                      onAdd={idx === payments.length - 1 ? onAdd : undefined}
                      onDelete={
                        payments.length > 1 ? () => onDelete(idx) : undefined
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-3">
          <div className="flex flex-col w-full gap-3">
            {type_pos !== "CINEMA" ? (
              <></>
            ) : (
              <div className="flex flex-row gap-3 items-center">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={print}
                    onCheckedChange={(c) => setPrint(!!c)}
                    id="print-invoice"
                  />{" "}
                  <Label htmlFor="print-invoice">Print invoice</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={printT}
                    onCheckedChange={(c) => setPrintT(!!c)}
                    id="print-ticket"
                  />{" "}
                  <Label htmlFor="print-ticket">Print Ticket</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={digitalT}
                    onCheckedChange={(c) => setDigitalT(!!c)}
                    id="digital-ticket"
                  />{" "}
                  <Label htmlFor="digital-ticket">Digital Ticket</Label>
                </div>
              </div>
            )}
            <div>
              <Button
                type="submit"
                className="w-full h-10"
                disabled={
                  customerReceived < (totalOrder || 0) ||
                  payments.some(
                    (p) => !p.paymentMethod || p.paymentMethod === "",
                  )
                }
                onClick={() => {
                  // Calculate how much each payment is used
                  let remainingTotal = totalOrder || 0;
                  const processedPayments = payments.map((payment) => {
                    const paymentAmountUsd = Number(payment.amountUsd);
                    const usedAmount = Math.min(
                      paymentAmountUsd,
                      remainingTotal,
                    );
                    remainingTotal = Math.max(
                      0,
                      remainingTotal - paymentAmountUsd,
                    );

                    return {
                      ...payment,
                      exchangeRate: exchangeRate.toString(),
                      used: usedAmount.toString(),
                    };
                  });

                  close({
                    payment: processedPayments,
                    isPrint: print,
                    printTicket: printT,
                    digitalTicket: digitalT,
                  });
                }}
              >
                {remainingBalance > 0 ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Payment Incomplete
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete Payment
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </>
    );
  },
  {
    defaultValue: {
      payment: [],
      isPrint: true,
      printTicket: false,
      digitalTicket: false,
    },
    className: "max-w-[600px]",
  },
);
