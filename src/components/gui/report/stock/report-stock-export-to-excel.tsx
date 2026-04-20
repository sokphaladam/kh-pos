"use client";
import { StockReportRow } from "@/app/api/report/stock/stock-list";
import { Button } from "@/components/ui/button";
import { onGetExportExcel } from "@/lib/export-xlsx";
import { ResponseType } from "@/lib/types";
import { Download } from "lucide-react";
import moment from "moment-timezone";
import { DateRange } from "react-day-picker";

interface ReportProps {
  data: ResponseType<StockReportRow[]> | undefined;
  dateRange: DateRange;
}

export function StockReportExportToExcel({ data, dateRange }: ReportProps) {
  const reportData = data?.result || [];

  const handleExportToExcel = async () => {
    if (!reportData || reportData.length === 0) {
      alert("No data to export");
      return;
    }

    // Transform data for Excel export
    const excelData = reportData.map((row: StockReportRow) => {
      const baseData: Record<string, unknown> = {
        Type:
          row.type === "total"
            ? "GRAND TOTAL"
            : row.type === "category"
            ? "Category Summary"
            : row.type === "warehouse"
            ? "Branch Summary"
            : "Detail",
        "Product Code": row.product_code || "",
        "Product Name": row.type === "total" ? "" : row.name || "",
      };

      // Add remaining columns
      return {
        ...baseData,
        Cost: row.type !== "detail" ? "" : Number(row.cost).toFixed(2),
        Price: row.type !== "detail" ? "" : Number(row.price).toFixed(2),
        Quantity: row.qty,
        "Total Cost":
          row.type === "detail"
            ? Number((row.cost * row.qty).toFixed(2))
            : Number(row.cost.toFixed(2)),
        "Total Price":
          row.type === "detail"
            ? Number((row.price * row.qty).toFixed(2))
            : Number(row.price.toFixed(2)),
      };
    });

    const filename = `Stock-Report-${moment(dateRange.from).format(
      "YYYY-MM-DD"
    )}-to-${moment(dateRange.to).format("YYYY-MM-DD")}-${Date.now()}`;

    await onGetExportExcel(
      excelData,
      filename,
      `Stock Report From ${moment(dateRange.from).format(
        "YYYY-MM-DD"
      )}-to-${moment(dateRange.to).format("YYYY-MM-DD")}`,
      {
        boldRows: ["GRAND TOTAL", "Category Summary", "Branch Summary"],
        title: `Stock Report From ${moment(dateRange.from).format(
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
