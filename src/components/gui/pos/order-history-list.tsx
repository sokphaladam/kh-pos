"use client";

import { Customer } from "@/classes/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Formatter } from "@/lib/formatter";
import {
  ShoppingCart,
  Receipt,
  DollarSign,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Ticket,
} from "lucide-react";
import { Order } from "@/classes/order";
import { cn } from "@/lib/utils";

interface OrderHistoryListProps {
  customer: Customer;
  showTitle?: boolean;
  maxItems?: number;
  className?: string;
  onClickAction?: (order: Order) => void;
}

const getStatusIcon = (status: string) => {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
      return <CheckCircle className="h-3 w-3 text-green-600" />;
    case "CANCELLED":
      return <XCircle className="h-3 w-3 text-red-600" />;
    case "PROCESSING":
      return <Truck className="h-3 w-3 text-blue-600" />;
    case "DRAFT":
      return <Clock className="h-3 w-3 text-gray-600" />;
    default:
      return <Package className="h-3 w-3 text-gray-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
      return "text-green-600 bg-green-50 border-green-200";
    case "CANCELLED":
      return "text-red-600 bg-red-50 border-red-200";
    case "PROCESSING":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "DRAFT":
      return "text-gray-600 bg-gray-50 border-gray-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

export function OrderHistoryList({
  customer,
  showTitle = true,
  maxItems = 10,
  className = "",
  onClickAction,
}: OrderHistoryListProps) {
  const orders = customer.orders || [];
  const displayOrders = orders.slice(0, maxItems);

  if (!showTitle && orders.length === 0) {
    return null;
  }

  return (
    <Card className={`border-blue-200 bg-blue-50/30 ${className}`}>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Order History
            </div>
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className="space-y-3">
        {orders.length > 0 ? (
          <>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {displayOrders.map((order, index) => {
                const booking = [];

                for (const item of order.items || []) {
                  for (const res of item.reservation || []) {
                    booking.push(res);
                  }
                }

                return (
                  <div
                    key={order.orderId || index}
                    className={cn(
                      "flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors",
                      booking.length > 0 ? "cursor-pointer" : ""
                    )}
                    onClick={() => onClickAction && onClickAction(order)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        {booking.length > 0 ? (
                          <Ticket className="h-4 w-4 text-green-600" />
                        ) : (
                          <Receipt className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 text-sm">
                            #{order.invoiceNo || "N/A"}
                          </p>
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getStatusColor(
                              order.orderStatus || ""
                            )}`}
                          >
                            {getStatusIcon(order.orderStatus || "")}
                            {order.orderStatus || "Unknown"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {order.paidAt
                              ? Formatter.dateTime(order.paidAt)
                              : order.createdAt
                              ? Formatter.dateTime(order.createdAt)
                              : "Unknown date"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-green-600">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-medium text-sm">
                          {order.totalAmount
                            ? Number(order.totalAmount).toFixed(2)
                            : "0.00"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {order.items?.length || 0} item
                        {(order.items?.length || 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {orders.length > maxItems && (
              <div className="text-center py-2 border-t border-blue-200">
                <p className="text-sm text-gray-600">
                  + {orders.length - maxItems} more order
                  {orders.length - maxItems !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">
              No order history
            </p>
            <p className="text-xs text-gray-500">
              This customer hasn&apos;t made any purchases yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
