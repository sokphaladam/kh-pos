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
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
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
          <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-gray-400">
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
          "bg-gray-100 text-gray-600 border-gray-200";
        const date = order.paidAt ?? order.createdAt;
        return (
          <button
            key={order.orderId}
            onClick={() => onSelectOrder(order)}
            className="w-full text-left rounded-lg border border-gray-100 bg-white px-3 py-2.5 hover:border-blue-300 hover:bg-blue-50/40 transition-colors flex items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Receipt className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-sm font-medium text-gray-800 truncate">
                #{order.invoiceNo}
              </span>
              {date && (
                <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                  <Calendar className="h-3 w-3" />
                  {new Date(date).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold text-gray-900">
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
            <User className="h-6 w-6 text-blue-600" />
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
            <Card className="border-gray-200">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <History className="h-4 w-4 text-blue-500" />
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
            <Card className="border-gray-200 bg-gray-50/30">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <UserX className="h-12 w-12 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No Customer Selected
                </h3>
                <p className="text-sm text-gray-600 text-center">
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
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
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
