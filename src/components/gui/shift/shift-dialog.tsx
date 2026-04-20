import {
  requestShiftReceipt,
  useCloseShift,
  useOpenShift,
} from "@/app/hooks/use-query-shift";
import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MaterialInput } from "@/components/ui/material-input";
import { ResponseType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuthentication } from "contexts/authentication-context";
import { produce } from "immer";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Clock,
  DollarSign,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export const shiftDialog = createDialog<
  { status: "OPEN" | "CLOSE"; id?: string },
  string
>(
  ({ status, close, id }) => {
    const [loading, setLoading] = useState(true);
    const { setting, currencyCode } = useAuthentication();
    const [cashInput, setCashInput] = useState({
      usd: "0",
      khr: "0",
    });
    const [cashExpect, setCashExpect] = useState({
      usd: "0",
      khr: "0",
    });
    const { trigger: openShift, isMutating: isOpening } = useOpenShift();
    const { trigger: closeShift, isMutating: isClosing } = useCloseShift();

    const exchangeRate = Number(
      !setting?.isLoading && setting?.data?.result
        ? setting.data?.result?.find((f) => f.option === "EXCHANGE_RATE")?.value
        : "4100"
    );

    useEffect(() => {
      if (id && loading) {
        requestShiftReceipt(id)
          .then((res) => {
            console.log(res.result);
            const input = {
              usd:
                res.result?.closedCashUsd !== undefined
                  ? res.result.closedCashUsd.toFixed(2)
                  : "0",
              khr:
                res.result?.closedCashKhr !== undefined
                  ? currencyCode === 'USD' ? res.result.closedCashKhr.toFixed(0) : res.result.closedCashKhr.toFixed(2)
                  : "0",
            };
            setCashInput(input);
            setCashExpect(input);
            setLoading(false);
          })
          .catch();
      }
    }, [loading, id, currencyCode]);

    const onOpen = useCallback(async () => {
      const result: ResponseType<string> = await openShift({
        openedCashUsd: Number(cashInput.usd || 0),
        openedCashKhr: Number(cashInput.khr || 0),
        exchangeRate,
      });

      if (result.success) {
        toast.success("Shift opened");
        close(result.result || "");
      } else {
        toast.error("Failed to open shift.");
      }
    }, [cashInput.khr, cashInput.usd, close, openShift, exchangeRate]);

    const onClose = useCallback(async () => {
      if (id) {
        const result: ResponseType<boolean> = await closeShift({
          actualCashUsd: Number(cashInput.usd || 0),
          actualCashKhr: Number(cashInput.khr || 0),
          shiftId: id,
        });

        if (result.success) {
          toast.success("Shift closed");
          close("CLOSE");
        } else {
          toast.error("Failed to close shift.");
        }
      }
    }, [cashInput.khr, cashInput.usd, close, closeShift, id]);

    if (setting?.isLoading || setting?.isValidating) {
      return (
        <>
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-primary" />
              {status === "OPEN" ? "Open" : "Close"} Shift
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading shift details...
              </p>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5 text-primary" />
            {status === "OPEN" ? "Open" : "Close"} Shift
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Exchange Rate Display */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-950/50 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-700 dark:text-blue-300">
                Exchange Rate:
              </span>
              <span className="font-mono font-semibold text-blue-800 dark:text-blue-200">
                1 USD = {exchangeRate.toLocaleString()} KHR
              </span>
            </div>
          </div>

          {/* Cash Input Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {status === "OPEN" ? "Starting Cash Amount" : "Cash Count"}
            </h3>

            {/* USD Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>
                  {currencyCode === "USD"
                    ? "US Dollar (USD)"
                    : "Cambodian Riel (KHR)"}
                </span>
              </div>

              <div
                className={cn("grid gap-4", id ? "grid-cols-2" : "grid-cols-1")}
              >
                {id && (
                  <div className="space-y-1">
                    {/* <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Expected Amount
                    </label> */}
                    <MaterialInput
                      label={
                        currencyCode === "USD" ? "Expected USD" : "Expected KHR"
                      }
                      value={cashExpect.usd}
                      readOnly
                      disabled
                      variant="standard"
                      className="bg-gray-50 dark:bg-gray-900"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  {/* <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {id ? "Actual Amount" : "Starting Amount"}
                  </label> */}
                  <MaterialInput
                    label={
                      id
                        ? currencyCode === "USD"
                          ? "Actual USD"
                          : "Actual KHR"
                        : currencyCode === "USD"
                        ? "Starting USD"
                        : "Starting KHR"
                    }
                    placeholder={currencyCode === "USD" ? "0.00" : "0"}
                    variant="standard"
                    value={cashInput.usd}
                    onChange={(e) => {
                      setCashInput(
                        produce((draft) => {
                          draft.usd = e.target.value;
                        })
                      );
                    }}
                    type="number"
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
            </div>

            {/* KHR Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>
                  {currencyCode === "USD"
                    ? "Cambodian Riel (KHR)"
                    : "US Dollar (USD)"}
                </span>
              </div>

              <div
                className={cn("grid gap-4", id ? "grid-cols-2" : "grid-cols-1")}
              >
                {id && (
                  <div className="space-y-1">
                    {/* <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Expected Amount
                    </label> */}
                    <MaterialInput
                      label={
                        currencyCode === "USD" ? "Expected KHR" : "Expected USD"
                      }
                      value={cashExpect.khr}
                      readOnly
                      disabled
                      variant="standard"
                      className="bg-gray-50 dark:bg-gray-900"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  {/* <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {id ? "Actual Amount" : "Starting Amount"}
                  </label> */}
                  <MaterialInput
                    label={
                      id
                        ? currencyCode === "USD"
                          ? "Actual KHR"
                          : "Actual USD"
                        : currencyCode === "USD"
                        ? "Starting KHR"
                        : "Starting USD"
                    }
                    placeholder={currencyCode === "USD" ? "0.00" : "0"}
                    variant="standard"
                    value={cashInput.khr}
                    onChange={(e) => {
                      setCashInput(
                        produce((draft) => {
                          draft.khr = e.target.value;
                        })
                      );
                    }}
                    type="number"
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
            </div>

            {/* Discrepancy Warning for Close Shift */}
            {id &&
              (() => {
                const usdDiff = Math.abs(
                  Number(cashInput.usd) - Number(cashExpect.usd)
                );
                const khrDiff = Math.abs(
                  Number(cashInput.khr) - Number(cashExpect.khr)
                );
                const hasDiscrepancy = usdDiff > 0.01 || khrDiff > 1;

                if (hasDiscrepancy) {
                  return (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Cash Discrepancy Detected
                        </p>
                        <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                          {usdDiff > 0.01 && (
                            <div>
                              {currencyCode === "USD"
                                ? `USD difference: $${usdDiff.toFixed(2)}`
                                : `KHR difference: ${usdDiff.toLocaleString()} ៛`}
                            </div>
                          )}
                          {khrDiff > 1 && (
                            <div>
                              {currencyCode === "USD"
                                ? `KHR difference: ${khrDiff.toLocaleString()} ៛`
                                : `USD difference: $${khrDiff.toFixed(2)}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button
            onClick={status === "OPEN" ? onOpen : onClose}
            disabled={isOpening || isClosing}
            className="w-full h-10 font-medium"
            size="default"
          >
            {isOpening || isClosing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {status === "OPEN" ? "Opening..." : "Closing..."}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {status === "OPEN" ? "Open Shift" : "Close Shift"}
              </>
            )}
          </Button>
        </DialogFooter>
      </>
    );
  },
  { defaultValue: "" }
);
