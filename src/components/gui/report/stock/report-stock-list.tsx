"use client";

import React from "react";
import { ResponseType } from "@/lib/types";
import { StockReportRow } from "@/app/api/report/stock/stock-list";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReportListProps {
  data: ResponseType<StockReportRow[]> | undefined;
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
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
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        No data available
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Try selecting a different date range.
      </p>
    </div>
  );
}

export function StockReportList({ data }: ReportListProps) {
  const reportData = data?.result || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getRowStyle = (row: StockReportRow) => {
    switch (row.type) {
      case "total":
        return "bg-blue-50 font-bold border-t-2 border-b-2 border-blue-300";
      case "warehouse":
        return "bg-gray-300 font-semibold";
      case "category":
        return "bg-gray-100 font-semibold";
      case "detail":
        return "hover:bg-gray-50";
      default:
        return "";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "total":
        return (
          <svg
            className="w-4 h-4 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        );
      case "warehouse":
        return (
          <svg
            className="w-4 h-4 text-gray-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 8l8-6 8 6v10a1 1 0 01-1 1H3a1 1 0 01-1-1V8zM6 15h2v-3h4v3h2v-5H6v5z" />
          </svg>
        );
      case "category":
        return (
          <svg
            className="w-4 h-4 text-gray-600"
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
            {reportData.length} {reportData.length === 1 ? "record" : "records"}
          </div>
        </div>
      </div>

      <div className="p-6">
        {reportData.length === 0 && <EmptyState />}
        {reportData.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold text-gray-700">
                    Product Code
                  </TableHead>
                  <TableHead className="font-bold text-gray-700">
                    Product Name
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 text-right">
                    Cost
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 text-right">
                    Price
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 text-right">
                    Quantity
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 text-right">
                    Total Cost
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 text-right">
                    Total Price
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((row, index) => {
                  return (
                    <TableRow key={index} className={getRowStyle(row)}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(row.type)}
                          <span>{row.product_code || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span
                            className={
                              row.type === "total" ? "text-blue-900" : ""
                            }
                          >
                            {row.name ||
                              (row.type === "total" ? "GRAND TOTAL" : "-")}
                          </span>
                        </div>
                      </TableCell>
                      {row.type === "detail" ? (
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.cost)}
                        </TableCell>
                      ) : (
                        <TableCell className="text-right font-medium" />
                      )}
                      {row.type === "detail" ? (
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.price)}
                        </TableCell>
                      ) : (
                        <TableCell className="text-right font-medium" />
                      )}
                      <TableCell className="text-right font-medium">
                        {formatCurrency(row.qty)}
                      </TableCell>
                      {row.type !== "detail" ? (
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.cost)}
                        </TableCell>
                      ) : (
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.cost * row.qty)}
                        </TableCell>
                      )}
                      {row.type !== "detail" ? (
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.price)}
                        </TableCell>
                      ) : (
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.price * row.qty)}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
