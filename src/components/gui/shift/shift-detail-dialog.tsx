import { ShiftType } from "@/app/api/shift/route";
import { createDialog } from "@/components/create-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  User,
  Users,
  Wallet,
} from "lucide-react";
import moment from "moment-timezone";

export const shiftDetailDialog = createDialog<ShiftType, unknown>(
  (data) => {
    const { currencyCode, formatForDisplay } = useCurrencyFormat();
    if (!data) {
      return (
        <>
          <DialogHeader>
            <DialogTitle>Shift Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="mr-2 h-5 w-5" />
            No shift data available
          </div>
        </>
      );
    }

    const exchangeRate = Number(data.exchange_rate || "4100");
    const openedCashUsd = Number(data.opened_cash_usd || 0);
    const openedCashKhr = Number(data.opened_cash_khr || 0);
    const closedCashUsd = Number(data.closed_cash_usd || 0);
    const closedCashKhr = Number(data.closed_cash_khr || 0);
    const actualCashUsd = Number(data.actual_cash_usd || 0);
    const actualCashKhr = Number(data.actual_cash_khr || 0);

    const varianceUsd = actualCashUsd - closedCashUsd;
    const varianceKhr = actualCashKhr - closedCashKhr;

    const isOpen = data.status === "OPEN";

    // Parse receipt data
    const receipt = data.receipt || {};
    const amountByMethod = receipt.amountByMethod || {};
    const paymentMethods = Object.keys(amountByMethod);
    const bankPayments = paymentMethods.filter((f) => f !== "CASH");

    return (
      <>
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-primary" />
              Shift Details
            </DialogTitle>
            <Badge
              className={cn(
                "text-xs font-medium",
                isOpen
                  ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300"
              )}
            >
              {isOpen ? (
                <>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Active
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Closed
                </>
              )}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          {/* Shift Information Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Shift Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Exchange Rate</p>
                  <p className="text-sm font-medium">
                    1 USD = {exchangeRate.toLocaleString()} KHR
                  </p>
                </div>
              </div>

              <Separator />

              {/* Opened Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Opened
                </div>
                <div className="grid grid-cols-2 gap-4 pl-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Date & Time</p>
                    <p className="text-sm">
                      {data.opened_at
                        ? moment(data.opened_at).format("MMM DD, YYYY HH:mm")
                        : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Opened By</p>
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-sm">
                        {data.opened_by?.fullname || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {!isOpen && (
                <>
                  <Separator />

                  {/* Closed Information */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Closed
                    </div>
                    <div className="grid grid-cols-2 gap-4 pl-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Date & Time
                        </p>
                        <p className="text-sm">
                          {data.closed_at
                            ? moment(data.closed_at).format(
                                "MMM DD, YYYY HH:mm"
                              )
                            : "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Closed By
                        </p>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-sm">
                            {data.closed_by?.fullname || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Duration */}
                  <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 px-3 py-2 rounded-lg">
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      Duration
                    </span>
                    <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                      {data.opened_at && data.closed_at
                        ? moment(data.closed_at).diff(
                            moment(data.opened_at),
                            "hours",
                            true
                          ) >= 1
                          ? `${moment(data.closed_at).diff(
                              moment(data.opened_at),
                              "hours"
                            )} hours`
                          : `${moment(data.closed_at).diff(
                              moment(data.opened_at),
                              "minutes"
                            )} minutes`
                        : "N/A"}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cash Flow Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                Cash Flow
              </CardTitle>
              <CardDescription className="text-xs">
                Starting and ending cash amounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Opening Cash */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ArrowRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                  Opening Cash
                </div>
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-green-700 dark:text-green-300">
                        {currencyCode === "USD" ? "USD" : "KHR"}
                      </span>
                      {currencyCode === "USD" ? (
                        <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      ) : (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          ៛
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-green-800 dark:text-green-200">
                      {formatForDisplay(openedCashUsd)}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-green-700 dark:text-green-300">
                        {currencyCode === "USD" ? "KHR" : "USD"}
                      </span>
                      {currencyCode === "USD" ? (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          ៛
                        </span>
                      ) : (
                        <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <p className="text-lg font-bold text-green-800 dark:text-green-200">
                      {openedCashKhr.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {!isOpen && (
                <>
                  <Separator />

                  {/* Expected Closing Cash */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      Expected Closing Cash
                    </div>
                    <div className="grid grid-cols-2 gap-3 pl-6">
                      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-blue-700 dark:text-blue-300">
                            {currencyCode === "USD" ? "USD" : "KHR"}
                          </span>
                          <DollarSign className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                          {formatForDisplay(closedCashUsd)}
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-blue-700 dark:text-blue-300">
                            {currencyCode === "USD" ? "KHR" : "USD"}
                          </span>
                          {currencyCode === "USD" ? (
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              ៛
                            </span>
                          ) : (
                            <DollarSign className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                          {closedCashKhr.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Actual Closing Cash */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      Actual Closing Cash
                    </div>
                    <div className="grid grid-cols-2 gap-3 pl-6">
                      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-purple-700 dark:text-purple-300">
                            {currencyCode === "USD" ? "USD" : "KHR"}
                          </span>
                          <DollarSign className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
                          {formatForDisplay(actualCashUsd)}
                        </p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-purple-700 dark:text-purple-300">
                            {currencyCode === "USD" ? "KHR" : "USD"}
                          </span>
                          {currencyCode === "USD" ? (
                            <span className="text-xs text-purple-600 dark:text-purple-400">
                              ៛
                            </span>
                          ) : (
                            <DollarSign className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          )}
                        </div>
                        <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
                          {actualCashKhr.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Variance */}
                  {(varianceUsd !== 0 || varianceKhr !== 0) && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <AlertCircle
                            className={cn(
                              "h-4 w-4",
                              varianceUsd < 0 || varianceKhr < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-amber-600 dark:text-amber-400"
                            )}
                          />
                          Variance (Actual - Expected)
                        </div>
                        <div className="grid grid-cols-2 gap-3 pl-6">
                          <div
                            className={cn(
                              "rounded-lg p-3 border",
                              varianceUsd < 0
                                ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                                : varianceUsd > 0
                                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                                : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={cn(
                                  "text-xs",
                                  varianceUsd < 0
                                    ? "text-red-700 dark:text-red-300"
                                    : varianceUsd > 0
                                    ? "text-amber-700 dark:text-amber-300"
                                    : "text-gray-700 dark:text-gray-300"
                                )}
                              >
                                {currencyCode === "USD" ? "USD" : "KHR"}
                              </span>
                              {currencyCode === "USD" ? (
                                <DollarSign
                                  className={cn(
                                    "h-3.5 w-3.5",
                                    varianceUsd < 0
                                      ? "text-red-600 dark:text-red-400"
                                      : varianceUsd > 0
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-gray-600 dark:text-gray-400"
                                  )}
                                />
                              ) : (
                                <span
                                  className={cn(
                                    "text-xs",
                                    varianceKhr < 0
                                      ? "text-red-600 dark:text-red-400"
                                      : varianceKhr > 0
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-gray-600 dark:text-gray-400"
                                  )}
                                >
                                  ៛
                                </span>
                              )}
                            </div>
                            <p
                              className={cn(
                                "text-lg font-bold",
                                varianceUsd < 0
                                  ? "text-red-800 dark:text-red-200"
                                  : varianceUsd > 0
                                  ? "text-amber-800 dark:text-amber-200"
                                  : "text-gray-800 dark:text-gray-200"
                              )}
                            >
                              {varianceUsd > 0 && "+"}
                              {formatForDisplay(varianceUsd)}
                            </p>
                          </div>
                          <div
                            className={cn(
                              "rounded-lg p-3 border",
                              varianceKhr < 0
                                ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                                : varianceKhr > 0
                                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                                : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={cn(
                                  "text-xs",
                                  varianceKhr < 0
                                    ? "text-red-700 dark:text-red-300"
                                    : varianceKhr > 0
                                    ? "text-amber-700 dark:text-amber-300"
                                    : "text-gray-700 dark:text-gray-300"
                                )}
                              >
                                {currencyCode === "USD" ? "KHR" : "USD"}
                              </span>
                              {currencyCode === "USD" ? (
                                <DollarSign
                                  className={cn(
                                    "h-3.5 w-3.5",
                                    varianceUsd < 0
                                      ? "text-red-600 dark:text-red-400"
                                      : varianceUsd > 0
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-gray-600 dark:text-gray-400"
                                  )}
                                />
                              ) : (
                                <span
                                  className={cn(
                                    "text-xs",
                                    varianceKhr < 0
                                      ? "text-red-600 dark:text-red-400"
                                      : varianceKhr > 0
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-gray-600 dark:text-gray-400"
                                  )}
                                >
                                  ៛
                                </span>
                              )}
                            </div>
                            <p
                              className={cn(
                                "text-lg font-bold",
                                varianceKhr < 0
                                  ? "text-red-800 dark:text-red-200"
                                  : varianceKhr > 0
                                  ? "text-amber-800 dark:text-amber-200"
                                  : "text-gray-800 dark:text-gray-200"
                              )}
                            >
                              {varianceKhr > 0 && "+"}
                              {varianceKhr.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods Card - Only show for closed shifts with receipt data */}
          {receipt && receipt.amountByMethod && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Payment Methods
                </CardTitle>
                <CardDescription className="text-xs">
                  Total payments: {receipt.payments || 0}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentMethods.map((method, index) => {
                  const methodData = amountByMethod[method];
                  return (
                    <div key={method}>
                      {index > 0 && <Separator />}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-sm font-medium">
                              {method}
                            </span>
                            {methodData.qty && (
                              <Badge variant="secondary" className="text-xs">
                                {methodData.qty}{" "}
                                {methodData.qty === 1
                                  ? "transaction"
                                  : "transactions"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pl-4">
                          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                            <span className="text-xs text-muted-foreground">
                              {currencyCode === "USD" ? "USD" : "KHR"}
                            </span>
                            <span className="text-sm font-semibold">
                              {formatForDisplay(Number(methodData.usd || 0))}
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                            <span className="text-xs text-muted-foreground">
                              {currencyCode === "USD" ? "KHR" : "USD"}
                            </span>
                            <span className="text-sm font-semibold">
                              {currencyCode === "USD"
                                ? formatForDisplay(Number(methodData.khr || 0))
                                : `$${Number(
                                    methodData.khr || 0
                                  ).toLocaleString()}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Sales & Statistics Card - Only show for closed shifts */}
          {receipt && receipt && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Sales & Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {/* Sales */}
                  {receipt.sales !== undefined && (
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-1">
                        <ShoppingCart className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        <span className="text-xs text-green-700 dark:text-green-300">
                          Total Sales
                        </span>
                      </div>
                      <p className="text-lg font-bold text-green-800 dark:text-green-200">
                        {formatForDisplay(Number(receipt.sales || 0))}
                      </p>
                    </div>
                  )}

                  {/* Returns */}
                  {receipt.amountReturned !== undefined && (
                    <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 mb-1">
                        <RotateCcw className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        <span className="text-xs text-red-700 dark:text-red-300">
                          Returns
                        </span>
                      </div>
                      <p className="text-lg font-bold text-red-800 dark:text-red-200">
                        {formatForDisplay(Number(receipt.amountReturned || 0))}
                      </p>
                    </div>
                  )}

                  {/* Total Customers */}
                  {receipt.totalCustomer !== undefined && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-blue-700 dark:text-blue-300">
                          Total Customers
                        </span>
                      </div>
                      <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                        {Number(receipt.totalCustomer || 0)}
                      </p>
                    </div>
                  )}

                  {/* Average Spending */}
                  {receipt.avgCustomer !== undefined && (
                    <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs text-purple-700 dark:text-purple-300">
                          Avg. Spending
                        </span>
                      </div>
                      <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
                        {formatForDisplay(Number(receipt.avgCustomer || 0))}
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional Stats */}
                {(receipt.orders || receipt.amountByMethod) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        Other Statistics
                      </div>
                      <div className="grid grid-cols-2 gap-3 pl-6">
                        {receipt.orders && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Qty. of bills
                            </span>
                            <span className="text-sm font-semibold">
                              {receipt.orders}
                            </span>
                          </div>
                        )}
                        {amountByMethod && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Card slips
                            </span>
                            <span className="text-sm font-semibold">
                              {bankPayments.reduce(
                                (total, method) =>
                                  total + (amountByMethod[method]?.qty || 0),
                                0
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </>
    );
  },
  { defaultValue: null }
);
