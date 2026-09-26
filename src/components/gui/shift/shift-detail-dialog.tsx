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
                  ? "bg-success/15 text-success hover:bg-success/15"
                  : "bg-muted text-foreground hover:bg-muted"
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
                <Calendar className="h-4 w-4 text-info" />
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
                <div className="flex items-center gap-2 text-sm font-medium text-success">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
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
                    <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                      <div className="w-2 h-2 bg-destructive rounded-full"></div>
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
                  <div className="flex items-center justify-between bg-info/10 px-3 py-2 rounded-lg">
                    <span className="text-sm text-info">
                      Duration
                    </span>
                    <span className="text-sm font-semibold text-info">
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
                <Wallet className="h-4 w-4 text-success" />
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
                  <ArrowRight className="h-4 w-4 text-success" />
                  Opening Cash
                </div>
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="bg-success/10 rounded-lg p-3 border border-success/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-success">
                        {currencyCode === "USD" ? "USD" : "KHR"}
                      </span>
                      {currencyCode === "USD" ? (
                        <DollarSign className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <span className="text-xs text-success">
                          ៛
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-success">
                      {formatForDisplay(openedCashUsd)}
                    </p>
                  </div>
                  <div className="bg-success/10 rounded-lg p-3 border border-success/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-success">
                        {currencyCode === "USD" ? "KHR" : "USD"}
                      </span>
                      {currencyCode === "USD" ? (
                        <span className="text-xs text-success">
                          ៛
                        </span>
                      ) : (
                        <DollarSign className="h-3.5 w-3.5 text-success" />
                      )}
                    </div>
                    <p className="text-lg font-bold text-success">
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
                      <TrendingUp className="h-4 w-4 text-info" />
                      Expected Closing Cash
                    </div>
                    <div className="grid grid-cols-2 gap-3 pl-6">
                      <div className="bg-info/10 rounded-lg p-3 border border-info/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-info">
                            {currencyCode === "USD" ? "USD" : "KHR"}
                          </span>
                          <DollarSign className="h-3.5 w-3.5 text-info" />
                        </div>
                        <p className="text-lg font-bold text-info">
                          {formatForDisplay(closedCashUsd)}
                        </p>
                      </div>
                      <div className="bg-info/10 rounded-lg p-3 border border-info/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-info">
                            {currencyCode === "USD" ? "KHR" : "USD"}
                          </span>
                          {currencyCode === "USD" ? (
                            <span className="text-xs text-info">
                              ៛
                            </span>
                          ) : (
                            <DollarSign className="h-3.5 w-3.5 text-info" />
                          )}
                        </div>
                        <p className="text-lg font-bold text-info">
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
                                ? "text-destructive"
                                : "text-warning"
                            )}
                          />
                          Variance (Actual - Expected)
                        </div>
                        <div className="grid grid-cols-2 gap-3 pl-6">
                          <div
                            className={cn(
                              "rounded-lg p-3 border",
                              varianceUsd < 0
                                ? "bg-destructive/10 border-destructive/20"
                                : varianceUsd > 0
                                ? "bg-warning/10 border-warning/20"
                                : "bg-muted/40 border-border"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={cn(
                                  "text-xs",
                                  varianceUsd < 0
                                    ? "text-destructive"
                                    : varianceUsd > 0
                                    ? "text-warning"
                                    : "text-foreground/80"
                                )}
                              >
                                {currencyCode === "USD" ? "USD" : "KHR"}
                              </span>
                              {currencyCode === "USD" ? (
                                <DollarSign
                                  className={cn(
                                    "h-3.5 w-3.5",
                                    varianceUsd < 0
                                      ? "text-destructive"
                                      : varianceUsd > 0
                                      ? "text-warning"
                                      : "text-muted-foreground"
                                  )}
                                />
                              ) : (
                                <span
                                  className={cn(
                                    "text-xs",
                                    varianceKhr < 0
                                      ? "text-destructive"
                                      : varianceKhr > 0
                                      ? "text-warning"
                                      : "text-muted-foreground"
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
                                  ? "text-destructive"
                                  : varianceUsd > 0
                                  ? "text-warning"
                                  : "text-foreground"
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
                                ? "bg-destructive/10 border-destructive/20"
                                : varianceKhr > 0
                                ? "bg-warning/10 border-warning/20"
                                : "bg-muted/40 border-border"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={cn(
                                  "text-xs",
                                  varianceKhr < 0
                                    ? "text-destructive"
                                    : varianceKhr > 0
                                    ? "text-warning"
                                    : "text-foreground/80"
                                )}
                              >
                                {currencyCode === "USD" ? "KHR" : "USD"}
                              </span>
                              {currencyCode === "USD" ? (
                                <DollarSign
                                  className={cn(
                                    "h-3.5 w-3.5",
                                    varianceUsd < 0
                                      ? "text-destructive"
                                      : varianceUsd > 0
                                      ? "text-warning"
                                      : "text-muted-foreground"
                                  )}
                                />
                              ) : (
                                <span
                                  className={cn(
                                    "text-xs",
                                    varianceKhr < 0
                                      ? "text-destructive"
                                      : varianceKhr > 0
                                      ? "text-warning"
                                      : "text-muted-foreground"
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
                                  ? "text-destructive"
                                  : varianceKhr > 0
                                  ? "text-warning"
                                  : "text-foreground"
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
                          <div className="flex items-center justify-between bg-muted/40 rounded-lg p-2">
                            <span className="text-xs text-muted-foreground">
                              {currencyCode === "USD" ? "USD" : "KHR"}
                            </span>
                            <span className="text-sm font-semibold">
                              {formatForDisplay(Number(methodData.usd || 0))}
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-muted/40 rounded-lg p-2">
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
                  <BarChart3 className="h-4 w-4 text-info" />
                  Sales & Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {/* Sales */}
                  {receipt.sales !== undefined && (
                    <div className="bg-success/10 rounded-lg p-3 border border-success/20">
                      <div className="flex items-center gap-2 mb-1">
                        <ShoppingCart className="h-3.5 w-3.5 text-success" />
                        <span className="text-xs text-success">
                          Total Sales
                        </span>
                      </div>
                      <p className="text-lg font-bold text-success">
                        {formatForDisplay(Number(receipt.sales || 0))}
                      </p>
                    </div>
                  )}

                  {/* Returns */}
                  {receipt.amountReturned !== undefined && (
                    <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/20">
                      <div className="flex items-center gap-2 mb-1">
                        <RotateCcw className="h-3.5 w-3.5 text-destructive" />
                        <span className="text-xs text-destructive">
                          Returns
                        </span>
                      </div>
                      <p className="text-lg font-bold text-destructive">
                        {formatForDisplay(Number(receipt.amountReturned || 0))}
                      </p>
                    </div>
                  )}

                  {/* Total Customers */}
                  {receipt.totalCustomer !== undefined && (
                    <div className="bg-info/10 rounded-lg p-3 border border-info/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-3.5 w-3.5 text-info" />
                        <span className="text-xs text-info">
                          Total Customers
                        </span>
                      </div>
                      <p className="text-lg font-bold text-info">
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
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                        <FileText className="h-4 w-4 text-muted-foreground" />
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
