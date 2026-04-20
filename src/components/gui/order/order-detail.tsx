import { useQueryOrder } from "@/app/hooks/use-query-order";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  Combine,
  Printer,
  TicketsPlaneIcon,
  XCircle,
} from "lucide-react";
import React, { useCallback, useState } from "react";
import { DirectPrint } from "../pos/print/direct-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { OrderReturnInput } from "@/classes/order-return";
import { useMutationReturn } from "@/app/hooks/use-query-return";
import { toast } from "sonner";
import { OrderDetailItem } from "./order-detail-item";
import { useAuthentication } from "contexts/authentication-context";
import { orderDigitalTicket } from "./components/order-digital-ticket";
import PrintTicketClient from "./components/print-ticket-client";

interface Props {
  selectOrder: string;
}

export function OrderDetail(props: Props) {
  const { formatForDisplay, currencyCode } = useCurrencyFormat();
  const [printingOrder, setPrintingOrder] = useState<string | null>(null);
  const { data, isLoading, mutate } = useQueryOrder(props.selectOrder);
  const [returns, setReturns] = useState<OrderReturnInput[]>([]);
  const { trigger, isMutating } = useMutationReturn();
  const { setting } = useAuthentication();

  const onCreateReturn = useCallback(() => {
    if (returns.length > 0) {
      trigger(returns)
        .then((res) => {
          if ((res.result?.length || 0) > 0) {
            mutate();
            res.result?.map((x) => toast.success(`Return order #${x}`));
            setReturns([]);
          } else {
            toast.error(res.error);
          }
        })
        .catch(() => {
          toast.error("Failed to return order please try again!");
        });
    }
  }, [returns, trigger, mutate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" /> Completed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="h-3 w-3 mr-1" /> Cancelled
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="capitalize">
            {status.toLowerCase()}
          </Badge>
        );
    }
  };

  const discountAmount = Number(
    data?.result?.orderDetail.reduce(
      (a, b) => (a = a + Number(b.discountAmount)),
      0,
    ) || 0,
  );
  const sub_total = Number(
    data?.result?.orderDetail.reduce(
      (a, b) =>
        (a = a + Number(Number(b.price) * Number(b.qty))) +
        Number(b.modiferAmount),
      0,
    ) || 0,
  );

  const template =
    !setting?.isLoading && !setting?.isValidating
      ? setting?.data?.result
          ?.find((f) => f.option === "INVOICE_RECEIPT")
          ?.value?.split(",")[0]
      : "default";

  const receive =
    data?.result?.payments.reduce((a, b) => (a = a + Number(b.amountUsd)), 0) ||
    0;

  const change = receive <= 0 ? 0 : receive - (sub_total - discountAmount);

  const isMovie =
    (data?.result?.orderDetail.filter(
      (f) => f.reservation && f.reservation.length > 0,
    ).length || 0) > 0;

  return (
    <div>
      <div className="p-[1.12rem] border-b flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Order Details</h2>
          <p className="text-sm text-muted-foreground">
            {data?.result?.orderInfo.createdAt}
          </p>
        </div>
        <div className="flex gap-2">
          {returns.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onCreateReturn}
              disabled={isMutating}
            >
              <Combine className="h-4 w-4 mr-2" />
              Return
            </Button>
          )}
          {isMovie && (
            <>
              <Button
                variant={"outline"}
                size={"sm"}
                onClick={async () => {
                  if (data?.result?.orderInfo) {
                    await orderDigitalTicket.show({
                      order: {
                        ...data.result.orderInfo,
                        items: data.result.orderDetail,
                      },
                    });
                  }
                }}
              >
                <TicketsPlaneIcon className="h-4 w-4 mr-2" />
                Digital Ticket
              </Button>
              <PrintTicketClient
                reservations={
                  data?.result?.orderDetail
                    .map((x) => x.reservation?.map((r) => r).flat())
                    .flat()
                    .filter((r) => r !== undefined) || []
                }
                disabled={isMutating}
              />
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPrintingOrder(data?.result?.orderInfo.orderId || "")
            }
            disabled={isMutating}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              Invoice #{data?.result?.orderInfo.invoiceNo}
            </CardTitle>
            <div className="flex flex-col justify-end items-end gap-1">
              <div className="text-lg font-semibold">
                By {data?.result?.orderInfo.createdBy?.fullname}
              </div>
              {getStatusBadge(data?.result?.orderInfo.orderStatus || "")}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs text-nowrap">Product</TableHead>
                <TableHead className="text-right text-xs text-nowrap">
                  Price
                </TableHead>
                <TableHead className="text-center text-xs text-nowrap">
                  Qty
                </TableHead>
                <TableHead className="text-center text-xs text-nowrap">
                  Discount
                </TableHead>
                <TableHead className="text-right text-xs text-nowrap">
                  Total
                </TableHead>
                <TableHead className="text-right text-xs text-nowrap"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.result?.orderDetail.map((item, idx) => {
                return (
                  <OrderDetailItem
                    key={idx}
                    order={item}
                    id={props.selectOrder}
                    returns={returns}
                    setReturns={setReturns}
                  />
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created By</span>
              <span>{data?.result?.orderInfo.createdBy?.fullname}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Checkout By</span>
              <span>
                {data?.result?.payments[0]?.createdBy?.fullname ?? ""}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>
                {currencyCode === "KHR"
                  ? `${Math.round(Number(sub_total))}៛`
                  : formatForDisplay(Number(sub_total))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax Included</span>
              <span>({10}%)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span>
                {currencyCode === "KHR"
                  ? `${Math.round(discountAmount)}៛`
                  : formatForDisplay(discountAmount)}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>
                {currencyCode === "KHR"
                  ? `${Math.round(Number(sub_total - discountAmount))}៛`
                  : formatForDisplay(Number(sub_total - discountAmount))}
              </span>
            </div>

            {/* Payment Details */}
            {data?.result?.payments && data.result.payments.length > 0 && (
              <>
                <Separator className="my-2" />
                <div className="space-y-2">
                  <div className="font-medium text-sm">Payment Details</div>
                  {data.result.payments.map((payment, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {payment.paymentMethod || "Payment Method"} (
                          {currencyCode === "KHR"
                            ? payment.currency === "USD"
                              ? "KHR"
                              : "USD"
                            : payment.currency}
                          )
                        </span>
                        <span className="text-muted-foreground">
                          {formatForDisplay(Number(payment.amountUsd))}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium pt-2">
                    <span>Total Received</span>
                    <span>
                      {currencyCode === "KHR"
                        ? `${Math.round(Number(receive))}៛`
                        : formatForDisplay(Number(receive))}
                    </span>
                  </div>

                  <div className="flex justify-between font-medium">
                    <span>Change</span>
                    <span>
                      {currencyCode === "KHR"
                        ? `${Math.round(Number(change))}៛`
                        : formatForDisplay(Number(change))}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Hidden print component */}
      {printingOrder && (
        <DirectPrint
          orderId={props.selectOrder}
          onPrintComplete={() => setPrintingOrder(null)}
          type={template as unknown as "default" | "template-i" | "template-ch"}
        />
      )}
    </div>
  );
}
