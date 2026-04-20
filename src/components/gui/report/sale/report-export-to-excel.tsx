"use client";

import { SaleByCategoryReportRow } from "@/app/api/report/sale-by-category/sale-by-category";
import { Button } from "@/components/ui/button";
import { onGetExportExcel } from "@/lib/export-xlsx";
import { ResponseType } from "@/lib/types";
import { Download } from "lucide-react";
import moment from "moment-timezone";
import { DateRange } from "react-day-picker";

interface ReportProps {
  data: ResponseType<SaleByCategoryReportRow[]> | undefined;
  type: "sale-by-category" | "other-report-type";
  groupByProduct: boolean;
  dateRange: DateRange;
}

export function ReportExportToExcel({
  data,
  groupByProduct,
  dateRange,
}: ReportProps) {
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

  return (
    <Button
      onClick={handleExportToExcel}
      className="gap-2 bg-green-600 hover:bg-green-700"
      disabled={!reportData || reportData.length === 0}
      size={"sm"}
    >
      <Download className="h-4 w-4" />
      Export to Excel
    </Button>
  );
}
