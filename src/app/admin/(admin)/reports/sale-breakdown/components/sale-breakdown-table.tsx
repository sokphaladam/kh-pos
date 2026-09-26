import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SaleByCategoryReportRow } from "@/app/api/report/sale-by-category/sale-by-category";

type SaleBreakdownTableProps = {
  data: SaleByCategoryReportRow[];
};

export function SaleBreakdownTable({ data }: SaleBreakdownTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-muted-foreground/70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-foreground">
          No data available
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try selecting a different date range.
        </p>
      </div>
    );
  }

  // Check if orderedAt column should be shown (when any detail row has orderedAt)
  const showOrderedAt = data.some(
    (row) => row.type === "detail" && row.orderedAt
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getRowStyle = (row: SaleByCategoryReportRow) => {
    switch (row.type) {
      case "total":
        return "bg-info/10 font-bold border-t-2 border-b-2 border-info/30";
      case "category":
        return "bg-muted font-semibold";
      case "detail":
        return "hover:bg-muted/40";
      default:
        return "";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "total":
        return (
          <svg
            className="w-4 h-4 text-info"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        );
      case "category":
        return (
          <svg
            className="w-4 h-4 text-muted-foreground"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="font-bold text-foreground/80">
              Product Code
            </TableHead>
            <TableHead className="font-bold text-foreground/80">
              Product Name
            </TableHead>
            {showOrderedAt && (
              <TableHead className="font-bold text-foreground/80">
                Ordered At
              </TableHead>
            )}
            <TableHead className="font-bold text-foreground/80 text-right">
              Quantity
            </TableHead>
            <TableHead className="font-bold text-foreground/80 text-right">
              Supply Price
            </TableHead>
            <TableHead className="font-bold text-foreground/80 text-right">
              Total Price
            </TableHead>
            <TableHead className="font-bold text-foreground/80 text-right">
              Modifier
            </TableHead>
            <TableHead className="font-bold text-foreground/80 text-right">
              Discount
            </TableHead>
            <TableHead className="font-bold text-foreground/80 text-right">
              Revenue
            </TableHead>
            <TableHead className="font-bold text-foreground/80 text-right">
              Profit
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index} className={getRowStyle(row)}>
              <TableCell className="font-mono text-sm">
                <div className="flex items-center gap-2">
                  {getTypeIcon(row.type)}
                  <span>{row.productCode || "-"}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className={row.type === "total" ? "text-info" : ""}>
                    {row.name || (row.type === "total" ? "GRAND TOTAL" : "-")}
                  </span>
                </div>
              </TableCell>
              {showOrderedAt && (
                <TableCell className="text-sm text-muted-foreground">
                  {row.orderedAt || "-"}
                </TableCell>
              )}
              <TableCell className="text-right font-medium">
                {formatCurrency(row.totalQty)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(row.supplyPrice)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(row.totalPrice)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(row.modifier)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(row.discount)}
              </TableCell>
              <TableCell className="text-right font-medium text-success">
                {formatCurrency(row.revenue)}
              </TableCell>
              <TableCell
                className={`text-right font-medium ${
 row.profit >= 0 ? "text-success" : "text-destructive"
 }`}
              >
                {formatCurrency(row.profit)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
