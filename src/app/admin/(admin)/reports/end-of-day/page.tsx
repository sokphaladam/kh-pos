"use client";

import { useQueryEndOfDayReport } from "@/app/hooks/report/use-query-end-of-day-report";
import { ReportDataSection } from "@/components/report/report-data-section";
import { ReportHeader } from "@/components/report/report-header";
import { ReportPageLayout } from "@/components/report/report-page-layout";
import { ReportErrorState } from "@/components/report/report-error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthentication } from "contexts/authentication-context";
import { endOfDay, format, startOfDay } from "date-fns";
import moment from "moment-timezone";
import { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import {
  Calendar,
  DollarSign,
  ShoppingCart,
  CreditCard,
  Users,
  Tag,
  Percent,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { EndOfDayPrint } from "./end-of-day-print";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

export default function EndofDayReportPage() {
  const { currentWarehouse } = useAuthentication();
  const { formatForDisplay } = useCurrencyFormat();
  const [showPrint, setShowPrint] = useState(false);
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(today),
    to: endOfDay(today),
  });

  const filterParams = useMemo(() => {
    return {
      startDate: dateRange.from
        ? moment(dateRange.from).format("YYYY-MM-DD")
        : "",
      endDate: dateRange.to ? moment(dateRange.to).format("YYYY-MM-DD") : "",
      warehouseId: currentWarehouse?.id || "",
    };
  }, [dateRange, currentWarehouse]);

  const { data, isLoading, mutate, error } =
    useQueryEndOfDayReport(filterParams);

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "MMM dd, yyyy");
  };

  const renderSummaryCard = (
    title: string,
    value: string | number,
    subtitle: string,
    Icon: React.ElementType,
    colorClass: string = "text-blue-600",
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );

  const renderDataTable = (
    data: Record<string, { qty: number; amount: number }>,
    title: string,
    showQuantity: boolean = true,
  ) => {
    const entries = Object.entries(data || {});
    if (entries.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No data available for {title.toLowerCase()}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid gap-4">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">
                  {key === "dine_in" ? "Walk In" : key}
                </div>
                {showQuantity && (
                  <div className="text-sm text-gray-500">
                    {value.qty} transaction{value.qty !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold text-lg">
                  {formatForDisplay(value.amount)}
                </div>
                {showQuantity && <Badge variant="secondary">{value.qty}</Badge>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ReportPageLayout>
      <div className="sticky top-0 z-10">
        <ReportHeader
          title="End of Day Sales Report"
          description={`Sales summary for ${formatDate(dateRange.from)} ${
            dateRange.to &&
            dateRange.from?.toDateString() !== dateRange.to.toDateString()
              ? `to ${formatDate(dateRange.to)}`
              : ""
          }`}
          icon={Calendar}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onRefresh={() => mutate()}
          isLoading={isLoading}
          hasData={!!data?.result}
          onExport={() => {
            setShowPrint(true);
          }}
        />
      </div>

      {!isLoading && !data?.result && (
        <ReportErrorState
          title="No Data Available"
          description="No sales data found for the selected date range."
          onRetry={mutate}
          error={error instanceof Error ? error : undefined}
        />
      )}

      {data?.result && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {renderSummaryCard(
              "Total Sales",
              formatForDisplay(data.result.totalSale),
              "Gross revenue",
              DollarSign,
              "text-green-600",
            )}
            {renderSummaryCard(
              "Transactions",
              data.result.transactionCount,
              "Total orders",
              ShoppingCart,
              "text-blue-600",
            )}
            {renderSummaryCard(
              "Avg. Order Value",
              data.result.transactionCount > 0
                ? formatForDisplay(
                    data.result.totalSale / data.result.transactionCount,
                  )
                : formatForDisplay(0),
              "Per transaction",
              TrendingUp,
              "text-purple-600",
            )}
            {renderSummaryCard(
              "Total Discounts",
              formatForDisplay(
                Object.values(data.result.discountSummary || {})
                  .filter((item, index, arr) => index < arr.length - 1) // Exclude "Total" entry
                  .reduce((sum, item) => sum + item.amount, 0),
              ),
              "Given to customers",
              Percent,
              "text-orange-600",
            )}
          </div>

          {/* Payment Methods Summary */}
          <ReportDataSection
            title="Payment Methods"
            icon={CreditCard}
            iconColor="text-green-600"
            recordCount={Object.keys(data.result.paymentSummary || {}).length}
            recordLabel="methods"
          >
            {renderDataTable(data.result.paymentSummary, "Payment Methods")}
          </ReportDataSection>

          {/* Order Types Summary */}
          <ReportDataSection
            title="Service Types"
            icon={Tag}
            iconColor="text-purple-600"
            recordCount={Object.keys(data.result.servedSummary || {}).length}
            recordLabel="types"
          >
            {renderDataTable(data.result.servedSummary, "Service Types")}
          </ReportDataSection>

          {/* Category Performance */}
          <ReportDataSection
            title="Category Performance"
            icon={BarChart3}
            iconColor="text-blue-600"
            recordCount={Object.keys(data.result.categorySummary || {}).length}
            recordLabel="categories"
          >
            {renderDataTable(data.result.categorySummary, "Categories")}
          </ReportDataSection>

          {/* Discounts Summary */}
          {Object.keys(data.result.discountSummary || {}).length > 0 && (
            <ReportDataSection
              title="Discounts Applied"
              icon={Percent}
              iconColor="text-orange-600"
              recordCount={
                Object.keys(data.result.discountSummary || {}).length - 1
              } // Subtract 1 for "Total" entry
              recordLabel="discount types"
            >
              {renderDataTable(
                Object.fromEntries(
                  Object.entries(data.result.discountSummary || {}).filter(
                    ([key]) => key !== "Total",
                  ),
                ),
                "Discounts",
              )}
            </ReportDataSection>
          )}

          {/* Top Customers */}
          <ReportDataSection
            title="Customer Summary"
            icon={Users}
            iconColor="text-indigo-600"
            recordCount={Object.keys(data.result.customerSummary || {}).length}
            recordLabel="customers"
          >
            <div className="space-y-4">
              {Object.entries(data.result.customerSummary || {})
                .sort(([, a], [, b]) => b.amount - a.amount)
                .slice(0, 10) // Show top 10 customers
                .map(([customerName, data]) => (
                  <div
                    key={customerName}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{customerName}</div>
                      <div className="text-sm text-gray-500">
                        {data.qty} order{data.qty !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {formatForDisplay(data.amount)}
                      </div>
                      <Badge variant="secondary">{data.qty}</Badge>
                    </div>
                  </div>
                ))}
              {Object.keys(data.result.customerSummary || {}).length > 10 && (
                <div className="text-center text-sm text-gray-500 pt-4">
                  Showing top 10 customers out of{" "}
                  {Object.keys(data.result.customerSummary || {}).length} total
                </div>
              )}
            </div>
          </ReportDataSection>

          {/* Summary Footer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Report Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatForDisplay(data.result.totalSale)}
                  </div>
                  <div className="text-sm text-gray-500">Total Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.result.transactionCount}
                  </div>
                  <div className="text-sm text-gray-500">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {data.result.transactionCount > 0
                      ? formatForDisplay(
                          data.result.totalSale / data.result.transactionCount,
                        )
                      : formatForDisplay(0)}
                  </div>
                  <div className="text-sm text-gray-500">Average Order</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      {showPrint && data?.result && (
        <EndOfDayPrint
          data={data.result}
          onPrintComplete={() => setShowPrint(false)}
        />
      )}
    </ReportPageLayout>
  );
}
