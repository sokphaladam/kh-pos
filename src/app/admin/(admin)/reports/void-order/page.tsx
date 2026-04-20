"use client";

import { useQueryVoidedOrderReport } from "@/app/hooks/user-query-report";
import { VoidOrderReportResponse } from "./types";
import { endOfDay, startOfDay } from "date-fns";
import moment from "moment-timezone";
import { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { AlertTriangle, FileX } from "lucide-react";
import { onGetExportExcel } from "@/lib/export-xlsx";

// New consistent components
import { ReportPageLayout } from "@/components/report/report-page-layout";
import { ReportHeader } from "@/components/report/report-header";
import { ReportErrorState } from "@/components/report/report-error-state";
import { ReportDataSection } from "@/components/report/report-data-section";

// Report-specific components
import { VoidOrderTable, VoidOrderSummary } from "./components";

export default function VoidOrderReportPage() {
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
      endDate: dateRange.to
        ? `${moment(dateRange.to).format("YYYY-MM-DD")} 23:59:59`
        : "",
    };
  }, [dateRange]);

  const { data, isLoading, mutate, error } = useQueryVoidedOrderReport(
    filterParams
  ) as {
    data: VoidOrderReportResponse | undefined;
    isLoading: boolean;
    mutate: () => void;
    error: Error | undefined;
  };

  const reportData = data?.result || [];
  const hasData = reportData.length > 0;

  const handleRefresh = () => {
    mutate();
  };

  const handleExportToExcel = async () => {
    if (!hasData) {
      alert("No data to export");
      return;
    }

    // Transform data for Excel export
    const excelData = reportData.map((item) => {
      const amountFromPrintLog =
        item.priceFromPrintLog * Number(item.qtyFromPrintLog || 0);
      const amountActual = item.actualPrice * item.actualQty;
      return {
        Invoice: item.invoice.toString(),
        "Item Name": item.content.at(6).value || "N/A",
        "Checked Out By":
          item.payments && item.payments.length > 0
            ? item.payments.at(0)?.createdBy?.fullname || "N/A"
            : "N/A",
        "Printed At": item.printedAt
          ? moment(item.printedAt).format("YYYY-MM-DD HH:mm:ss")
          : "N/A",
        "Qty From Print Log": item.qtyFromPrintLog ?? "N/A",
        "Amount From Print Log": amountFromPrintLog.toFixed(2),
        "Actual Qty": item.actualQty,
        "Actual Amount": amountActual.toFixed(2),
        "Qty Discrepancy":
          item.qtyFromPrintLog !== null
            ? Math.abs(item.qtyFromPrintLog - item.actualQty)
            : 0,
        "Price Discrepancy": Number(
          Math.abs(amountFromPrintLog - amountActual).toFixed(2)
        ),
        Status: item.status,
      };
    });

    const filename = `Void-Order-Report-${moment(dateRange.from).format(
      "YYYY-MM-DD"
    )}-to-${moment(dateRange.to).format("YYYY-MM-DD")}-${Date.now()}`;

    await onGetExportExcel(excelData, filename, "Void Order Report");
  };

  return (
    <ReportPageLayout>
      {/* Header Section */}
      <ReportHeader
        title="Void Order Report"
        description="Track and analyze voided orders and printing discrepancies"
        icon={AlertTriangle}
        iconBgColor="bg-red-100"
        iconColor="text-red-600"
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onRefresh={handleRefresh}
        onExport={hasData ? handleExportToExcel : undefined}
        isLoading={isLoading}
        hasData={hasData}
      />

      {/* Error State */}
      <ReportErrorState
        error={error}
        onRetry={handleRefresh}
        title="Error loading void order data"
        description="Failed to fetch void order report data"
      />

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading void order data...</span>
            </div>
          </div>
        </div>
      )}

      {/* Data Display */}
      {!isLoading && !error && (
        <>
          {/* Summary Cards */}
          {hasData && <VoidOrderSummary data={reportData} />}

          {/* Data Table */}
          <ReportDataSection
            title="Void Order Details"
            icon={FileX}
            iconColor="text-red-600"
            recordCount={reportData.length}
            recordLabel="issues"
          >
            <VoidOrderTable data={reportData} />
          </ReportDataSection>
        </>
      )}
    </ReportPageLayout>
  );
}
