import React, { useState } from "react";
import { VoidOrderData } from "../types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import moment from "moment";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { Button } from "@/components/ui/button";
import { File, ChevronDown, ChevronRight, Package } from "lucide-react";
import { voidOrderLog } from "./void-order-log";

interface VoidOrderTableProps {
  data: VoidOrderData[];
}

export function VoidOrderTable({ data }: VoidOrderTableProps) {
  const { formatForDisplay } = useCurrencyFormat();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (orderId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedGroups(newExpanded);
  };
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            className="w-full h-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Data Found
        </h3>
        <p className="text-gray-500">
          No void orders found for the selected date range.
        </p>
      </div>
    );
  }

  const groupedData = data.reduce(
    (groups: Record<string, VoidOrderData[]>, item) => {
      const key = item.orderId;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {}
  );

  return (
    <div className="-m-6">
      {Object.entries(groupedData).map(([orderId, items]) => {
        const isExpanded = expandedGroups.has(orderId);
        const firstItem = items[0];
        const totalItems = items.length;
        const totalPrintLogAmount = items.reduce(
          (sum, item) =>
            sum + item.priceFromPrintLog * (item.qtyFromPrintLog || 0),
          0
        );
        const totalActualAmount = items.reduce(
          (sum, item) => sum + item.actualPrice * item.actualQty,
          0
        );
        const totalDiscrepancy = Math.abs(
          totalPrintLogAmount - totalActualAmount
        );

        return (
          <div
            key={orderId}
            className="border-x-0 border-y-[0.5px] border-gray-200 overflow-hidden transition-shadow duration-200 hover:shadow-md"
          >
            {/* Group Header */}
            <div
              className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-all duration-200 ease-in-out hover:shadow-sm"
              onClick={() => toggleGroup(orderId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="transition-transform duration-200 ease-in-out">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <Package className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {firstItem.invoice
                        ? `Invoice #${firstItem.invoice}`
                        : `Order`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {totalItems} item{totalItems !== 1 ? "s" : ""} •
                      {firstItem.printedAt
                        ? ` Printed: ${moment(firstItem.printedAt).format(
                            "MMM DD, YYYY HH:mm"
                          )}`
                        : " Not printed"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      Total: {formatForDisplay(totalActualAmount)}
                    </div>
                    {totalDiscrepancy > 0 && (
                      <div className="text-sm text-red-600 font-medium">
                        Discrepancy: {formatForDisplay(totalDiscrepancy)}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={
                      firstItem.status === "VOIDED"
                        ? "destructive"
                        : "secondary"
                    }
                    className={
                      firstItem.status === "VOIDED"
                        ? "bg-red-100 text-red-800 hover:bg-red-200"
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    }
                  >
                    {firstItem.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-25">
                      <TableHead>Product Details</TableHead>
                      <TableHead>
                        {firstItem.status === "VOIDED"
                          ? "Order By"
                          : "Checkout By"}
                      </TableHead>
                      <TableHead>Quantity Discrepancy</TableHead>
                      <TableHead>Amount Discrepancy</TableHead>
                      <TableHead>View Log</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => {
                      const amountFromPrintLog =
                        item.priceFromPrintLog * (item.qtyFromPrintLog || 0);
                      const actualAmount = item.actualPrice * item.actualQty;
                      return (
                        <TableRow
                          key={`${item.orderId}-${item.orderDetailId}-${index}`}
                          className="animate-in fade-in duration-200"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <TableCell>
                            <div className="text-sm text-gray-900">
                              {item.content.at(6)?.value || "N/A"}
                            </div>
                          </TableCell>
                          {item.status === "VOIDED" ? (
                            <TableCell className="text-sm text-gray-900">
                              {item.content.at(3).value || "N/A"}
                            </TableCell>
                          ) : (
                            <TableCell className="text-sm text-gray-900">
                              {item.payments && item.payments.length > 0
                                ? item.payments.at(0)?.createdBy?.fullname
                                : "N/A"}
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              <div className="text-sm">
                                <span className="text-gray-500">
                                  Print Log:
                                </span>
                                <span className="ml-1 font-medium text-gray-900">
                                  {item.qtyFromPrintLog ?? "N/A"}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">Actual:</span>
                                <span className="ml-1 font-medium text-gray-900">
                                  {item.actualQty}
                                </span>
                              </div>
                              {item.qtyFromPrintLog !== null &&
                                item.qtyFromPrintLog !== item.actualQty && (
                                  <div className="text-sm text-red-600 font-medium">
                                    Diff:{" "}
                                    {Math.abs(
                                      (item.qtyFromPrintLog || 0) -
                                        item.actualQty
                                    )}
                                  </div>
                                )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              <div className="text-sm">
                                <span className="text-gray-500">
                                  Print Log:
                                </span>
                                <span className="ml-1 font-medium text-gray-900">
                                  {formatForDisplay(amountFromPrintLog)}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">Actual:</span>
                                <span className="ml-1 font-medium text-gray-900">
                                  {formatForDisplay(actualAmount)}
                                </span>
                              </div>
                              {amountFromPrintLog !== actualAmount && (
                                <div className="text-sm text-red-600 font-medium">
                                  Diff:
                                  {formatForDisplay(
                                    Math.abs(amountFromPrintLog - actualAmount)
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size={"sm"}
                              onClick={() => {
                                voidOrderLog.show({
                                  content: item.content,
                                });
                              }}
                              variant={"outline"}
                            >
                              <File className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
