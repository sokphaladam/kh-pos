"use client";

import { useQuerySaleItemReport } from "@/app/hooks/report/use-query-sale-item-report";
import {
  ReportErrorState,
  ReportHeader,
  ReportPageLayout,
} from "@/components/report";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { endOfDay, format, startOfDay } from "date-fns";
import { Calendar, ShoppingCart, Hash, TrendingUp } from "lucide-react";
import moment from "moment-timezone";
import { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { SaleItemPrint } from "./sale-item-print";

export default function SaleItemReportPage() {
  const [showPrint, setShowPrint] = useState(false);
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(today),
    to: endOfDay(today),
  });
  const { formatForDisplay } = useCurrencyFormat();

  const filterParams = useMemo(() => {
    return {
      startDate: dateRange.from
        ? moment(dateRange.from).format("YYYY-MM-DD")
        : "",
      endDate: dateRange.to ? moment(dateRange.to).format("YYYY-MM-DD") : "",
    };
  }, [dateRange]);

  const { data, isLoading, mutate, error } = useQuerySaleItemReport(
    filterParams.startDate,
    filterParams.endDate + " 23:59:59",
  );

  const items = useMemo(() => data?.result ?? [], [data]);

  const summary = useMemo(() => {
    return {
      totalItems: items.length,
      totalQty: items.reduce((s, r) => s + r.qty, 0),
      totalDiscount: items.reduce((s, r) => s + r.discount_amount, 0),
      totalRevenue: items.reduce((s, r) => s + r.total_amount, 0),
    };
  }, [items]);

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "MMM dd, yyyy");
  };

  const statCards = [
    {
      label: "Total Items",
      value: summary.totalItems.toLocaleString(),
      icon: ShoppingCart,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Qty Sold",
      value: summary.totalQty.toLocaleString(),
      icon: Hash,
      bg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      label: "Total Revenue",
      value: formatForDisplay(summary.totalRevenue),
      icon: TrendingUp,
      bg: "bg-green-50",
      iconColor: "text-green-600",
    },
  ];

  return (
    <ReportPageLayout>
      <div className="sticky top-0 z-10">
        <ReportHeader
          title="Sale Item Summary Report"
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

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <Skeleton className="mb-3 h-8 w-8 rounded-lg" />
              <Skeleton className="mb-2 h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div
                className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}
              >
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
              <p className="mt-0.5 text-xs text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div>
        {/* Table */}
        {isLoading ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3.5">
                  <Skeleton className="h-4 w-6 shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        ) : !data?.result ? (
          <ReportErrorState
            title="No Data Available"
            description="No sales data found for the selected date range."
            onRetry={mutate}
            error={error instanceof Error ? error : undefined}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
                Item Breakdown
              </h2>
              <span className="text-sm text-gray-500">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="w-10 text-center font-semibold text-gray-600">
                      #
                    </TableHead>
                    <TableHead className="select-none font-semibold text-gray-600">
                      Item Description
                    </TableHead>
                    <TableHead className="select-none text-right font-semibold text-gray-600">
                      Qty
                    </TableHead>
                    <TableHead className="select-none text-right font-semibold text-gray-600">
                      Total Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow
                      key={idx}
                      className="transition-colors hover:bg-blue-50/40"
                    >
                      <TableCell className="text-center text-sm text-gray-400">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-gray-700">
                        {item.qty.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-gray-900">
                        {formatForDisplay(item.total_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="border-t-2 border-blue-200 bg-blue-50 font-bold hover:bg-blue-50">
                    <TableCell />
                    <TableCell className="text-gray-700">Grand Total</TableCell>
                    <TableCell className="text-right tabular-nums text-gray-800">
                      {summary.totalQty.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-blue-700">
                      {formatForDisplay(summary.totalRevenue)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        {showPrint && data?.result && (
          <div>
            <SaleItemPrint
              data={data?.result || []}
              startDate={moment(dateRange.from).format("YYYY-MM-DD") ?? ""}
              endDate={moment(dateRange.to).format("YYYY-MM-DD") ?? ""}
              onPrintComplete={() => setShowPrint(false)}
            />
          </div>
        )}
      </div>
    </ReportPageLayout>
  );
}
