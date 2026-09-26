"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCallback, useState } from "react";
import {
  User,
  UserCheck,
  UserX,
  ArrowLeft,
  History,
  Receipt,
  Calendar,
} from "lucide-react";
import { Customer } from "@/classes/customer";
import { CustomerPicker } from "@/components/customer-picker";
import { Order } from "@/classes/order";
import { TicketCarousel } from "../cinema/ticket-reservation/ticket-carousel";
import { createSheet } from "@/components/create-sheet";
import { SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuthentication } from "contexts/authentication-context";
import {
  useQueryOrderList,
  useQueryPOSInfo,
} from "@/app/hooks/use-query-order";

interface DialogCustomerProps {
  customer?: Customer;
  walkIn?: Customer;
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-success/15 text-success border-success/20",
  PENDING: "bg-warning/15 text-warning border-warning/20",
  CANCELLED: "bg-destructive/15 text-destructive border-destructive/20",
  IN_PROGRESS: "bg-info/15 text-info border-info/20",
};

function OrderHistoryList({
  customerPhone,
  onSelectOrder,
}: {
  customerPhone: string;
  onSelectOrder: (order: Order) => void;
}) {
  const { data, isLoading } = useQueryOrderList({
    limit: 20,
    offset: 0,
    customerPhone,
  });

  const orders = data?.result?.orders ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/70">
        <Receipt className="h-8 w-8 mb-2" />
        <p className="text-sm">No order history found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {orders.map((order) => {
        const statusClass =
          STATUS_COLORS[order.orderStatus] ??
          "bg-muted text-muted-foreground border-border";
        const date = order.paidAt ?? order.createdAt;
        return (
          <button
            key={order.orderId}
            onClick={() => onSelectOrder(order)}
            className="w-full text-left rounded-lg border border-border bg-card px-3 py-2.5 hover:border-info/30 hover:bg-info/40 transition-colors flex items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Receipt className="h-4 w-4 text-muted-foreground/70 shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">
                #{order.invoiceNo}
              </span>
              {date && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground/70 shrink-0">
                  <Calendar className="h-3 w-3" />
                  {new Date(date).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold text-foreground">
                ${Number(order.totalAmount).toFixed(2)}
              </span>
              <Badge
                variant="outline"
                className={`text-xs px-1.5 py-0 ${statusClass}`}
              >
                {order.orderStatus}
              </Badge>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export const dialogOrderCustomer = createSheet<DialogCustomerProps, unknown>(
  ({ close, customer }) => {
    const { currentWarehouse } = useAuthentication();
    const queryPOSinfo = useQueryPOSInfo(currentWarehouse?.id || "");

    const [selectedCustomer, setSelectedCustomer] = useState<
      Customer | undefined
    >(customer);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const onSave = useCallback(() => {
      if (selectedCustomer) {
        close(selectedCustomer.id);
      } else {
        close(queryPOSinfo.data?.result?.posCustomerId);
      }
    }, [selectedCustomer, close, queryPOSinfo]);

    return (
      <>
        <SheetHeader className="space-y-3">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <User className="h-6 w-6 text-info" />
            Customer Information
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 relative mt-4">
          <CustomerPicker
            value={selectedCustomer}
            onChange={(c) => {
              setSelectedCustomer(c || undefined);
              setSelectedOrder(null);
            }}
            allowCreateNew={true}
            autoLeadingZero={true}
            label="Search Customer (Phone)"
          />

          {selectedCustomer && selectedOrder && (
            <TicketCarousel order={selectedOrder} />
          )}

          {selectedCustomer && !selectedOrder && (
            <Card className="border-border">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                  <History className="h-4 w-4 text-info" />
                  Order History
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <OrderHistoryList
                  customerPhone={selectedCustomer.phone}
                  onSelectOrder={setSelectedOrder}
                />
              </CardContent>
            </Card>
          )}

          {!selectedCustomer && (
            <Card className="border-border bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <UserX className="h-12 w-12 text-muted-foreground/70 mb-3" />
                <h3 className="text-lg font-medium text-foreground mb-1">
                  No Customer Selected
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  Search by name or phone number to find a customer, or type a
                  new name to create one.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <SheetFooter className="flex gap-3 mt-4">
          {selectedOrder && (
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={() => setSelectedOrder(null)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="default"
            onClick={onSave}
            className="flex items-center gap-2 bg-info hover:bg-info/90"
          >
            <UserCheck className="h-4 w-4" />
            {selectedCustomer
              ? "Confirm Customer"
              : "Continue without Customer"}
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: null },
);
