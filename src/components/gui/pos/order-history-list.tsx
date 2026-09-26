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
      return <CheckCircle className="h-3 w-3 text-success" />;
    case "CANCELLED":
      return <XCircle className="h-3 w-3 text-destructive" />;
    case "PROCESSING":
      return <Truck className="h-3 w-3 text-info" />;
    case "DRAFT":
      return <Clock className="h-3 w-3 text-muted-foreground" />;
    default:
      return <Package className="h-3 w-3 text-muted-foreground" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
      return "text-success bg-success/10 border-success/20";
    case "CANCELLED":
      return "text-destructive bg-destructive/10 border-destructive/20";
    case "PROCESSING":
      return "text-info bg-info/10 border-info/20";
    case "DRAFT":
      return "text-muted-foreground bg-muted/40 border-border";
    default:
      return "text-muted-foreground bg-muted/40 border-border";
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
    <Card className={`border-info/20 bg-info/30 ${className}`}>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-info" />
              Order History
            </div>
            <Badge variant="outline" className="text-info border-info/30">
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
                      "flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-info/30 transition-colors",
                      booking.length > 0 ? "cursor-pointer" : ""
                    )}
                    onClick={() => onClickAction && onClickAction(order)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-info/15 flex items-center justify-center flex-shrink-0">
                        {booking.length > 0 ? (
                          <Ticket className="h-4 w-4 text-success" />
                        ) : (
                          <Receipt className="h-4 w-4 text-info" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground text-sm">
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
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                      <div className="flex items-center gap-1 text-success">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-medium text-sm">
                          {order.totalAmount
                            ? Number(order.totalAmount).toFixed(2)
                            : "0.00"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {order.items?.length || 0} item
                        {(order.items?.length || 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {orders.length > maxItems && (
              <div className="text-center py-2 border-t border-info/20">
                <p className="text-sm text-muted-foreground">
                  + {orders.length - maxItems} more order
                  {orders.length - maxItems !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <ShoppingCart className="h-8 w-8 text-muted-foreground/70 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-medium">
              No order history
            </p>
            <p className="text-xs text-muted-foreground">
              This customer hasn&apos;t made any purchases yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
