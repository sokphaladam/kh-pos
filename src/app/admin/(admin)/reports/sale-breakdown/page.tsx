"use client";

import React, { useState, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { startOfDay, endOfDay } from "date-fns";
import { DateRangePicker } from "@/components/date-range-picker";
import { useQueryReportSaleBreakdownByCategory } from "@/app/hooks/report/use-query-sale-breakdown-bycategory-report";
import { SaleBreakdownTable, SaleBreakdownSkeleton } from "./components";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { onGetExportExcel } from "@/lib/export-xlsx";
import { SaleByCategoryReportRow } from "@/app/api/report/sale-by-category/sale-by-category";
import moment from "moment-timezone";
import { useAuthentication } from "../../../../../../contexts/authentication-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function SaleBreakdownReportPage() {
  const { currentWarehouse } = useAuthentication();
  const today = new Date();

  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(today),
    to: endOfDay(today),
  });
  const [groupByProduct, setGroupByProduct] = useState(true);

  const filterParams = useMemo(() => {
    return {
      startDate: dateRange.from
        ? moment(dateRange.from).format("YYYY-MM-DD")
        : "",
      endDate: dateRange.to ? moment(dateRange.to).format("YYYY-MM-DD") : "",
      warehouseId: currentWarehouse?.id || "",
      groupBy: groupByProduct ? ("product" as const) : ("time" as const),
    };
  }, [dateRange, currentWarehouse, groupByProduct]);

  const { data, isLoading, mutate } =
    useQueryReportSaleBreakdownByCategory(filterParams);

  const reportData = data?.result || [];

  const handleExportToExcel = async () => {
    if (!reportData || reportData.length === 0) {
      alert("No data to export");
      return;
    }

    // Transform data for Excel export
    const excelData = reportData.map((row: SaleByCategoryReportRow) => {
      const baseData: Record<string, unknown> = {
        Type:
          row.type === "total"
            ? "GRAND TOTAL"
            : row.type === "category"
            ? "Category Summary"
            : "Detail",
        "Product Code": row.productCode || "",
        "Product Name": row.type === "total" ? "" : row.name || "",
      };

      // Add orderedAt column when not grouping by product
      if (!groupByProduct) {
        baseData["Ordered At"] = row.orderedAt || "";
      }

      // Add remaining columns
      return {
        ...baseData,
        Quantity: row.totalQty,
        "Supply Price": Number(row.supplyPrice.toFixed(2)),
        "Total Price": Number(row.totalPrice.toFixed(2)),
        Modifier: Number(row.modifier.toFixed(2)),
        Discount: Number(row.discount.toFixed(2)),
        Revenue: Number(row.revenue.toFixed(2)),
        Profit: Number(row.profit.toFixed(2)),
      };
    });

    const filename = `Sale-Breakdown-Report-${moment(dateRange.from).format(
      "YYYY-MM-DD"
    )}-to-${moment(dateRange.to).format("YYYY-MM-DD")}-${Date.now()}`;

    await onGetExportExcel(
      excelData,
      filename,
      `Sale Breakdown From ${moment(dateRange.from).format(
        "YYYY-MM-DD"
      )}-to-${moment(dateRange.to).format("YYYY-MM-DD")}`,
      {
        boldRows: ["GRAND TOTAL", "Category Summary"],
        title: `Sale Breakdown Report From ${moment(dateRange.from).format(
          "YYYY-MM-DD"
        )} to ${moment(dateRange.to).format("YYYY-MM-DD")}`,
      }
    );
  };

  const handleRefresh = () => {
    mutate();
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      {/* Filters and Actions Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <DateRangePicker
                  dateRange={dateRange}
                  onChange={(range) => setDateRange(range)}
                  className="w-full sm:w-auto"
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="groupByProduct"
                    checked={groupByProduct}
                    onCheckedChange={(checked) =>
                      setGroupByProduct(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="groupByProduct"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Group by Product
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-end gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="gap-2"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={handleExportToExcel}
              className="gap-2 bg-green-600 hover:bg-green-700"
              disabled={isLoading || !reportData || reportData.length === 0}
            >
              <Download className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <SaleBreakdownSkeleton />
      ) : (
        <>
          {/* Table Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Detailed Breakdown
                </h2>
                <div className="text-sm text-gray-600">
                  {reportData.length}{" "}
                  {reportData.length === 1 ? "record" : "records"}
                </div>
              </div>
            </div>

            <div className="p-6">
              <SaleBreakdownTable data={reportData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
