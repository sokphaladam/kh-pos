import { Order } from "@/classes/order";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAuthentication } from "contexts/authentication-context";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { format } from "date-fns";
import {
  ExternalLink,
  Eye,
  FileText,
  Mail,
  Phone,
  Printer,
  Undo2,
  UserCircle,
  UserCog,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import {
  OrderStatus,
  type OrderStatus as OrderStatusType,
} from "./order-status";
import { requestOrderPrintTime } from "@/app/hooks/use-query-order";

interface OrderTableProps {
  orders: Order[];
  onPrintReceipt: (orderId: string) => void;
  onViewDetail: (orderId: string) => void;
  onOpenMart: (orderId: string) => void;
  onReverseToDraft: (orderId: string, invoiceNo: number) => Promise<boolean>;
}

export function OrderTable({
  orders,
  onPrintReceipt,
  onViewDetail,
  onOpenMart,
  onReverseToDraft,
}: OrderTableProps) {
  const { setting } = useAuthentication();
  const { formatForDisplay } = useCurrencyFormat();
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  const POS = JSON.parse(
    setting?.data?.result?.find((f) => f.option === "TYPE_POS")?.value || "{}",
  ) || { system_type: "MART" };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return format(date, "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return format(date, "h:mm a");
    } catch {
      return "";
    }
  };

  const handleReverseToDraft = async (
    orderId: string,
    invoiceNo: number,
    tableNumber?: string,
  ) => {
    setProcessingOrder(orderId);
    try {
      const success = await onReverseToDraft(orderId, invoiceNo);
      if (success) {
        onOpenMart(tableNumber ? tableNumber : orderId);
      }
    } finally {
      setProcessingOrder(null);
    }
  };

  const handlePrintReceipt = async (orderId: string) => {
    setProcessingOrder(orderId);
    requestOrderPrintTime(orderId).finally(() => {
      onPrintReceipt(orderId);
      setProcessingOrder(null);
    });
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No orders found
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Complete a sale to create your first order, or adjust your filters
            to find existing orders.
          </p>
          <Button
            onClick={() =>
              window.open(
                ["MART", "CINEMA"].includes(POS.system_type)
                  ? "/admin/a/pos"
                  : "/admin/restaurant",
                "_blank",
              )
            }
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open{" "}
            {["MART", "CINEMA"].includes(POS.system_type)
              ? "POS"
              : "Restaurant"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Invoice</TableHead>
                <TableHead className="font-semibold">Date & Time</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-center">
                  Items
                </TableHead>
                <TableHead className="font-semibold text-right">
                  Total
                </TableHead>
                <TableHead className="font-semibold">Created By</TableHead>
                <TableHead className="font-semibold text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const menuItems = [
                  {
                    label: `Print Receipt (${order.printCount || 0})`,
                    icon: Printer,
                    onClick: () => handlePrintReceipt(order.orderId),
                  },
                  {
                    label: "View Details",
                    icon: Eye,
                    onClick: () => onViewDetail(order.orderId),
                  },
                ];

                if (order.orderStatus === "DRAFT") {
                  if (POS.system_type !== "MART" && order.tableNumber) {
                    menuItems.push({
                      label: `Open in Restaurant`,
                      icon: ExternalLink,
                      onClick: () => onOpenMart(order.tableNumber ?? ""),
                    });
                  } else if (POS.system_type === "MART") {
                    menuItems.push({
                      label: `Open in POS`,
                      icon: ExternalLink,
                      onClick: () => onOpenMart(order.orderId),
                    });
                  } else if (POS.system_type === "CINEMA") {
                    menuItems.push({
                      label: `Open in Cinema POS`,
                      icon: ExternalLink,
                      onClick: () => onOpenMart(order.orderId),
                    });
                  }
                }

                if (order.orderStatus === "COMPLETED") {
                  if (POS.system_type !== "MART" && order.tableNumber) {
                    menuItems.push({
                      label: "Reverse to Draft",
                      icon: Undo2,
                      onClick: () =>
                        handleReverseToDraft(
                          order.orderId,
                          order.invoiceNo,
                          order.tableNumber,
                        ),
                    });
                  } else if (
                    POS.system_type === "MART" ||
                    POS.system_type === "CINEMA"
                  ) {
                    menuItems.push({
                      label: "Reverse to Draft",
                      icon: Undo2,
                      onClick: () =>
                        handleReverseToDraft(order.orderId, order.invoiceNo),
                    });
                  }
                }

                return (
                  <TableRow
                    key={order.orderId}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="font-mono font-medium text-sm">
                        #{order.invoiceNo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {formatDate(order.paidAt ?? order.createdAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(order.paidAt ?? order.createdAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <OrderStatus
                        status={order.orderStatus as OrderStatusType}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center bg-muted rounded-full px-2 py-1 text-xs font-medium">
                        {order.items?.reduce(
                          (total, item) => total + item.qty,
                          0,
                        ) || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatForDisplay(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      {order.servedType === "customer" ? (
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <span className="inline-flex cursor-default items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                <UserCircle className="h-3.5 w-3.5" />
                                {order.customerLoader?.customerName ||
                                  "Customer"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="bg-popover text-popover-foreground border border-border shadow-lg p-0 rounded-lg"
                            >
                              <div className="flex flex-col min-w-[180px]">
                                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                                  <UserCircle className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm font-semibold">
                                    Customer Order
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1.5 px-3 py-2">
                                  {order.customerLoader?.customerName && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <UserCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                      <span>
                                        {order.customerLoader.customerName}
                                      </span>
                                    </div>
                                  )}
                                  {order.customerLoader?.phone && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                      <span>{order.customerLoader.phone}</span>
                                    </div>
                                  )}
                                  {order.customerLoader?.email && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                      <span>{order.customerLoader.email}</span>
                                    </div>
                                  )}
                                  {!order.customerLoader && (
                                    <span className="text-xs text-muted-foreground">
                                      No customer info
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm">
                          <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{order.createdBy?.fullname || "Unknown"}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <BasicMenuAction
                        value={order}
                        items={menuItems}
                        disabled={processingOrder === order.orderId}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4 p-4">
          {orders.map((order) => (
            <Card key={order.orderId} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono font-semibold text-sm">
                      #{order.invoiceNo}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div>{formatDate(order.createdAt)}</div>
                      <div>{formatTime(order.createdAt)}</div>
                    </div>
                  </div>
                  <OrderStatus
                    status={order.orderStatus as OrderStatusType}
                    size="sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Items</div>
                    <div className="font-medium">
                      {order.items?.reduce(
                        (total, item) => total + item.qty,
                        0,
                      ) || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Total</div>
                    <div className="font-semibold">
                      {formatForDisplay(order.totalAmount)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {order.servedType === "customer" ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex cursor-default items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              <UserCircle className="h-3 w-3" />
                              {order.customerLoader?.customerName || "Customer"}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-popover text-popover-foreground border border-border shadow-lg p-0 rounded-lg"
                          >
                            <div className="flex flex-col min-w-[180px]">
                              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                                <UserCircle className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-semibold">
                                  Customer Order
                                </span>
                              </div>
                              <div className="flex flex-col gap-1.5 px-3 py-2">
                                {order.customerLoader?.customerName && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <UserCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span>
                                      {order.customerLoader.customerName}
                                    </span>
                                  </div>
                                )}
                                {order.customerLoader?.phone && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span>{order.customerLoader.phone}</span>
                                  </div>
                                )}
                                {order.customerLoader?.email && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span>{order.customerLoader.email}</span>
                                  </div>
                                )}
                                {!order.customerLoader && (
                                  <span className="text-xs text-muted-foreground">
                                    No customer info
                                  </span>
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <UserCog className="h-3 w-3" />
                        {order.createdBy?.fullname || "Unknown"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePrintReceipt(order.orderId)}
                      className="h-8 w-8 p-0"
                    >
                      <Printer className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDetail(order.orderId)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {order.orderStatus === "DRAFT" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenMart(order.orderId)}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    {order.orderStatus === "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleReverseToDraft(order.orderId, order.invoiceNo)
                        }
                        disabled={processingOrder === order.orderId}
                        className="h-8 w-8 p-0"
                      >
                        <Undo2
                          className={cn(
                            "h-3 w-3",
                            processingOrder === order.orderId && "animate-spin",
                          )}
                        />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
